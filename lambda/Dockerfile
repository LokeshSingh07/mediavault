FROM public.ecr.aws/lambda/nodejs:22

RUN dnf install -y tar xz \
    && curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz \
    && tar -xf /tmp/ffmpeg.tar.xz -C /tmp \
    && cp /tmp/ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ffmpeg \
    && cp /tmp/ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ffprobe \
    && chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe \
    && rm -rf /tmp/ffmpeg* \
    && dnf clean all

COPY package*.json ${LAMBDA_TASK_ROOT}/

RUN npm ci --omit=dev

COPY . ${LAMBDA_TASK_ROOT}/

CMD ["index.handler"]