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
const VERSION = 'd7c7e195f655';
const CACHE = 'ycx-shell-' + VERSION;
const PRECACHE = ["/report/assets/AboutView-Bu79joBU.js","/report/assets/Badge-CmOFmTao.js","/report/assets/Banner-C2rLYoea.js","/report/assets/BiWrapper-DHw20h5K.css","/report/assets/BiWrapper-Z0dUeA5j.js","/report/assets/CheckThuongView-BclNpQrA.js","/report/assets/Checkbox-BmFBWgb3.js","/report/assets/ConfirmDialog-08eAm3Sx.js","/report/assets/CouponConverterView-CDxfks6l.js","/report/assets/EmptyState-DF--NhHZ.js","/report/assets/ExternalToolView-Dfk9RCBH.js","/report/assets/GlobalAutoSyncDock-B2UamhSS.js","/report/assets/InstallAppHint-CUf6wGrM.js","/report/assets/InstallGuideModal-CCe63aaS.js","/report/assets/KhaiThacView-BZDJWScn.js","/report/assets/KpiCard-CNZI3kCB.js","/report/assets/LineBotView-Bu_cpSfR.js","/report/assets/ListGroup-B20kT5Sc.js","/report/assets/LoginView-5L7XCSrV.js","/report/assets/MobileMoreSheet-B7SH2v6C.js","/report/assets/Modal-Baxf8_jP.js","/report/assets/MultiSelectDropdown-CaCti8MJ.js","/report/assets/NhanVien-bJ9qDV5m.js","/report/assets/NotificationDropdown-CCZP6WKz.js","/report/assets/PendingApprovalView-eAiO0C1L.js","/report/assets/PhanCaView-B14Rh2k2.css","/report/assets/PhanCaView-CI6CwWT0.js","/report/assets/SectionCard-z3PlJ3c3.js","/report/assets/SettingsView-BxwOm29q.js","/report/assets/StickerPrinterView-DBZIr9JM.js","/report/assets/Switch-BvJqMFhT.js","/report/assets/Tabs-t9PcQ5Xr.js","/report/assets/TaxCalculatorView-B5wq2sNa.js","/report/assets/Textarea-DfPQ_Kr7.js","/report/assets/TopBarActions-DmSzoXEo.js","/report/assets/TouchTitleHint-CtYm7-KI.js","/report/assets/UserManagementView-Bn5cH5By.js","/report/assets/analytics.worker-CQkEjqrb.js","/report/assets/autoNavigationService-ymfFl8b6.js","/report/assets/autoReportExportService-DhGqcMQM.js","/report/assets/autoSyncCards-D2dIBbfz.js","/report/assets/bonusHistory-xkwVTCUv.js","/report/assets/captureEngine-DUJsvGn4.js","/report/assets/checkThuongIframeService-QnUHz0cn.js","/report/assets/configStore-jfv_oEyo.js","/report/assets/dataUtils-CZFZS1Uq.js","/report/assets/dbService-CPjR3-Gt.js","/report/assets/googleSheetsService-D0LTBUzq.js","/report/assets/index-BLdJe3je.js","/report/assets/index-CZHW75Ul.css","/report/assets/index-CgJtiJsK.js","/report/assets/index-D81NkBiB.js","/report/assets/khaiThacDb-B6V3JsUu.js","/report/assets/khoDataService-Bx7yEkLt.js","/report/assets/lineBot.types-BRPJHIbE.js","/report/assets/presetBi-DlDuvOQV.js","/report/assets/salesJsonWriter.worker-BvXL3ac6.js","/report/assets/salesJsonWriter.worker-iky0iAuj.js","/report/assets/scheduleHeartbeat.worker-DY9MOOqR.js","/report/assets/shared-utils-B7TlnBwz.js","/report/assets/vendor-excel-BGhuli8m.js","/report/assets/vendor-firebase-BDIogyZH.js","/report/assets/vendor-firebase-analytics-XfruttpD.js","/report/assets/vendor-icons-8Z2_M0K_.js","/report/assets/vendor-react-Birxz-Xg.js","/report/assets/ycxAutoSyncService-Dxdd6pVC.js","/report/favicon.svg","/report/fonts/UTM AvoBold.ttf","/report/icons/apple-touch-icon-120.png","/report/icons/apple-touch-icon-152.png","/report/icons/apple-touch-icon-167.png","/report/icons/apple-touch-icon-180.png","/report/icons/icon-192.png","/report/icons/icon-512.png","/report/icons/icon-maskable-512.png","/report/man-cho-khoi-dong.js","/report/manifest.webmanifest","/report/prevent-pull-to-refresh.js","/report/reload-on-chunk-error.js"];
const CORE = ["/report/favicon.svg","/report/manifest.webmanifest","/report/icons/apple-touch-icon-180.png","/report/icons/apple-touch-icon-167.png","/report/icons/apple-touch-icon-152.png","/report/icons/apple-touch-icon-120.png","/report/fonts/UTM AvoBold.ttf","/report/assets/index-D81NkBiB.js","/report/assets/vendor-react-Birxz-Xg.js","/report/assets/shared-utils-B7TlnBwz.js","/report/assets/vendor-icons-8Z2_M0K_.js","/report/assets/vendor-firebase-BDIogyZH.js","/report/assets/index-CZHW75Ul.css","/report/reload-on-chunk-error.js","/report/man-cho-khoi-dong.js","/report/prevent-pull-to-refresh.js","/report/prevent-pull-to-refresh.js","/report/reload-on-chunk-error.js","/report/man-cho-khoi-dong.js","/report/fonts/UTM AvoBold.ttf","/report/favicon.svg","/report/manifest.webmanifest"];

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
