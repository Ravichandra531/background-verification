#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Starting API server..."
exec node dist/index.js
