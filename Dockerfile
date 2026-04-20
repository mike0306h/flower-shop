FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache tzdata
# Copy static files
COPY --from=builder /app/.next/static /usr/share/nginx/html/_next/static
# Copy pages (Next.js static export)
COPY --from=builder /app/.next/server/pages /usr/share/nginx/html
# Default index
RUN echo '<!DOCTYPE html><html><head><title>Loading</title></head><body><div id="__next"></div></body></html>' > /usr/share/nginx/html/index.html
