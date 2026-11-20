/* Service worker của Dashboard — SINH TỰ ĐỘNG lúc build bởi vite.config.ts (plugin ycx-offline-sw).
 * Mục tiêu (chủ dự án chốt 2026-10-08): mở app từ Màn hình chính / trình duyệt khi MẤT MẠNG vẫn thấy giao diện
 * và dữ liệu đã lưu trên máy (IndexedDB), không bị trang trắng "Không có kết nối".
 *
 * Chiến lược:
 *  - Cài đặt (GĐ2 tăng tốc 2026-10-11): chỉ tải LÕI (index.html + đúng các file index.html tự nạp) và CHÉP từ cache của bản
 *    trước những file /assets/ không đổi (tên có mã băm → cùng tên là cùng nội dung) — không tải lại qua mạng.
 *    Phần còn lại (mọi file /assets/ khác + icon) tải ngầm khi trang nhắn 'ycx-precache-rest' (trang đã vẽ xong + rảnh),
 *    3 luồng một lúc → không giành băng thông với lượt mở app. Trước đây lượt cài tải cùng lúc 7,9 MB / 71 file.
 *  - Điều hướng (mở trang/tải lại): ƯU TIÊN MẠNG (luôn nhận bản mới khi có mạng, tránh kẹt bản cũ), quá 4 giây hoặc
 *    lỗi thì dùng bản đã lưu. Bản mới nhất tự được lưu lại.
 *  - /assets/*, phông, ảnh khung: ƯU TIÊN BẢN LƯU (tên có mã băm nên không bao giờ cũ); thiếu thì tải rồi lưu.
 *  - Yêu cầu khác origin (Firebase, LINE, Google…) KHÔNG đụng tới — SDK tự xử lý offline.
 */
const VERSION = 'ac83825e1650';
const CACHE = 'ycx-shell-' + VERSION;
const PRECACHE = ["/report/assets/AboutView-Dr9JC8rJ.js","/report/assets/Badge-CmOFmTao.js","/report/assets/Banner-w8w4eE60.js","/report/assets/BiWrapper-CMrJ3KZY.js","/report/assets/BiWrapper-DHw20h5K.css","/report/assets/CheckThuongView-Cp5QAjNw.js","/report/assets/Checkbox-BmFBWgb3.js","/report/assets/ConfirmDialog-BZFjlU3D.js","/report/assets/CouponConverterView-D0KRy-1V.js","/report/assets/EmptyState-CNzWkf4G.js","/report/assets/ExternalToolView-Dfk9RCBH.js","/report/assets/GlobalAutoSyncDock-D8WMLqH8.js","/report/assets/InstallAppHint-Dtk8n7u6.js","/report/assets/InstallGuideModal-NSNGWQFC.js","/report/assets/KhaiThacView-6XJbKdY6.js","/report/assets/KpiCard-C138T-dJ.js","/report/assets/LineBotView-D-jyJkdC.js","/report/assets/ListGroup-KqeNTed5.js","/report/assets/LoginView-Bzaw3O34.js","/report/assets/MobileMoreSheet-IUS3JLpL.js","/report/assets/Modal-DURnioac.js","/report/assets/MultiSelectDropdown-DHfmOI3v.js","/report/assets/NhanVien-CeO5rgu9.js","/report/assets/NotificationDropdown-DRR31mGx.js","/report/assets/PendingApprovalView-Ywqv458X.js","/report/assets/PhanCaView-B14Rh2k2.css","/report/assets/PhanCaView-BivfQRMX.js","/report/assets/SectionCard-z3PlJ3c3.js","/report/assets/SettingsView-BvfIEqU1.js","/report/assets/StickerPrinterView-C0vCWCf5.js","/report/assets/Switch-Rp-wyZPd.js","/report/assets/Tabs-vTR9XJ65.js","/report/assets/TaxCalculatorView-YZy8OSiP.js","/report/assets/Textarea-DfPQ_Kr7.js","/report/assets/TopBarActions-utuMsomN.js","/report/assets/TouchTitleHint-CtYm7-KI.js","/report/assets/UserManagementView-DM3bsiG0.js","/report/assets/analytics.worker-CQkEjqrb.js","/report/assets/autoNavigationService-ymfFl8b6.js","/report/assets/autoReportExportService-DsDRhrfQ.js","/report/assets/autoSyncCards-D2dIBbfz.js","/report/assets/bonusHistory-_Fg4y_TH.js","/report/assets/captureEngine-BnGS5mof.js","/report/assets/checkThuongIframeService-BhSlppJV.js","/report/assets/configStore-jfv_oEyo.js","/report/assets/dataUtils-CZFZS1Uq.js","/report/assets/dbService-DnDbId5J.js","/report/assets/googleSheetsService-D0LTBUzq.js","/report/assets/index-BLdJe3je.js","/report/assets/index-CZHW75Ul.css","/report/assets/index-CgJtiJsK.js","/report/assets/index-ZiQipqD4.js","/report/assets/khaiThacDb-DRcu-blQ.js","/report/assets/khoDataService-CLh7mmNP.js","/report/assets/lineBot.types-CWSiISiF.js","/report/assets/presetBi-sP6vyXal.js","/report/assets/salesJsonWriter.worker-BvXL3ac6.js","/report/assets/salesJsonWriter.worker-iky0iAuj.js","/report/assets/scheduleHeartbeat.worker-DY9MOOqR.js","/report/assets/shared-utils-B7TlnBwz.js","/report/assets/vendor-excel-BGhuli8m.js","/report/assets/vendor-firebase-BDIogyZH.js","/report/assets/vendor-firebase-analytics-XfruttpD.js","/report/assets/vendor-icons-8Z2_M0K_.js","/report/assets/vendor-react-Birxz-Xg.js","/report/assets/ycxAutoSyncService-Dxdd6pVC.js","/report/favicon.svg","/report/fonts/UTM AvoBold.ttf","/report/icons/apple-touch-icon-120.png","/report/icons/apple-touch-icon-152.png","/report/icons/apple-touch-icon-167.png","/report/icons/apple-touch-icon-180.png","/report/icons/icon-192.png","/report/icons/icon-512.png","/report/icons/icon-maskable-512.png","/report/man-cho-khoi-dong.js","/report/manifest.webmanifest","/report/prevent-pull-to-refresh.js","/report/reload-on-chunk-error.js"];
const CORE = ["/report/favicon.svg","/report/manifest.webmanifest","/report/icons/apple-touch-icon-180.png","/report/icons/apple-touch-icon-167.png","/report/icons/apple-touch-icon-152.png","/report/icons/apple-touch-icon-120.png","/report/fonts/UTM AvoBold.ttf","/report/assets/index-ZiQipqD4.js","/report/assets/vendor-react-Birxz-Xg.js","/report/assets/shared-utils-B7TlnBwz.js","/report/assets/vendor-icons-8Z2_M0K_.js","/report/assets/vendor-firebase-BDIogyZH.js","/report/assets/index-CZHW75Ul.css","/report/reload-on-chunk-error.js","/report/man-cho-khoi-dong.js","/report/prevent-pull-to-refresh.js","/report/prevent-pull-to-refresh.js","/report/reload-on-chunk-error.js","/report/man-cho-khoi-dong.js","/report/fonts/UTM AvoBold.ttf","/report/favicon.svg","/report/manifest.webmanifest"];

