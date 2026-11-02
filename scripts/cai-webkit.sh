#!/bin/bash
# Cài WebKit (engine của Safari) cho Playwright trong container cloud — 2026-10-30 (AUD-006).
# Container chỉ có sẵn Chromium ở /opt/pw-browsers; cài THÊM WebKit vào đúng thư mục đó (không đụng Chromium, không đổi
# PLAYWRIGHT_BROWSERS_PATH) + thư viện hệ thống qua apt. Chạy lại không tốn gì nếu đã cài.
# Dùng: npm run e2e:webkit:cai  →  npm run test:e2e:webkit -- tests/e2e/<spec>.spec.ts
set -euo pipefail
cd "$(dirname "$0")/.."
DICH="${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"
if ls -d "$DICH"/webkit-*/ >/dev/null 2>&1 && [ -f "$DICH/.webkit-deps-ok" ]; then
  echo "[cai-webkit] Đã có WebKit ở $DICH"; exit 0
fi
PLAYWRIGHT_BROWSERS_PATH="$DICH" npx playwright install webkit 2>&1 | tail -2 || true
PLAYWRIGHT_BROWSERS_PATH="$DICH" npx playwright install-deps webkit 2>&1 | tail -2
touch "$DICH/.webkit-deps-ok"
echo "[cai-webkit] Xong: WebKit ở $DICH"
