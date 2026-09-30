FROM public.ecr.aws/lambda/nodejs:22

COPY package*.json ${LAMBDA_TASK_ROOT}/

RUN npm ci --omit=dev

COPY . ${LAMBDA_TASK_ROOT}/

CMD ["index.handler"]