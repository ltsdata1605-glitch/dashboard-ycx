# C19 — LIFF xác nhận trung thực — PARTIAL

## Root cause / fix
CORR-021 được tái hiện bằng6testFAIL,3test cũPASS. public/liff-copy.html ghi coupon_sent trước response và mọi error/timeout rơi vào thông báo thành công. Đã chỉ lưu cờ sau success=true với updatedCount>0 hoặc alreadyUsed; revoked không lưu. HTTP không thành công bị reject; lỗi mạng/API/không tìm thấy coupon hiện chưa xác nhận và cho thử lại. Giữ close sau4s cho server chậm nhưng nội dung chưa xác nhận; callback muộn chỉ lưu khi có acknowledgement. Bắt rejection ở early request khi có tên cache. Không thay API endpoint/payload, webhook, công thức, quyền hay quy tắc không gửi tin.

Changed2files: public/liff-copy.html và tests/e2e/liff-dung-coupon-khong-gui-tin.spec.ts; checkpoint ZIP/SHA c19-checkpoint.*. Existing3cases giữ nguyên, thêm8cases. functions/src/lineBotWebhook.ts chỉ đọc branch mark-used2319–2457; functions/package.json đọc toàn bộ script boundary, không full backend review.

## Verification
- Before c19-before.json:3PASS6FAIL. After c19-after.json:9PASS. Interim c19-final.json:10PASS1FAIL, test delay6s race làm assertion đọc sau late ack. Giữ FAIL; thay delay trong late-response case bằng response gate giữ nguyên assertion và thứ tự.
- AUDIT_PORT=5198 AUDIT_RUN=verified npx playwright test --config audit/evidence/c19-playwright.config.mjs:11PASS Chromium desktop1280.
- AUDIT_PORT=5198 AUDIT_RUN=webkit-mobile AUDIT_ENGINE=webkit AUDIT_MOBILE=1 ...:11PASS nhưng project device override global viewport, screenshot1280 chứng minh đây là **WebKit desktop**, không mobile. Giữ tên artifact lịch sử và ghi đúng phạm vi.
- Sửa audit config override project.use rồi AUDIT_RUN=webkit-390 AUDIT_ENGINE=webkit AUDIT_MOBILE=1 cùng command:11PASS WebKit390x844. **33final platform-case executions**,11logical cases; không33journeys riêng.
- SDK và mark-used endpoint đều route fulfill/abort. Chromium clipboard dùng permission thật; WebKit clipboard success mock do không hỗ trợ grant đó. LINE WebView/iPhone vật lý/backend thật BLOCKED, không gửi tin/coupon mutation thật.
- Đã inspect screenshot retry Chromium1280 và WebKit390: toàn bộ thông báo/nút nằm trongviewport; chỉ xác nhận layout trạng thái này. Không claim toàn bộ visual/a11y.
- ESLint spec/typecheckPASS;4inline scripts parsePASS không execute; npm run buildPASS (1m24s); dist/liff-copy.html byte-identical source, evidence/c19-build-artifact.json. Diff whitespacePASS.

## Remaining
CORR-021 resolved theo local mock response contract; legacy local sent flags từ phiên bản cũ chưa được migration/revalidate, actual device close/keepalive vẫn BLOCKED. Trang standalone còn inline style/token mapping, contrast, live announcements, zoom restriction và native clipboard acceptance. Không tự thay branded exception/dark theme đang tồn tại. Coverage không verifiedYES. V6 vẫnPARTIAL; không push/deploy.
