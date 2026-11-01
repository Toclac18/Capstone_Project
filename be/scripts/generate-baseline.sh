#!/usr/bin/env bash
# Sinh V1__baseline.sql từ schema của một database THẬT.
#
# Chạy trên DB nào: bản sao của prod là tốt nhất; nếu không có thì DB dev đang dùng ổn định.
# KHÔNG sinh baseline từ entity — schema prod đã lệch entity sau nhiều tháng ddl-auto=update.
#
#   ./scripts/generate-baseline.sh                     # đọc be/.env
#   DB_HOST=... DB_NAME=... ./scripts/generate-baseline.sh
#
# Sau khi chạy: đọc lại file, bỏ phần không muốn version hoá (owner, grant), rồi commit.

set -euo pipefail

cd "$(dirname "$0")/.."
OUT="src/main/resources/db/migration/V1__baseline.sql"

if [[ -f .env ]]; then
  set -a; # shellcheck disable=SC1091
  source .env; set +a
fi

: "${DB_HOST:?thiếu DB_HOST}"
: "${DB_NAME:?thiếu DB_NAME}"
: "${DB_USERNAME:?thiếu DB_USERNAME}"
DB_PORT="${DB_PORT:-5432}"

if [[ -f "$OUT" ]]; then
  echo "✗ $OUT đã tồn tại. Xoá hoặc đổi tên trước khi sinh lại." >&2
  exit 1
fi

echo "→ dump schema từ ${DB_HOST}:${DB_PORT}/${DB_NAME}"

PGPASSWORD="${DB_PASSWORD:-}" pg_dump \
  --host="$DB_HOST" --port="$DB_PORT" \
  --username="$DB_USERNAME" --dbname="$DB_NAME" \
  --schema-only --no-owner --no-privileges --no-comments \
  --schema=public \
  --exclude-table=flyway_schema_history \
  > "$OUT"

{
  echo ""
  echo "-- Sinh bởi scripts/generate-baseline.sh từ ${DB_NAME} ngày $(date +%F)."
  echo "-- Đây là ảnh chụp schema đã chạy thật, KHÔNG suy từ entity."
} >> "$OUT"

echo "✓ $OUT ($(wc -l < "$OUT" | tr -d ' ') dòng)"
echo ""
echo "Bước tiếp:"
echo "  1. Đọc lại file, bỏ những gì không muốn version hoá."
echo "  2. Kiểm trên DB rỗng:  createdb readee_check && psql -d readee_check -f $OUT"
echo "  3. Commit, rồi mới đổi ddl-auto sang validate (PR riêng)."
