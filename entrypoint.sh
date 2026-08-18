#!/bin/sh
set -e

echo "=== BugMart Single Container Render Boot ==="

# Ensure postgres directories exist with proper ownership
mkdir -p /var/lib/postgresql/data /run/postgresql /var/log/postgresql
chown -R postgres:postgres /var/lib/postgresql /run/postgresql /var/log/postgresql

# Initialize PostgreSQL data directory if not already created
if [ ! -d "/var/lib/postgresql/data/base" ]; then
  echo "[PostgreSQL] Initializing data directory..."
  su-exec postgres initdb -D /var/lib/postgresql/data
  
  # Configure postgres auth
  echo "host all all 127.0.0.1/32 trust" >> /var/lib/postgresql/data/pg_hba.conf
  echo "local all all trust" >> /var/lib/postgresql/data/pg_hba.conf
fi

# Start PostgreSQL server in background
echo "[PostgreSQL] Starting database daemon..."
su-exec postgres pg_ctl -D /var/lib/postgresql/data -l /var/log/postgresql/logfile start

# Wait for PostgreSQL to be ready
until su-exec postgres pg_isready; do
  echo "[PostgreSQL] Waiting for database daemon..."
  sleep 1
done

# Create bugmart database if not existing
echo "[PostgreSQL] Ensuring bugmart database exists..."
su-exec postgres psql -c "CREATE DATABASE bugmart;" || true
su-exec postgres psql -c "ALTER USER postgres PASSWORD '1234';" || true

echo "[Prisma] Running schema push & database seeding..."
cd /app/backend
export DATABASE_URL="postgresql://postgres:1234@localhost:5432/bugmart?schema=public"
npx prisma db push
npx ts-node prisma/seed.ts

echo "[BugMart] Launching server on PORT ${PORT:-10000}..."
exec node dist/server.js
