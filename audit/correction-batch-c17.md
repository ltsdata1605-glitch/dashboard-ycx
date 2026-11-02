# C17 — regression mở rộng và chất lượng bằng chứng — PARTIAL

## Phạm vi và kết quả

Giữ checkpoint C16; hash trước batch 0 delta. Review an toàn và evidence theo **32 file** tại `evidence/c17-file-review-notes.json` (mỗi entry có phạm vi/giới hạn). 29 file NO và2 PREFLIGHT_ONLY sang PARTIAL;1 file đã PARTIAL bổ sung evidence. Không đánh dấu full reviewed/verified cho consumer chỉ truy reference. Không thay code production hoặc công thức.

Một file source thay đổi: `tests/e2e/bi-competition.spec.ts`, manifest `c17-source-changes.csv`. Checkpoint ZIP+SHA trước sửa lưu trong evidence/c17-checkpoint.*. File diagnostic nhân viên được khôi phục byte-for-byte từ checkpoint, không thay assertion. Bản diff chỉ còn test Competition.

CORR-018: trước đây test target vượt trội dùng nth2 nhưng runtime header chứng minh nth2 là LUỸ KẾ; test sort dùng nth4 (%HT V.TRỘI), trong khi cần %DKHT V.TRỘI (nth5). Đã resolve chỉ số từ đúng header duy nhất và kiểm cả target/%HT dương; không giảm assertion hoặc thay số nghiệp vụ. Bốn case chạy lại PASS.

## Tests thực chạy

- `AUDIT_PORT=5197 AUDIT_RUN=local npx playwright test --config audit/evidence/c17-playwright.config.mjs`:17PASS Chromium, bao gồm BI modes/deep links/competition/XSS, sidebar và menu ngang, lỗi mất cấu hình Analysis. Bốn Competition trong lượt này dùng phép đo cũ nên không dùng để đóng CORR-018.
- `AUDIT_PORT=5198 AUDIT_RUN=employees npx playwright test --config audit/evidence/c17-employees.config.mjs analysis-employees-sync.spec.ts analysis-only-all-in-one.spec.ts bi-nhan-vien-moi-tab-tu-phan-tich.spec.ts bi-nhan-vien-theo-sieu-thi.spec.ts`:3PASS/1FAIL. FAIL timeout badge sau đổi siêu thị.
- `AUDIT_PORT=5197 AUDIT_RUN=columns npx playwright test --config audit/evidence/c17-playwright.config.mjs bi-competition.spec.ts`:4PASS với phép đo đã sửa.
- Diagnostic employee1PASS; nguồn diagnostic sau đó khôi phục. Trace ban đầu cho thấy Vite reconnect/reload xen giữa sau click Thạnh An, bootstrap đưa config về data. `evidence/c17-reload-diagnostic.json`. Chưa chứng minh nguồn gây reload: CORR-020 OPEN, không quy lỗi công thức.
- `AUDIT_PORT=5198 AUDIT_RUN=employee-isolated npx playwright test --config audit/evidence/c17-employees.config.mjs bi-nhan-vien-theo-sieu-thi.spec.ts --repeat-each=3`:3PASS source gốc;2NV/1NV đúng. Giữ nguyên lần FAIL, không ghi suite chưa từng lỗi.
- `npx vitest run features/bi-dashboard/components/dashboard/SafeHeaderText.test.ts tests/unit/analysis-employees-khong-vong-lap.test.ts tests/unit/analysis-employees-from-dept-map.test.ts tests/unit/report-bi-analysis-employee-only.test.ts tests/unit/cau-noi-dto-a29.test.ts tests/unit/target-employee-supermarket-filter.test.ts --reporter=default --reporter=json --outputFile=audit/evidence/c17-unit.json`:25PASS/6files. Có log Firebase initialization warning/assertion trong Node ở imports chưa mock, không che log; không test cloud runtime.
- `npx eslint tests/e2e/bi-competition.spec.ts` và `npx tsc --noEmit`:PASS. Không chạy lại full build/unit vừa PASS C16 vì chỉ sửa test và review source; không gọi kết quả C16 là test C17.

Tổng lượt browser28PASS/1FAIL, gồm các lần lặp/chẩn đoán; **21 distinct cases** đã có lượt PASS hiện hành, không phải28journeys độc lập. Chromium mobile/landscape là emulation, không physical Safari. Không có visual approval mới trong C17. Clipboard/IDB mocks không xác thực production.

## Safety và remaining

CORR-019 OPEN: realDataContext mở profile persistent, xóa Singleton locks và không kế thừa proxy test project.31 callers được ghi BLOCKED theo dependency helper (`evidence/c17-persistent-profile-blocked.json`); không đồng nghĩa31file đã deep review. Vite còn proxy local `/api-line-proxy` tới LINE; các case chọn trong C17 không bấm LINE/API này. Cần audit-server không forward trước chạy nhóm đó. Không dùng profile người dùng.

Worker recovery/cold-start recovery chưa có productConfig/service fixture phù hợp nên BLOCKED; More-sheet screenshot ghi ngoài workspace chưa chạy. Offline SW cần fresh build và kiểm port trước chạy. File `nhanVienHelpers.ts` chỉ review phần đầu; các phần parser lớn còn pending. Analysis employee empty-list fallback, partial cache write failure và concurrency cần bằng chứng tiếp theo; không thay nghiệp vụ theo suy đoán.

Coverage:1.365 =1.266NO +16PREFLIGHT_ONLY +83PARTIAL; verifiedYES0. Component447NO/20PARTIAL, module28NO/1PARTIAL, surface168NO/1PARTIAL. Hash/inventory mismatch0. Dead-code29 chưa đổi, không xóa. Phase4–6 và toàn bộ V6 chưa đạt acceptance.
