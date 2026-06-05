# ── Build Stage ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --silent
COPY . .
RUN npm run build

# ── Production Stage (Nginx) ────────────────────────────────
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html

# SPA fallback — all routes → index.html
RUN echo 'server { \
  listen 80; \
  root /usr/share/nginx/html; \
  index index.html; \
  location / { try_files $uri $uri/ /index.html; } \
  location ~* \.(js|css|png|jpg|ico|svg|woff2?)$ { expires 1y; add_header Cache-Control "public,immutable"; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

