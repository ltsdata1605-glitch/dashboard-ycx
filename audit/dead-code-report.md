# Báo cáo code chết — lượt 2 (2026-10-28)

**Phương pháp:** `audit/tools/inventory-v2.mjs` dựng đồ thị import tĩnh trên 1.044 file mã (import/export from, `import()`,
`require()`, `new URL('…', import.meta.url)`, bỏ hậu tố `?worker`). File mã có 0 nơi nhập và không phải điểm vào → ứng viên
(`audit/orphan-candidates.txt`). Mỗi ứng viên được grep toàn repo theo tên file/tên export (kể cả chuỗi, ngoài `audit/` `docs/`).

| File | Phân loại | Bằng chứng | Xử lý |
|---|---|---|---|
| `components/analysis/ExportDestinationButton.tsx` | DEFINITE_DEAD | thân hàm `return null` ("đã loại bỏ tính năng gửi ảnh sang LINE"); 0 nơi import | Đã xoá |
| `components/layout/Footer.tsx` | DEFINITE_DEAD | App.tsx dùng `AppFooter`; 0 nơi import `layout/Footer` | Đã xoá |
| `features/bi-dashboard/components/Slider.tsx` | DEFINITE_DEAD | 0 nơi import (chỉ có `findCompetitionSlider` — hàm khác) | Đã xoá |
| `features/line-bot/index.ts`, `features/tax-calculator/index.ts`, `features/product-config/components/index.ts` | INTENTIONALLY_RETAINED | Public API theo quy tắc Feature-Sliced (module giao tiếp qua `index.ts`) — App.tsx hiện lazy-import file view trực tiếp | Giữ |
| `docs/audit-2026-10-07/evidence/*.cjs|mjs` (8 file) | INTENTIONALLY_RETAINED | Script tái hiện làm bằng chứng của audit 07/10, chạy tay | Giữ |
| `services/worker.ts`, `services/analytics.worker.ts`, `services/scheduleHeartbeat.worker.ts`, `features/bi-dashboard/workers/analytics.worker.ts` | LEGACY_ACTIVE (false positive v1 của script) | nạp qua `?worker` / `new Worker(new URL(…))` | Giữ — script đã sửa để nhận ra |

Kiểm sau khi xoá: `npx tsc --noEmit` OK, `npm run check` (xem `test-results.md`).

**Chưa làm (POSSIBLE_DEAD cần công cụ mạnh hơn):** export không ai dùng bên trong file còn sống (cần Knip/ts-prune — chưa cài,
không tự thêm dependency trong lượt này), CSS không dùng trong `styles.css` (1.199 dòng), asset `public/` không được tham chiếu.

## Lượt Knip (2026-10-28, chủ dự án đồng ý thêm devDependency `knip`)
`knip.json` + `npm run lint:dead`. Knip báo 88 export / 6 type / 25 file / 5 dependency. Xác minh từng mục bằng grep toàn repo
(kể cả `functions/`, `tests/`, chuỗi) và đếm số lần xuất hiện trong chính file: chỉ gỡ mục có **đúng 1 lần** (dòng khai báo).
Gỡ bằng AST (`audit/tools/remove-dead-exports.mjs`), lặp 3 vòng vì gỡ một hàm làm lộ hàm nó gọi.

| Nhóm | Đã gỡ |
|---|---|
| Đồng bộ cloud cũ `services/firestoreService.ts` | `syncToCloud`, `clearCloudSettings`, `shareCloudConfig`, `fetchSharedConfigs`, `deleteSharedConfig`, `syncScheduleToCloud`, `fetchScheduleFromCloud`, `SharedConfig` (Phân ca dùng bản zone-local `features/phan-ca/services/firestoreSync.ts`; đồng bộ nhẹ đã chuyển sang `lightSync`) |
| Gửi LINE cũ `services/lineReportDelivery.ts` | `listLineGroups`, `syncReportCommandConfig`, `syncReportImageForCommand`, `sendReportImageToLine`, `sendReportImageToLineGroups`, `saveReportCommandImage`, `pushViaCloudFunction`, `__resetLineBotCache` |
| `services/dbService/*` | `getValue`/`setValue` (alias), `clearAllSettings`, `importAllSettings`, `saveSalesData`, `getTopSellerAnalysisHistory`, `clearCustomTabs`, `save/getIndustryGridFilters`, `save/getEmployeeAnalysisFilters`, `save/getThemeMap`, `save/getEmployeeColumnConfig` |
| Khác | `notifyAdminsAndManagers`/`notifyUser` (client; bản thật ở functions/), `downloadKhoSalesData`, `autoSyncSupermarketKhoMap`, `runLineAutoExports*`, `registerAutoExport`, hằng thuế/ngân hàng/bookmarklet không dùng, `mobileUi` 4 hằng, kiểu thừa |
| File | `components/shared/DrillDownModal.tsx` (chỉ harness ảnh chụp dùng), `tests/e2e/tmp-diag2.spec.ts` (chẩn đoán tạm, không assert) |
| Dependency | `papaparse`, `@types/papaparse`, `autoprefixer` (gỡ); `globals` (khai báo — test đang dùng nhờ bắc cầu) |
| Import/biến thừa (tsc --noUnusedLocals trên file đã đụng) | 12 import + 2 biến sót của tính năng "file đồng bộ cloud" trong `useDataManagement` |

**Giữ có lý do:** `services/analysisExportDestinations.ts` — tính năng gửi LINE TẠM TẮT (`LINE_EXPORT_TEMPORARILY_DISABLED = true`), nay
chỉ test dùng → chủ dự án quyết bật lại hay xoá. 24 harness e2e (nạp qua URL), 3 `index.ts` public API, `export default` song song
export có tên (vô hại). Knip còn báo ~40 `export default` trùng — không gỡ.
