# Bổ sung kiểm thử WebKit sau Phase 0

WebKit không còn BLOCKED do thiếu binary. Đã cài WebKit 26.6 / build 2359 tương ứng Playwright 1.63.0 tại /private/tmp/ycx-playwright-browsers. Thư mục tạm có thể bị hệ điều hành dọn.
Lần tải trong sandbox lỗi DNS ENOTFOUND; tải với quyền mạng phù hợp thành công (exit 0). Lần chạy sandbox lỗi listen EPERM localhost; chạy với quyền phù hợp thành công về hạ tầng.

Lệnh chạy:
```sh
BROWSER=none E2E_WEBKIT=1 PLAYWRIGHT_BROWSERS_PATH=/private/tmp/ycx-playwright-browsers ./node_modules/.bin/playwright test tests/e2e/smoke.spec.ts tests/e2e/modal-ngan-xep.spec.ts --project=webkit --output=test-results/phase0-webkit
```

Kết quả: exit 1, 4 PASS / 1 FAIL, 20,8 giây. Smoke khởi động PASS; modal khoá cuộn, Escape và accessible name PASS. Bài a11y FAIL: Tab lần 3 thoát khỏi modal (spec dòng 76).
Chạy lại riêng --grep 'a11y:': WebKit vẫn FAIL cùng bước, Chromium PASS. Logs: evidence/webkit-focus.txt và evidence/chromium-focus.txt. Trace/screenshot ở test-results/phase0-webkit-focus/ (gitignored).

Phân loại: failure tái hiện được trên WebKit hiện tại, chưa xác định root cause; không kết luận lỗi production hay regression do thay đổi mới (source không đổi). Cần điều tra thứ tự focus và xử lý Tab trong components/shared/ui/useModalBehavior.ts cùng thiết lập keyboard navigation của engine. Không sửa assertion/skip test.
Harness dựng Modal/ConfirmDialog React thật, không chứng minh mọi luồng nghiệp vụ. Đây là Playwright WebKit trên macOS, chưa phải Safari iPhone vật lý/PWA. Không đăng nhập tài khoản thật, không push/deploy.

Các kiểm thử lint/unit/build/E2E khác vẫn chưa được chạy trong lượt này. Phase 1–10 vẫn PARTIAL.
