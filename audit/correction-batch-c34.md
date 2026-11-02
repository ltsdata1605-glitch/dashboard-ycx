# C34 — Audit export bindings của shared foundation: PARTIAL

Đọc đầy đủ components/shared/ui/index.ts, giữ nguyên public API. Mở rộng dead-code audit với9exports thuộc5source đã đọc C33: Card/CardHeader/CardBody/CardFooter,SectionCard,SectionHeader,ListGroup,ListRow,EmptyState. Không quét lại census/dependency/generated trees; chỉ những file text INCLUDED của ledger. c34-scanned-hashes.json lưu path/hash của tập lexicalscan. TypeScript compiler đọc dependency resolution bình thường, chỉ ghi reference của in-scope roots, không đánh dấu dependencies reviewed.

Hai lớp bằng chứng: c34-export-references.json lexicalreferences tách definition/barrel/test/source; c34-export-bindings.json dùng TypeScript checker canonical symbols, resolve aliases để không nhầm các component trùng tên. Commands: python3 /tmp/ycx-c34-scan.py và node /tmp/ycx-c34-bindings.cjs. Scripts được sao lưu vào evidence để tái lập. Tất cả source binding scans chỉ là consumer trace, KHÔNG semantic review các consumer.

Kết quả export-audit.csv:5INTENTIONALLY_RETAINED có resolved productionTS consumer;4POSSIBLE_DEAD không có production binding tìm thấy. Card71lexical source references chủ yếu là BI Card riêng; không dùng chúng để chứng minh sharedCard đang active. SharedCard/C33HTMLfixture và barrel vẫn tồn tại; ba subcomponents CardHeader/Body/Footer chỉ definition+barrel. Chưa loại dynamic/property/runtime/externalAPI nên không DEFINITE_DEAD và không xóa. Migration matrix Card sửa consumer mapping sai/ambiguous thành explicit pending.

Dead register hiện50candidates:30INTENTIONALLY_RETAINED16POSSIBLE_DEAD1LEGACY_ACTIVE3DUPLICATED. 9exports đều có phân loại/evidence/action riêng. Không suy “tất cả code đang dùng” từ imports; toàn bộ exports/CSS/assets/dependencies còn chưa bao phủ hết.

Không application source changes C34. Tests NOT_RUN vì chỉ audit evidence/mapping; C33 results là lịch sử. Coverage giữ1375=1149NO12PREFLIGHT_ONLY214PARTIAL;verifiedYES0. Chỉ barrel re-read evidence thêm, không nâng hàng nghìn file từ scan. Hash/inventorymismatch0, evidence/c34-current-coverage.json và c34-final-reconciliation.json. Không push/deploy.
