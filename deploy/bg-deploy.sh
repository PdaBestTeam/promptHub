set -euo pipefail


IMAGE="${1:-}"
KEEP_OLD=false

for arg in "$@"; do
  if [[ "$arg" == "--keep-old" ]]; then
    KEEP_OLD=true
  fi
done

if [[ -z "$IMAGE" ]]; then
  echo "[ERROR] IMAGE 인수가 필요합니다."
  echo "  사용법: $0 <IMAGE> [--keep-old]"
  exit 1
fi

 
ENV_FILE="/home/ubuntu/app/.env.production"
UPSTREAM_CONF="/etc/nginx/conf.d/prompthub_upstream.conf"
HEALTH_PATH="/api/health"
HEALTH_RETRIES=12        
HEALTH_INTERVAL=5       

BLUE_NAME="prompthub-blue"
GREEN_NAME="prompthub-green"
BLUE_PORT=3001
GREEN_PORT=3002
CONTAINER_PORT=3000


echo "[INFO] 현재 활성 컨테이너 감지 중..."

BLUE_RUNNING=false
GREEN_RUNNING=false

docker ps --format '{{.Names}}' | grep -q "^${BLUE_NAME}$"  && BLUE_RUNNING=true  || true
docker ps --format '{{.Names}}' | grep -q "^${GREEN_NAME}$" && GREEN_RUNNING=true || true

if $BLUE_RUNNING; then
  CURRENT="blue"
  TARGET="green"
  TARGET_NAME="$GREEN_NAME"
  TARGET_PORT="$GREEN_PORT"
  OLD_NAME="$BLUE_NAME"
elif $GREEN_RUNNING; then
  CURRENT="green"
  TARGET="blue"
  TARGET_NAME="$BLUE_NAME"
  TARGET_PORT="$BLUE_PORT"
  OLD_NAME="$GREEN_NAME"
else
  echo "[INFO] 실행 중인 컨테이너 없음 → blue 슬롯으로 최초 배포"
  CURRENT="none"
  TARGET="blue"
  TARGET_NAME="$BLUE_NAME"
  TARGET_PORT="$BLUE_PORT"
  OLD_NAME=""
fi

echo "[INFO] 현재 슬롯: ${CURRENT} → 배포 대상 슬롯: ${TARGET} (포트 ${TARGET_PORT})"

# 이미지 pull
echo "[INFO] 이미지 pull: $IMAGE"
docker pull "$IMAGE"

 
if docker ps -a --format '{{.Names}}' | grep -q "^${TARGET_NAME}$"; then
  echo "[INFO] 기존 ${TARGET_NAME} 컨테이너 제거"
  docker rm -f "$TARGET_NAME" || true
fi

# 새 컨테이너
echo "[INFO] ${TARGET_NAME} 컨테이너 시작 (포트 ${TARGET_PORT}:${CONTAINER_PORT})"
docker run -d \
  --name "$TARGET_NAME" \
  --restart unless-stopped \
  -p "127.0.0.1:${TARGET_PORT}:${CONTAINER_PORT}" \
  --env-file "$ENV_FILE" \
  "$IMAGE"

 
echo "[INFO] Health check 시작 (http://127.0.0.1:${TARGET_PORT}${HEALTH_PATH})"
SUCCESS=false

for i in $(seq 1 "$HEALTH_RETRIES"); do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "http://127.0.0.1:${TARGET_PORT}${HEALTH_PATH}" || echo "000")

  if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "[INFO] Health check 성공 (시도 ${i}/${HEALTH_RETRIES}, HTTP ${HTTP_STATUS})"
    SUCCESS=true
    break
  fi

  echo "[WARN] Health check 실패 (시도 ${i}/${HEALTH_RETRIES}, HTTP ${HTTP_STATUS}) → ${HEALTH_INTERVAL}초 후 재시도..."
  sleep "$HEALTH_INTERVAL"
done

 
if ! $SUCCESS; then
  echo "[ERROR] Health check 실패 → 새 컨테이너 제거 후 배포 중단"
  docker rm -f "$TARGET_NAME" || true
  exit 1
fi

 
echo "[INFO] Nginx upstream → ${TARGET} (127.0.0.1:${TARGET_PORT}) 로 전환"

sudo /usr/bin/tee "$UPSTREAM_CONF" > /dev/null <<EOF
upstream prompthub_upstream {
    server 127.0.0.1:${TARGET_PORT};
}
EOF

 
sudo /usr/sbin/nginx -t

 
sudo /bin/systemctl reload nginx
echo "[INFO] Nginx reload 완료"

 
if [[ -n "$OLD_NAME" ]]; then
  if $KEEP_OLD; then
    echo "[INFO] --keep-old 옵션: ${OLD_NAME} 컨테이너를 유지합니다."
    echo "       수동 롤백 시: sudo systemctl reload nginx 전에 upstream을 이전 포트로 되돌리세요."
  else
    echo "[INFO] 기존 ${OLD_NAME} 컨테이너 중지 및 제거"
    docker stop "$OLD_NAME" || true
    docker rm   "$OLD_NAME" || true
  fi
fi

 
echo ""
echo "✅ Blue/Green 배포 완료!"
echo "   활성 슬롯 : ${TARGET} (port ${TARGET_PORT})"
echo "   이미지    : ${IMAGE}"
echo "   ENV 파일  : ${ENV_FILE}"
