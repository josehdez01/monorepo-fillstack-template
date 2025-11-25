#!/usr/bin/env bash
set -euo pipefail
: "${R2_BUCKET:?R2_BUCKET is required}"
: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID is required}"
# Optional: R2_PREFIX defaults injected below per-app
AWS_REGION="${AWS_REGION:-auto}" export AWS_REGION
DEST="s3://$R2_BUCKET/${R2_PREFIX:-user}"
ENDPOINT="https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com"

echo "Deploying to $DEST via $ENDPOINT"
# Remove any remote files not present locally to avoid stale assets
aws s3 rm "$DEST" --recursive --endpoint-url="$ENDPOINT"
# Upload non-HTML assets with long immutable caching
aws s3 cp dist "$DEST" \
  --recursive \
  --exclude "*.html" \
  --cache-control "public,max-age=31536000,immutable" \
  --endpoint-url="$ENDPOINT"
# Upload HTML with no-cache to allow instant updates
aws s3 cp dist "$DEST" \
  --recursive \
  --exclude "*" --include "*.html" \
  --cache-control "public,max-age=0,must-revalidate" \
  --content-type "text/html" \
  --endpoint-url="$ENDPOINT"

echo "Deploy complete: $DEST"
