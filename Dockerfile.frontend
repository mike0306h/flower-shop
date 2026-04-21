# SSR 模式 - Next.js Node.js 服务器
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 接收构建参数
ARG NEXT_PUBLIC_API_URL=https://api.bkkflowers.com
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 安装依赖并构建
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产运行阶段
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 只复制必要文件
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static/
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
