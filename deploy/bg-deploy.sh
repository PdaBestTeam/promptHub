#!/usr/bin/env bash
set -euo pipefail

APP_NAME="prompthub"
IMAGE="prompthub:latest"
BLUE_PORT=3001
GREEN_PORT=3002
UPSTREAM_CONF="/etc/nginx/conf.d/prompthub_upstream.conf"
ENV_FILE="/home/ubuntu/app/.env.production"
HEALTH_URL="/api/health"

ACTIVE="blue"
if grep -q "3002" "$UPSTREAM_CONF"; then ACTIVE="green"; fi

if [ "$ACTIVE" = "blue" ]; then
  TARGET="green"; TARGET_PORT=$GREEN_PORT;
else
  TARGET="blue"; TARGET_PORT=$BLUE_PORT;
fi

echo "Active: $ACTIVE -> Deploying: $TARGET ($TARGET_PORT)"

docker rm -f "${APP_NAME}-${TARGET}" >/dev/null 2>&1 || true

docker run -d \
  --name "${APP_NAME}-${TARGET}" \
  --restart unless-stopped \
  --env-file "$ENV_FILE" \
  -p "127.0.0.1:${TARGET_PORT}:3000" \
  "$IMAGE"

echo "Health checking..."
for i in {1..30}; do
  if curl -fsS "http://127.0.0.1:${TARGET_PORT}${HEALTH_URL}" >/dev/null; then
    echo "Healthy!"
    break
  fi
  sleep 1
  if [ "$i" -eq 30 ]; then
    echo "Health check failed"
    docker logs --tail=200 "${APP_NAME}-${TARGET}" || true
    exit 1
  fi
done

echo "Switching upstream -> ${TARGET_PORT}"
sudo tee "$UPSTREAM_CONF" >/dev/null <<EOF
upstream prompthub_upstream { server 127.0.0.1:${TARGET_PORT}; }
EOF

sudo nginx -t
sudo systemctl reload nginx

echo "Stopping old container: ${APP_NAME}-${ACTIVE}"
docker rm -f "${APP_NAME}-${ACTIVE}" >/dev/null 2>&1 || true

echo "Done!"
