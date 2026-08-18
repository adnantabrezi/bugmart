FROM node:18-alpine

# Install PostgreSQL, su-exec, OpenSSL, and system utilities
RUN apk add --no-cache postgresql postgresql-contrib su-exec bash openssl

WORKDIR /app

# Copy backend dependencies and schema
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/prisma ./backend/prisma/
RUN cd backend && npm install

# Copy frontend dependencies and config
COPY frontend/package*.json ./frontend/
COPY frontend/tsconfig*.json ./frontend/
COPY frontend/vite.config.ts ./frontend/
COPY frontend/index.html ./frontend/
RUN cd frontend && npm install

# Copy full source code
COPY backend/src ./backend/src/
COPY frontend/src ./frontend/src/

# Build frontend static files & backend TypeScript
RUN cd frontend && npm run build
RUN cd backend && npm run build

# Cache buster marker v2.0
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

# Environment
ENV PORT=10000
ENV NODE_ENV=production
ENV DATABASE_URL="postgresql://postgres:1234@localhost:5432/bugmart?schema=public"
ENV JWT_SECRET="bugmart_super_secret_classroom_key_2026"

EXPOSE 10000

ENTRYPOINT ["/app/entrypoint.sh"]
