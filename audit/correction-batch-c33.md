# C33 — Shared Card/Section/List foundation review: PARTIAL

Đọc đầy đủ SectionCard35dòng,SectionHeader88dòng,EmptyState68dòng,ListGroup97dòng,Card116dòng. Evidence từng file c33-file-review-notes.json. Consumer refs c33-shared-consumer-references.txt là lexical references, không semantic review tất cả consumer. Đọc snippets BiSupermarketMapAdmin320–350,PhanCaView616–642,TrendChart420–444; không nâng fullreview. CSS token/separator snippets c33-token-references.txt, không đọc lại toàn styles.

CORR-031: SectionHeader root onKeyDown nhận bubbled Enter/Space từ quick Button, preventDefault ngăn native click và gọi hành động header. Thêm guard target===currentTarget. Giữ root keyboard, native child activation, existing click contracts. BI Card onHeaderClick adapter có descendantbutton; fixture kiểm chứng API chứ không fulladmin/cloudjourney. Nested role semantics/legacy children click contracts vẫn cần audit.

Sourceschanged: components/shared/ui/SectionHeader.tsx; tests/e2e/helpers/materialHarness.html; thêm tests/e2e/section-header-keyboard.spec.ts. Checkpoint ZIP/SHA c33-checkpoint.zip/.json; source delta c33-source-changes.csv.

## Tests và mapping

`AUDIT_PORT=5198 AUDIT_RUN=before npx playwright test --config audit/evidence/c33-playwright.config.mjs`:1FAIL,quick count0 thay vì1 sau Enter. Final AUDIT_RUN=chromium và AUDIT_ENGINE=webkit AUDIT_RUN=webkit:3PASS mỗi engine. Native Tab/Enter/Space (WebKit Alt+Tab) xác minh quick2/root0 rồi root2. Không programmaticfocus hoặc syntheticDOM.

Hai ca foundation390/1366 xác minh computed Card radius bằng resolved --card-radius; SectionCard mobile0px và desktopcardtoken giữ ngoại lệ; ListRow height>=44/native disabled/native click; compact EmptyState heading visible. Đã inspect Chromium390/WebKit1366 c33-cards images. Đây fixture, không fullscreens. Không đo pointercoarse48,contrast/screenreader/performance. CardHeader/Body/Footer chỉ source-reviewed, không rendertrongtests.

Card semantic map: card-radius→p-radius-2xl,shadow→shadow-card; surface/padding vẫn localclasses cần acceptancereview. SectionCard flatmobile/border-y giữ nguyên. ListGroup rounded-popup và ycx-list-row separators; interactive trailing nestedButton và selected semantics cần consumer review. EmptyState compact typography/heading hierarchy/icon/action variants còn pending. Không Glass toàn bộ dữ liệu/card; không sửa exception chỉ giảmviolation.

ESLint source/spec PASS; tsc --noEmit PASS; build PASS9.30s. Không rerun fullunit; latest C31 là historical1490PASS4SKIPPED. CORR-031 resolved scoped keyboard. FullUI/Glass/physicaldevice acceptance chưa đạt.

Coverage1375=1149NO12PREFLIGHT_ONLY214PARTIAL;component410NO57PARTIAL;module16NO13PARTIAL;screen165NO6PARTIAL;verifiedYES0. Hash/inventorymismatch0, evidence c33-current-coverage.json/c33-final-reconciliation.json. Khôngpush/deploy/productionchanges.
