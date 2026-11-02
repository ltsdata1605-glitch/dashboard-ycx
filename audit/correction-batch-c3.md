# Batch C3 — nền tảng controls và sửa CORR-005

Trạng thái toàn dự án: PARTIAL. Checkpoint trước sửa tại `evidence/c3-checkpoint.zip`, hash từng file trong `c3-checkpoint-manifest.json`; không chạy backup.cjs, push hoặc deploy.

## Nguyên nhân và thay đổi

CORR-005: `#tang-dem` có mép phải 402,8125px do hàng nút của appleUiHarness dùng flex không wrap. Test trước sửa FAIL ở 320/390px, PASS ở 440px (`c3-overflow-before.txt`). Thêm flex-wrap đúng hàng đó; không che overflow, không giảm assertion. Ba viewport sau sửa đều giữ chiều rộng document đúng viewport và nút Huỷ nằm trọn màn hình. Mười test Apple UI cũ vẫn PASS.

CapsuleBar và TopBarActions có background/filter/border/shadow vật liệu riêng trong class JSX. Nay dùng `.ycx-material` và hai biến thể component trong styles.css, lấy token từ styles/tokens.css. Callback, portal, kích thước, icon, active và disabled được giữ. Mobile giữ chính sách không blur; nền fallback đổi từ trong suốt sang đặc để đọc rõ. Không thêm Glass vào bảng/KPI/form. Các token và class dark cũ được bảo toàn, không bật Dark Mode.

Test bàn phím phát hiện Capsule dùng transition-all làm outline-offset nội suy qua 1px trước khi đạt 2px. Giới hạn transition vào background-color/color/transform/box-shadow; cùng assertion 2px PASS ngay sau Tab. Bằng chứng FAIL được giữ tại c3-glass-before.json/c3-glass-tests.txt; retest tại c3-e2e.json/c3-glass-retest.txt.

## Evidence theo file

| File | Review và phạm vi | Bằng chứng / giới hạn |
|---|---|---|
| tests/e2e/helpers/appleUiHarness.tsx | Đọc toàn bộ; xác định hàng nút sai và thêm wrap | Before/after tại ba viewport; 10 test cũ; không phải app production |
| tests/e2e/glass-material-foundation.spec.ts | Đọc/cập nhật; thêm ba regression aggregate | Document width + bounding box thật, không dựng trạng thái DOM giả |
| tests/e2e/helpers/materialHarness.html | Đọc/cập nhật; các nhánh fixture dựng React thật | Query aggregate/controls; callbacks local, không dữ liệu thật |
| tests/e2e/glass-controls.spec.ts | Test mới cho controls shared | Tab/Enter thật, active/disabled, 32px visual/44px hit, computed token và fallback |
| components/shared/ui/CapsuleBar.tsx | Đọc toàn file; đổi vật liệu và giới hạn transition | 7 unit; desktop/mobile controls test; role=tablist vẫn cần audit semantics riêng |
| components/shared/ui/TopBarActions.tsx | Đọc toàn file; đổi vật liệu khung ngoài | Controls fixture tắt HeaderSystemGroup; chưa xác minh toàn bộ system group |
| styles.css | Review các selector material và tương tác navbar/mobile | Fallback, reduced transparency, forced colors; navbar capsule riêng chưa migration |
| styles/tokens.css | Thêm component material tokens | Không tạo thư viện thiết kế khác; primitive/semantic mapping toàn bộ vẫn chưa hoàn tất |

Consumer trace: CapsuleBar hiện có BiWrapper và barrel shared/ui; TopBarActions có Header, CheckThuongView, BiWrapper, PhanCaToolbar, StickerModeToolbar và barrel shared/ui. Đã xem cấu trúc gọi liên quan và callbacks ở các đoạn toolbar; không đánh dấu toàn bộ các feature này đã deep review. Matrix ghi rõ consumer này và giới hạn runtime. FloatingDock, navbar capsule đặc thù và HeaderSystemGroup chưa được gộp vào migration batch này.

## Kiểm thử

- Chromium: 16/16 PASS (controls desktop/mobile + material + aggregate + Apple UI); ảnh c3-glass-390.png và c3-glass-1366.png đã xem. Đây là fixture component riêng, không phải visual approval cho toàn bộ màn ứng dụng.
- WebKit: 13/13 PASS (aggregate + Apple UI). Không phải Safari trên iPhone vật lý. Test dùng CDP để mô phỏng reduced transparency chỉ chạy Chromium.
- Capsule unit: 7/7 PASS. Typecheck lần đầu FAIL do bản sao source checkpoint bị compiler đọc; đóng gói ZIP có xác minh hash để bỏ bản sao khỏi đầu vào, không đổi tsconfig; typecheck-final PASS. ESLint và ratchet check-only PASS. Build local được ghi log riêng, không deploy.
- Reduced transparency và forced colors đã được kiểm tra độc lập: tắt preference đầu và kiểm tra blur khôi phục trước khi bật forced colors; 2/2 controls retest PASS (c3-controls-final.txt, c3-chromium.json).
- Kiểm app dùng dữ liệu fixture local qua apple-tuong-thich đang thực thi; cập nhật kết quả trong test-results.md.

## Acceptance còn thiếu

Không đóng Phase 4–6: còn FloatingDock/navbar-specific CSS; aria/tab semantics; fallback ở engine không hỗ trợ backdrop-filter; đo performance trên thiết bị; visual tại từng consumer và phần shared controls khác. Không nâng verified toàn file vì một số assertion PASS. Full review, dead-code mở rộng, full regression theo journey và re-audit vẫn chưa hoàn tất.

Lượt app compatibility: assertions ghi 0 vi phạm ở mobile và laptop; mobile PASS, laptop lần đầu FAIL khi đóng trace (ENOENT). Hai tiến trình đã dùng cùng output directory; lượt laptop được chạy lại với output riêng. Không ghi PASS cho lần teardown lỗi. Cấu hình C3 hỗ trợ AUDIT_RUN để tách thư mục và JSON khi chạy đồng thời.
