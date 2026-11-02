# Test matrix

Kết quả tổng hợp và giới hạn: phase-2-report.md. Lệnh, exit code và log: phase-2-results.json. Từng assertion: test-execution-ledger.csv.

INVENTORIED = đã ghi nhận đường dẫn; REVIEWED = đã đọc/nghiên cứu ngữ nghĩa, không suy từ AST; TESTED = có evidence bài test cụ thể; VERIFIED = yêu cầu/hành vi đã được chứng minh trong điều kiện xác định. Không nâng cả source thành VERIFIED vì typecheck/build/unit PASS. PREFLIGHT_ONLY chỉ review quy tắc/config trong Phase 0.

Full E2E NOT_RUN; runtime dùng fresh contexts không truy cập production. Chromium mobile emulation và Playwright WebKit desktop không phải Safari iPhone thật.

Resume 25/10/2026: xem `full-test-matrix.csv` theo module/journey, `e2e-test-matrix.csv` theo spec và `test-execution-ledger.csv` theo assertion. Các batch local đã chạy được ghi trong `test-results.md`; full E2E vẫn chưa hoàn tất.
