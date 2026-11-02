# Phase 2 — Baseline Quality

Trạng thái: PARTIAL. Đã thu thập baseline các quality gate và E2E an toàn; đã giải quyết fixture cấu hình DB boundary và điều tra nguyên nhân gốc WebKit focus; đã phân loại side-effects toàn bộ 193 E2E spec. Giữ nguyên kết quả FAIL gốc của đợt quét baseline đầu tiên. Không sửa nghiệp vụ, auth, Firebase rules, API hoặc công thức; không push/deploy.

## Kết quả Baseline

| Kiểm tra | Trạng thái | Bằng chứng | Ghi chú |
|---|---|---|---|
| TypeScript app + functions | PASS | evidence/phase2-typecheck*.txt | Không lỗi kiểu |
| ESLint | PASS | evidence/phase2-eslint.txt | 0 error |
| Ratchet CI | PASS | evidence/phase2-ratchet.txt | Không tăng baseline vi phạm |
| Unit | PASS | evidence/unit-results.json | 170 file pass, 1 skip; 1477 test pass, 4 skip |
| Build app + functions | PASS | evidence/phase2-build*.txt | 0 error |
| Bundle budget | PASS | evidence/phase2-budget.txt | 322.6 KB gzip / 330 KB |
| Chromium baseline gốc | FAIL | evidence/e2e-chromium.json | 5 pass, 2 fail (timeout do thiếu fixture DB khi offline) |
| WebKit smoke/modal | FAIL | evidence/e2e-webkit.json | 4 pass, 1 fail (Tab lần 3 thoát modal) |
| WebKit focus investigation | PASS (root cause) | evidence/webkit-focus-investigation.txt | Xác định nguyên nhân gốc: WebKit bỏ qua button khi Tab |
| Apple tương thích (DB fixture) | PASS | evidence/e2e-chromium-apple-fixture.json | 2 pass, 0 vi phạm layout trên 6 khung hình x 11 tabs |
| Benchmark 100k | PASS | evidence/phase2-benchmark-measured.txt | 174 ms một lần đo Node |
| Rà soát side effects E2E | HOÀN TẤT | audit/e2e-side-effects-review.md | Phân loại 193 specs: 126 an toàn local, 67 cần môi trường thật |
| Toàn bộ E2E, iPhone thật, PWA | NOT_RUN | | Giữ ranh giới an toàn cho Phase 3–10 |

## Chi tiết các vấn đề cốt lõi đã làm rõ

1. **Điều tra focus WebKit (A11/A12)**:
   - Qua `audit/tools/investigate-webkit-focus.mjs`, đối chiếu từng lượt Tab giữa Chromium và WebKit.
   - Khi focus ở `INPUT#a-input`, bấm Tab: Chromium chuyển tuần tự sang `BUTTON#mo-b`. Nhưng WebKit theo cơ chế điều hướng mặc định của macOS bỏ qua mọi `<button>` nên nhảy thẳng ra `BODY` (`inside=false`).
   - Hook `useModalBehavior.ts` chỉ can thiệp khi `active === last` (vốn là một `<button>`), do đó không chặn được lượt Tab giữa chừng của WebKit.
   - Thử nghiệm với `Option+Tab` (Alt+Tab) trên WebKit: focus chuyển thành công vào `BUTTON#mo-b`.
   - Giữ nguyên assertion, không che giấu lỗi; giải pháp sửa hook ở nguồn sẽ thực hiện tại Phase 4.

2. **Khắc phục nghẽn Layout với Fixture Cấu hình Ngành Hàng (DB Boundary)**:
   - Tạo helper `seedProductConfigFixture` trong `tests/e2e/helpers/salesFixture.ts` nạp trực tiếp qua IndexedDB `BI_HUB_DATABASE_V2` (store `settings`) và phát sự kiện `ycx-product-config-changed`.
   - Hoàn toàn qua ranh giới DB chuẩn của ứng dụng, không chèn DOM nhân tạo.
   - Chạy lại 2 bài `apple-tuong-thich.spec.ts` trong môi trường sandbox:
     - Khung cảm ứng (iPhone SE, iPhone 16, iPhone 16 Pro Max, iPad): PASS, 0 vi phạm layout.
     - Khung laptop (1366x768, 1920x1080): PASS, 0 vi phạm layout.
   - Kết quả FAIL gốc (5 pass, 2 fail) được bảo lưu nguyên vẹn tại `evidence/e2e-chromium.json` và `evidence/phase2-e2e-chromium-raw.json`.

3. **Phân loại Ranh giới An toàn Toàn bộ 193 E2E Specs**:
   - Nhóm A (Profile Chrome thật `.e2e-chrome-profile`): 20 specs.
   - Nhóm B (Custom token / Service account): 9 specs.
   - Nhóm C (Dịch vụ bên ngoài / LINE / Userscript / Webhook): 12 specs.
   - Nhóm D (Thiết bị vật lý / Camera phần cứng / Safari iOS thật): 10 specs.
   - Nhóm E (Cloud Firestore trực tiếp / Polling rate limit): 16 specs.
   - Nhóm F (An toàn cho local sandbox / isolated harness): 126 specs.
   - Đã lập tài liệu chi tiết tại `audit/e2e-side-effects-review.md`.

## Tính toàn vẹn
- Source test `tests/unit/session-ownership-claim.test.ts` giữ nguyên thay đổi whitespace hiện hành (đã xác nhận bằng `git diff`).
- File checkpoint 1346 giữ nguyên đối soát.
