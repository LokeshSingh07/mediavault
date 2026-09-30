# Upload Flow & Thumbnail Generation

This document describes what happens when a user uploads a file from the frontend, the three upload methods supported (direct, presigned, multipart), how S3 triggers a Lambda to generate thumbnails, and the difference between the `/upload/` and `/thumbnail/` endpoints.

## Overview
- User interacts with the frontend to upload a file.
- The frontend and backend coordinate to validate, authenticate, and persist file metadata.
- The file is uploaded to S3 (one of three methods). Once in S3, an S3 event can trigger a Lambda that generates a thumbnail and writes it back to S3 (and updates metadata in the backend).

## Frontend upload flow (typical)
1. User selects a file in the browser UI and clicks upload.
2. Frontend optionally requests an upload slot / presigned data from the backend (`/upload/` route).
3. Frontend uploads file to S3 or sends file to backend depending on the chosen upload method.
4. Backend persists a file record (metadata) in the DB: filename, size, mime, owner, status (processing/uploaded), s3Key, etc.
5. S3 emits an event (e.g., `s3:ObjectCreated:Put`) that triggers the thumbnail-generation Lambda.
6. Lambda downloads the object, generates a thumbnail (image or first-frame for video), stores thumbnail in a thumbnails path in S3, and updates the backend (or emits a message) so the file record links to the thumbnail.

## Three upload types

1) Direct upload (via backend proxy)
- Flow: Frontend -> backend `/upload/` endpoint -> backend streams upload to S3.
- Backend handles authentication, validation, and applies server-side limits and rate limiting.
- Pros: backend controls upload, simple for client, immediate DB record creation.
- Cons: backend bandwidth and memory usage; less scalable for large files.
- Use when: small files, need server-side processing or strict audit/validation before S3.

2) Presigned upload (recommended for most cases)
- Flow: Frontend requests presigned URL from backend (e.g., POST `/upload/presign`), backend returns a presigned S3 URL, frontend uploads file directly to S3 using that URL.
- Pros: offloads bandwidth from backend, secure (short-lived signatures), scalable.
- Cons: requires careful ACLs and lifecycle rules; client must handle upload errors and retries.
- Server responsibilities: generate presigned URL, create DB record (or create on callback), validate permissions.

3) Multipart upload (for large files / resumable uploads)
- Flow: Backend initiates a multipart upload on S3 (returns uploadId and presigned part URLs) or the frontend uses S3 multipart APIs with server-signed part URLs; client uploads parts, then backend (or client) completes the multipart upload.
- Pros: resumable, handles very large files, can parallelize part uploads.
- Cons: more complex to implement, need to manage part signatures and cleanup of incomplete uploads.
- Use when: files > ~100MB or unreliable client network.

## S3 -> Lambda thumbnail generation
- Trigger: S3 bucket is configured to send `ObjectCreated` events to a Lambda (see [mediavault backend/lambda/index.js](mediavault backend/lambda/index.js)).
- Lambda steps:
  1. Receive S3 event containing bucket and object key.
  2. Download object (or stream it) from S3.
  3. Generate thumbnail:
     - For images: resize and create a smaller image.
     - For videos: extract a frame (e.g., FFmpeg) and resize.
  4. Store thumbnail to a predefined key (e.g., `thumbnails/<original-key>.jpg`) in the same or a separate S3 bucket.
  5. Update backend metadata (file record) with thumbnail URL/key or send a message (SQS/DB update) so the frontend can show the thumbnail.
  6. Optionally emit logs/metrics and handle errors (mark file as `thumbnail_failed`).

Notes on Lambda permissions and sizes:
- Lambda needs permission to read from and write to the target S3 bucket, and permission to update any backend resources (e.g., via an API or DB credentials). For video thumbnails, the Lambda image must include FFmpeg or use a layer capable of media processing.

## Why `/upload/` and `/thumbnail/` are both present
- `/upload/` (or related upload endpoints):
  - Responsibilities: authentication, validate file size/type, enforce storage quotas, create file metadata records, provide presigned URLs or accept proxied uploads, and return a file id/metadata to the client.
  - This is the main entry point for placing files into storage and creating their records.

- `/thumbnail/` (or thumbnail-serving endpoints):
  - Responsibilities: serve or proxy generated thumbnails, possibly apply caching, resizing on-the-fly, and access control.
  - Thumbnails are generated asynchronously by the Lambda after S3 upload; `/thumbnail/` lets the frontend fetch a smaller, optimized image for listings or previews.

Why separate them?
- Separation of concerns: upload endpoints focus on ingestion and metadata. Thumbnail endpoints focus on serving previews and caching. Keeping them separate simplifies permissions, caching policies, and scaling.

## Example sequence (presigned upload)
1. Frontend: POST `/upload/presign` with filename, size, mime.
2. Backend: validate user & quota, create DB file row with status `pending`, return presigned PUT URL and s3Key.
3. Frontend: PUT file to presigned S3 URL.
4. S3: stores object and emits `ObjectCreated` event.
5. Lambda: runs, creates thumbnail at `thumbnails/s3Key`, updates DB file row `thumbnailUrl` and sets status to `uploaded`/`ready`.
6. Frontend polls or listens for updates and displays thumbnail via `/thumbnail/` or direct S3 URL (if public/cdn).

## Security & best practices (brief)
- Always authenticate and authorize presign requests.
- Restrict presigned URLs to write only, with short TTL.
- Validate file type/size server-side even if validated client-side.
- Clean up incomplete multipart uploads (S3 lifecycle rules or scheduled job).
- Use a CDN for serving thumbnails and large assets in production.

## Where to look in this repo
- Lambda thumbnail logic: [mediavault backend/lambda/index.js](mediavault backend/lambda/index.js)
- Backend upload routes & controllers: check `src/routes` and `src/controllers` in the backend for `upload` and `file` handlers.

