# Media Processing Architecture Options

## Problem 1 — Thumbnail Generation

This architecture eliminates EC2 involvement for thumbnail generation and avoids bandwidth costs between S3 and EC2.

```text
Upload to S3
     ↓
S3 Event → Lambda fires automatically
     ↓
Lambda downloads file (FREE, same AWS network)
Lambda generates thumbnail + blurhash
Lambda uploads thumbnail back to S3 (FREE, same network)
Lambda updates MongoDB
     ↓
EC2 never touches the file
```

### Benefits
- No EC2 bandwidth usage
- Automatic scaling
- Lower infrastructure cost
- Faster processing pipeline
- Fully event-driven

---

## Problem 2 — AI Processing Architecture

### Option A — Current Architecture (EC2 + Groq)

```text
S3 → EC2 downloads video
EC2 extracts audio (ffmpeg)
EC2 sends audio to Groq
Groq returns transcript
EC2 sends transcript to Llama
```

#### Drawbacks
- S3 → EC2 bandwidth cost
- EC2 memory pressure for large videos
- Additional infrastructure management
- Groq TPM limitations

---

### Option B — Lambda + Groq

```text
S3 → Lambda downloads video (FREE)
Lambda extracts audio (ffmpeg layer)
Lambda sends audio to Groq
Groq returns transcript
Lambda sends transcript to Llama
Lambda saves results to MongoDB
```

#### Benefits
- Eliminates EC2 download costs
- Serverless scaling
- Lower operational overhead

#### Remaining Cost
- Outbound traffic to Groq API is unavoidable

---

### Option C — AWS-Native Processing (Recommended)

```text
S3 File
    ↓
AWS Transcribe reads directly from S3
    ↓
Transcript written to S3
    ↓
Lambda reads transcript
    ↓
Amazon Bedrock processes transcript
    ↓
MongoDB update
```

#### Benefits
- Zero video download bandwidth cost
- Entire workflow remains inside AWS
- Highly scalable
- Simpler architecture
- Better reliability

#### Cost Characteristics
- S3 ↔ Transcribe: Internal AWS traffic
- Transcribe output: Small text files
- Bedrock input: Text only
- Minimal network transfer

---

## Recommended Hybrid Architecture

### Thumbnail Processing

```text
S3 Upload
    ↓
Lambda
    ↓
Thumbnail + BlurHash
    ↓
MongoDB Update
```

### AI Processing

```text
S3 Upload
    ↓
SQS/EventBridge
    ↓
AWS Transcribe
    ↓
Bedrock / LLM Analysis
    ↓
MongoDB Update
```

### Why This Is Best

1. No large video downloads to EC2.
2. Event-driven and scalable.
3. Minimal bandwidth costs.
4. AWS-managed services reduce operational burden.
5. Easier monitoring and failure handling.