/** Mọi lượt tra cache BỎ QUA header Vary (2026-11-16). Chromium (Chrome/Edge/Android) gửi kèm `Origin` cho yêu cầu
 *  `crossorigin` kể cả cùng origin (Vite gắn `crossorigin` vào MỌI script module / CSS / modulepreload; phông cũng vậy) — còn
 *  bản lưu do service worker tự tải (`cache.add(url)`) không có header nào. Máy chủ trả `Vary: Origin` là `cache.match` coi 2
 *  yêu cầu KHÁC NHAU → trượt cache 100% → mất mạng chỉ còn màn chờ (đo: script nhận `origin: http://127.0.0.1:4179`, bản lưu
 *  `[]`). Đo 16/11: `vite preview` trả `Vary: Origin` (bài tests/e2e/offline-app-shell.spec.ts đỏ); GitHub Pages hiện trả
 *  `Vary: Accept-Encoding` (header trình duyệt không đưa vào yêu cầu → vẫn khớp) nên bản chạy thật CHƯA dính; WebKit không
 *  gửi `Origin` cùng origin nên Safari không dính. Sửa để offline không phụ thuộc máy chủ/CDN đang host. File ở đây hoặc có
 *  mã băm trong tên, hoặc là app shell dùng chung — không có biến thể theo header nào, nên bỏ qua Vary là đúng chứ không phải
 *  chữa cháy. Test: tests/unit/sw-khop-bo-qua-vary.test.ts. */
const KHOP = { ignoreVary: true };

