# Performance baseline

Build budget PASS: 322.6/330 KB gzip. Xem evidence/phase2-budget.txt.

BENCH=1 ./node_modules/.bin/vitest run tests/bench/filter-100k.test.ts --disableConsoleIntercept --silent=false: PASS. Một mẫu Node: RBAC 8ms, filter 41ms, metrics125ms, tổng174ms/100k dòng. Xem evidence/phase2-benchmark-measured.txt. Lần đầu console bị ẩn nên chạy lại để lấy số đo; không sửa implementation/assertion.

Web Vitals, scroll, animation, memory, iPhone thật: NOT_RUN. Baseline layout có dữ liệu BLOCKED tại cấu hình cloud. Chưa có số đo trước/sau thay đổi UI vì chưa thay đổi UI.
