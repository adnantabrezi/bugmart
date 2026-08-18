#!/bin/sh
set -e

echo "=== BugMart Single Container Render Boot (v2.0 - Fixed Entrypoint) ==="

# Create directories individually
mkdir -p /var/lib/postgresql/data
mkdir -p /var/run/postgresql
mkdir -p /run/postgresql
mkdir -p /var/log/postgresql

# Ensure ownership without throwing errors on symlinks
chown -R postgres:postgres /var/lib/postgresql || true
chown -R postgres:postgres /var/run/postgresql || true
chown -R postgres:postgres /var/log/postgresql || true

# Initialize PostgreSQL data directory if not already created
if [ ! -d "/var/lib/postgresql/data/base" ]; then
  echo "[PostgreSQL] Initializing data directory..."
  su-exec postgres initdb -D /var/lib/postgresql/data
  
  # Configure postgres auth & networking
  echo "host all all 0.0.0.0/0 trust" >> /var/lib/postgresql/data/pg_hba.conf
  echo "local all all trust" >> /var/lib/postgresql/data/pg_hba.conf
  echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf
fi

# Start PostgreSQL server in background
echo "[PostgreSQL] Starting database daemon..."
su-exec postgres pg_ctl -D /var/lib/postgresql/data -l /var/log/postgresql/logfile start || {
  echo "[PostgreSQL ERROR] Failed to start daemon. Log:"
  cat /var/log/postgresql/logfile || true
  exit 1
}

# Wait for PostgreSQL to be ready (max 15 retries)
TRIES=0
until su-exec postgres pg_isready -h 127.0.0.1 -p 5432 || [ $TRIES -ge 15 ]; do
  echo "[PostgreSQL] Waiting for database connection... ($TRIES/15)"
  TRIES=$((TRIES+1))
  sleep 1
done

if [ $TRIES -ge 15 ]; then
  echo "[PostgreSQL ERROR] Database startup timed out. Log output:"
  cat /var/log/postgresql/logfile || true
  exit 1
fi

echo "[PostgreSQL] Database engine is ready!"

# Create bugmart database if not existing
su-exec postgres psql -h 127.0.0.1 -U postgres -c "CREATE DATABASE bugmart;" || true
su-exec postgres psql -h 127.0.0.1 -U postgres -c "ALTER USER postgres PASSWORD '1234';" || true

echo "[Prisma] Generating client & pushing schema..."
cd /app/backend
export DATABASE_URL="postgresql://postgres:1234@127.0.0.1:5432/bugmart?schema=public"
npx prisma generate
npx prisma db push

echo "[Prisma] Seeding database products & users..."
npx ts-node prisma/seed.ts

echo "[BugMart] Launching server process on PORT ${PORT:-10000}..."
exec node dist/server.js