/** File /assets/ có mã băm trong tên: bản ở HTTP cache / cache của bản cũ luôn đúng → không cần ép tải lại. */
const requestFor = (u) => new Request(u, { cache: u.includes('/assets/') ? 'default' : 'reload' });

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // index.html bắt buộc; file khác lỗi lẻ tẻ không làm hỏng cả lượt cài.
    await cache.add(new Request(self.registration.scope, { cache: 'reload' }));
    // Chép file /assets/ không đổi từ cache của bản trước (cache cũ chỉ bị dọn ở 'activate') — không tốn mạng.
    await Promise.allSettled(PRECACHE.filter((u) => u.includes('/assets/')).map(async (u) => {
      const old = await caches.match(u, KHOP);
      if (old) await cache.put(u, old);
    }));
    await Promise.allSettled(CORE.map(async (u) => { if (!(await cache.match(u, KHOP))) await cache.add(requestFor(u)); }));
    await self.skipWaiting();
  })());
});

/** Tải ngầm phần còn lại (gọi khi trang báo đã rảnh). Chạy lại nhiều lần không sao: file đã có thì bỏ qua. */
let restRun = null;
function precacheRest() {
  if (!restRun) {
    restRun = (async () => {
      const cache = await caches.open(CACHE);
      const todo = [];
      for (const u of PRECACHE) if (!(await cache.match(u, KHOP))) todo.push(u);
      let i = 0;
      const lane = async () => {
        while (i < todo.length) {
          const u = todo[i++];
          try { await cache.add(requestFor(u)); } catch { /* lỗi lẻ tẻ: lần mở sau tải tiếp */ }
        }
      };
      await Promise.all([lane(), lane(), lane()]);
    })().finally(() => { restRun = null; });
  }
  return restRun;
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ycx-precache-rest') event.waitUntil(precacheRest());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('ycx-shell-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

const isHashedAsset = (url) => url.pathname.includes('/assets/');
const isStaticFile = (url) => /(?:fonts|icons|frame|splash|scripts|Tuts)\//.test(url.pathname) || /\.(woff2?|ttf|png|jpe?g|svg|webp|ico|webmanifest)$/.test(url.pathname) || /(?:prevent-pull-to-refresh|reload-on-chunk-error|man-cho-khoi-dong)\.js$/.test(url.pathname);

async function networkFirstNavigation(event) {
  const request = event.request;
  const cache = await caches.open(CACHE);
  const pathname = new URL(request.url).pathname;
  // SPA: mọi đường dẫn không có đuôi file dùng chung index.html.
  const isShell = !/\.[a-z0-9]+$/i.test(pathname);
  // Tải mạng chạy TIẾP kể cả khi đã quá 4 giây và trang đã nhận bản lưu: về tới thì vẫn LƯU bản mới (2026-10-21). Trước
  // đây quá giờ là bỏ luôn bản mới → mạng chậm thì mãi nhận app shell cũ; bản cũ đòi file /assets/ đã bị xoá sau lượt đăng
  // bản mới → 404 → reload-on-chunk-error.js tải lại → lại quá 4 giây → lại bản cũ: vòng tải lại mỗi 10 giây (log 21/10:
  // resolveSession bị gọi dồn 4 phút, tràn bộ nhớ 2 lần).
  const network = fetch(request).then((fresh) => {
    if (fresh && fresh.ok) return cache.put(isShell ? self.registration.scope : request, fresh.clone()).then(() => fresh);
    return fresh;
  });
  event.waitUntil(network.catch(() => {}));
  try {
    return await Promise.race([
      network,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
    ]);
  } catch (e) {
    const cached = (isShell ? await cache.match(self.registration.scope, KHOP) : await cache.match(request, KHOP));
    if (cached) return cached;
    return network; // không có bản lưu: chờ mạng tới cùng (thay vì báo lỗi sau 4 giây)
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request, KHOP);
  if (hit) return hit;
  const res = await fetch(request);
  if (res && res.ok) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // File userscript (.user.js) KHÔNG để service worker trả lời — mọi kiểu yêu cầu (2026-11-14, ảnh chủ dự án: bấm "Cài đặt
  // Script ngay" chỉ hiện nguyên văn file, không ra trang Cài đặt của Tampermonkey). Tampermonkey bắt lượt mở .user.js ở tầng
  // mạng của trình duyệt (luật cho khung chính); lượt điều hướng do service worker trả lời thì tiện ích không thấy. Lượt kiểm
  // phiên bản (fetch …user.js?t=…) cũng phải luôn lấy mạng, không lưu mỗi lần một bản vào cache.
  if (/\.user\.js$/i.test(url.pathname)) return;
  if (request.mode === 'navigate') { event.respondWith(networkFirstNavigation(event)); return; }
  if (isHashedAsset(url) || isStaticFile(url)) { event.respondWith(cacheFirst(request)); return; }
});
