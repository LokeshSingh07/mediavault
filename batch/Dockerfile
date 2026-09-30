FROM node:22-slim

# Install FFmpeg and required tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy worker application
COPY . .

# Start AWS Batch worker
CMD ["node", "worker.js"]   