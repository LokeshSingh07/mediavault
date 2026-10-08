# ☁️ CloudVault — Cloud-Native Architecture Diagrams

> Designed & Created by **Lokesh**  
> GitHub: [lokeshsingh07](https://github.com/lokeshsingh07) · LinkedIn: [lokeshsingh07](https://linkedin.com/in/lokeshsingh07) · Contact: [codewithlokesh.com/contact](https://codewithlokesh.com/contact)

---

## 🏛️ Diagram 1: High-Level End-to-End System Architecture

This diagram illustrates the complete 4-tier architecture of **CloudVault**, highlighting the separation between the React 19 client, Node.js control plane, AWS serverless media pipeline, and Groq AI intelligence tier.

```mermaid
flowchart TD
    subgraph Client ["💻 Client Tier (Frontend)"]
        UI["React 19 + Vite Dashboard"]
        State["TanStack Query & Router"]
        UI --> State
    end

    subgraph API ["⚡ Control Plane (Backend API)"]
        Server["Node.js & Express REST API"]
        DB[(MongoDB Database)]
        Auth["JWT Auth & Presigned URL Generator"]
        Server <--> DB
        Server <--> Auth
    end

    subgraph AWS ["☁️ AWS Infrastructure Tier"]
        S3["AWS S3 Bucket (Media Assets)"]
        CDN["Amazon CloudFront (CDN)"]
        Lambda["AWS Lambda (S3 Event Trigger)"]
        SQS["AWS SQS (Job Message Queue)"]
        ECR["AWS ECR (Docker Image Registry)"]
        Batch["AWS Batch / ECS (FFmpeg Workers)"]
        
        S3 -- "ObjectCreated Event" --> Lambda
        Lambda -- "Enqueue Job" --> SQS
        SQS -- "Trigger Job" --> Batch
        ECR -- "Pull Docker Container" --> Batch
        Batch -- "Upload Thumbnail & Metadata" --> S3
        S3 -- "Edge Distribution" --> CDN
    end

    subgraph AI ["🧠 AI Intelligence Tier"]
        GroqWhisper["Groq Whisper AI (Speech-to-Text)"]
        GroqLLM["Groq Llama 3 (Summaries & Q&A)"]
    end

    %% Interactions
    Client <-->|"REST / Presigned Uploads"| Server
    Client <-->|"Direct S3 Presigned Upload"| S3
    Client <-->|"Fast CDN Media Streaming"| CDN
    Server <-->|"S3 SDK & Presigned URLs"| S3
    Server <-->|"SQS / Batch Job Dispatch"| SQS
    Server <-->|"Audio Stream Transcribe"| GroqWhisper
    GroqWhisper --> GroqLLM
    Batch -->|"Update Metadata DB"| DB
```

---

## ⚙️ Diagram 2: Asynchronous AWS Media Pipeline Flow

This sequence diagram details the event-driven workflow when a user uploads media to S3, triggering background Lambda events, SQS queuing, and AWS Batch containerized video processing.

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User / Client
    participant API as ⚡ Express API
    participant S3 as 🪣 AWS S3 Bucket
    participant Lambda as ⚡ AWS Lambda
    participant SQS as 📩 AWS SQS Queue
    participant Batch as 🐳 AWS Batch Worker (Docker)
    participant DB as 🍃 MongoDB

    User->>API: 1. Request Presigned Upload URL
    API-->>User: 2. Return S3 Presigned URL
    User->>S3: 3. Direct Upload Video/Audio to S3
    S3->>Lambda: 4. Trigger s3:ObjectCreated Event
    Lambda->>SQS: 5. Push Media Processing Task
    SQS->>Batch: 6. Consume Task & Run FFmpeg Docker Container
    Batch->>S3: 7. Extract Metadata & Save Preview Thumbnail
    Batch->>DB: 8. Update File Document with Preview & Metadata
    User->>API: 9. Fetch Dashboard / File Updates
    API-->>User: 10. Return Processed File with CloudFront CDN Thumbnail
```

---

## 🤖 Diagram 3: Groq AI Speech-to-Text & Insights Pipeline

This diagram shows how audio and video files undergo high-speed AI processing for speech transcription, summary generation, and interactive Q&A extraction.

```mermaid
flowchart LR
    subgraph Trigger ["1. Request Phase"]
        User["User Clicks Transcribe"]
        API["Express API Handler"]
        User --> API
    end

    subgraph Fetch ["2. Data Pipeline"]
        S3["AWS S3 Media Asset"]
        Stream["Audio Stream Extractor"]
        API --> S3
        S3 --> Stream
    end

    subgraph Groq ["3. Groq AI Processing Engine"]
        Whisper["Groq Whisper API\n(Fast Speech-to-Text)"]
        Llama["Groq Llama 3 LLM\n(Summary, Key Points & Q&A)"]
        Stream --> Whisper
        Whisper -->|"Raw Transcript"| Llama
    end

    subgraph Persist ["4. Persistence & Presentation"]
        DB[(MongoDB Document)]
        UI["React 19 AI Insights Tab"]
        Llama -->|"Structured AI Result"| DB
        DB --> UI
    end
```

---

### 💡 LinkedIn Caption Idea for Lokesh:
> 🚀 Excited to share the architecture of **CloudVault** — cloud media vault & AI transcription platform!
> 
> ⚡ **Tech Stack**:
> - **Frontend**: React 19, Vite, Tailwind CSS, TanStack Query/Router
> - **Backend**: Node.js, Express, MongoDB, JWT
> - **Cloud & Serverless**: AWS S3, CloudFront CDN, AWS Lambda, AWS SQS, AWS Batch (Docker on ECR)
> - **AI Engine**: Groq AI (Whisper Speech-to-Text & Llama 3)
> 
> Check out the project on GitHub: https://github.com/lokeshsingh07
> Portfolio & Contact: https://codewithlokesh.com/contact
