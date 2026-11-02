# C41 — Share toast API boundaries — PARTIAL

Thêm `tests/unit/share-toast-boundaries.test.ts` (7cases) để kiểm tra BatchShareToast/ShareRetryToast: thiếu API/batch rỗng,canShare false/throw,filename/File conversion,share được gọi trực tiếp trong action callback,AbortError không fallback,lỗi khác fallback đúng1lần,skip không share,retry giữ payload. Không thay application code.

`npx vitest run tests/unit/share-toast-boundaries.test.ts --reporter=default --reporter=json --outputFile=audit/evidence/c41-unit.json`:7PASS. ESLint spec và `npx tsc --noEmit`:PASS. Fullsuite sau thêm test: `npx vitest run --reporter=default --reporter=json --outputFile=audit/evidence/c41-full-unit.json`:1497PASS4SKIPPED,173filesPASS1SKIPPED. Build gần nhất C40 được giữ nguyên, không nhận build mới C41.

Navigator/share và toast.action được mock; File objects thật trong Node. Không gọi OS share sheet, không gửi file cho người khác, không xác minh Safari useractivation/LINE/physical device. Những journey này vẫn BLOCKED khi thiếu môi trường thật. Không coi mock PASS là production acceptance.

Nguồn review theo file `evidence/c41-file-review-notes.json`; delta `c41-source-changes.csv`; counts `evidence/c41-current-coverage.json`;hash/inventory khớp `evidence/c41-final-reconciliation.json`. Scope1382=1125NO12PREFLIGHT_ONLY245PARTIAL;verifiedYES0. Component392NO75PARTIAL;module16NO13PARTIAL;screen165NO6PARTIAL. Không push/deploy. Full MASTER PROMPT V6 vẫn PARTIAL.
