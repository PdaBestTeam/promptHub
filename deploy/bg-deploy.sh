#!/usr/bin/env bash
# =============================================================================
# Blue/Green Zero-Downtime Deploy Script for PromptHub
# =============================================================================
# 사용법:
#   ./bg-deploy.sh <IMAGE> [--keep-old]
#
#   IMAGE    : ghcr.io/<owner>/<repo>/prompthub:latest  (필수)
#   --keep-old : old 컨테이너를 내리지 않고 유지 (rollback용, 옵션)
#
# 필수 파일:
#   /home/ubuntu/app/.env.production  (GitHub Actions가 배포 전 생성)
#
# sudoers 설정 필요 (최소권한):
#   ubuntu ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx, /usr/sbin/nginx -t, /usr/bin/tee /etc/nginx/conf.d/prompthub_upstream.conf
# =============================================================================

set -euo pipefail

# ── 인수 파싱 ──────────────────────────────────────────────────────────────────
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

# ── 상수 ──────────────────────────────────────────────────────────────────────
ENV_FILE="/home/ubuntu/app/.env.production"
UPSTREAM_CONF="/etc/nginx/conf.d/prompthub_upstream.conf"
HEALTH_PATH="/api/health"
HEALTH_RETRIES=12       # 최대 시도 횟수
HEALTH_INTERVAL=5       # 초 간격

BLUE_NAME="prompthub-blue"
GREEN_NAME="prompthub-green"
BLUE_PORT=3001
GREEN_PORT=3002
CONTAINER_PORT=3000

# ── 현재 활성 슬롯 감지 ────────────────────────────────────────────────────────
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
  # 둘 다 없으면 blue를 새로 띄움
  echo "[INFO] 실행 중인 컨테이너 없음 → blue 슬롯으로 최초 배포"
  CURRENT="none"
  TARGET="blue"
  TARGET_NAME="$BLUE_NAME"
  TARGET_PORT="$BLUE_PORT"
  OLD_NAME=""
fi

echo "[INFO] 현재 슬롯: ${CURRENT} → 배포 대상 슬롯: ${TARGET} (포트 ${TARGET_PORT})"

# ── 이미지 pull ──────────────────────────────────────────────────────────────
echo "[INFO] 이미지 pull: $IMAGE"
docker pull "$IMAGE"

# ── old target 컨테이너 정리 (같은 이름이 이미 Stopped 상태일 경우) ──────────
if docker ps -a --format '{{.Names}}' | grep -q "^${TARGET_NAME}$"; then
  echo "[INFO] 기존 ${TARGET_NAME} 컨테이너 제거"
  docker rm -f "$TARGET_NAME" || true
fi

# ── 새 컨테이너 기동 ──────────────────────────────────────────────────────────
echo "[INFO] ${TARGET_NAME} 컨테이너 시작 (포트 ${TARGET_PORT}:${CONTAINER_PORT})"
docker run -d \
  --name "$TARGET_NAME" \
  --restart unless-stopped \
  -p "127.0.0.1:${TARGET_PORT}:${CONTAINER_PORT}" \
  --env-file "$ENV_FILE" \
  "$IMAGE"

# ── Health Check ──────────────────────────────────────────────────────────────
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

# ── Health Check 실패 시 롤백 ─────────────────────────────────────────────────
if ! $SUCCESS; then
  echo "[ERROR] Health check 실패 → 새 컨테이너 제거 후 배포 중단"
  docker rm -f "$TARGET_NAME" || true
  exit 1
fi

# ── Nginx upstream 전환 ───────────────────────────────────────────────────────
echo "[INFO] Nginx upstream → ${TARGET} (127.0.0.1:${TARGET_PORT}) 로 전환"

sudo /usr/bin/tee "$UPSTREAM_CONF" > /dev/null <<EOF
upstream prompthub_upstream {
    server 127.0.0.1:${TARGET_PORT};
}
EOF

# Nginx 설정 문법 검사
sudo /usr/sbin/nginx -t

# Nginx reload (무중단)
sudo /bin/systemctl reload nginx
echo "[INFO] Nginx reload 완료"

# ── 기존 컨테이너 처리 ────────────────────────────────────────────────────────
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

# ── 완료 ─────────────────────────────────────────────────────────────────────
echo ""
echo "✅ Blue/Green 배포 완료!"
echo "   활성 슬롯 : ${TARGET} (port ${TARGET_PORT})"
echo "   이미지    : ${IMAGE}"
echo "   ENV 파일  : ${ENV_FILE}"
