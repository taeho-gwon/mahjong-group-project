#!/bin/sh
set -e

STAGING_DIR="/app/dist-new"
SERVE_DIR="/usr/share/nginx/html"

# Copy new assets over existing volume (merge, not replace)
# This preserves old hashed asset files while adding new ones
if [ -d "$STAGING_DIR/assets" ]; then
  cp -r "$STAGING_DIR/assets/"* "$SERVE_DIR/assets/" 2>/dev/null || true
fi

# Copy non-asset files (index.html, favicon, etc.)
find "$STAGING_DIR" -maxdepth 1 -type f -exec cp {} "$SERVE_DIR/" \;

# Clean up assets older than 7 days
find "$SERVE_DIR/assets" -type f -mtime +7 -delete 2>/dev/null || true

# Start nginx
exec nginx -g 'daemon off;'
