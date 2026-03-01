#!/bin/bash
set -e

# Run migrations
.venv/bin/alembic upgrade head

# Start server
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
