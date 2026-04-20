FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL=https://api.bkkflowers.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
RUN apk add --no-cache tzdata

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files (.next directory, not _next)
COPY --from=builder /app/.next/static /usr/share/nginx/html/.next/static
COPY --from=builder /app/.next/server/pages /usr/share/nginx/html

# Copy next.js build artifacts
COPY --from=builder /app/.next /usr/share/nginx/html/.next
