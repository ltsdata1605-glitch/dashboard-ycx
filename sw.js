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
const VERSION = 'bfb17cc3862f';
const CACHE = 'ycx-shell-' + VERSION;
const PRECACHE = ["/dashboard-ycx/assets/AboutView-Dq3dUFuZ.js","/dashboard-ycx/assets/Badge-CmOFmTao.js","/dashboard-ycx/assets/Banner-C3eSoLA2.js","/dashboard-ycx/assets/BiWrapper-B65sIgF0.js","/dashboard-ycx/assets/BiWrapper-DHw20h5K.css","/dashboard-ycx/assets/CheckThuongView-vHzqC5-E.js","/dashboard-ycx/assets/Checkbox-BmFBWgb3.js","/dashboard-ycx/assets/ConfirmDialog-BKyS7lRw.js","/dashboard-ycx/assets/CouponConverterView-0Hoe5iD4.js","/dashboard-ycx/assets/EmptyState-BQxNIl98.js","/dashboard-ycx/assets/ExternalToolView-Dfk9RCBH.js","/dashboard-ycx/assets/GlobalAutoSyncDock-DFzC5Jw0.js","/dashboard-ycx/assets/InstallAppHint-D5wL2P6W.js","/dashboard-ycx/assets/InstallGuideModal-B9w51Fjd.js","/dashboard-ycx/assets/KhaiThacView-xNs9McMP.js","/dashboard-ycx/assets/KpiCard-Cn9JwMMl.js","/dashboard-ycx/assets/LineBotView-DWpg7uT0.js","/dashboard-ycx/assets/ListGroup-DNwZOhEq.js","/dashboard-ycx/assets/LoginView-x--N24Xm.js","/dashboard-ycx/assets/MobileMoreSheet-C828eyiA.js","/dashboard-ycx/assets/Modal-BfkrpFNh.js","/dashboard-ycx/assets/MultiSelectDropdown-CHUSM0Ny.js","/dashboard-ycx/assets/NhanVien-DTK2YClc.js","/dashboard-ycx/assets/NotificationDropdown-BOxTzqFL.js","/dashboard-ycx/assets/PendingApprovalView-Cw4ONKq2.js","/dashboard-ycx/assets/PhanCaView-B14Rh2k2.css","/dashboard-ycx/assets/PhanCaView-CdmtKHc1.js","/dashboard-ycx/assets/PriceComparisonView-BDO73pna.js","/dashboard-ycx/assets/SectionCard-z3PlJ3c3.js","/dashboard-ycx/assets/SettingsView-CuFtlpVF.js","/dashboard-ycx/assets/StickerPrinterView-Cn0PkON0.js","/dashboard-ycx/assets/Switch-D7R2cYwk.js","/dashboard-ycx/assets/Tabs-DxgObWjC.js","/dashboard-ycx/assets/TaxCalculatorView-lj_YTmJU.js","/dashboard-ycx/assets/Textarea-DfPQ_Kr7.js","/dashboard-ycx/assets/TopBarActions-DRlL5rYw.js","/dashboard-ycx/assets/TouchTitleHint-CtYm7-KI.js","/dashboard-ycx/assets/UserManagementView-CqhQXImx.js","/dashboard-ycx/assets/analytics.worker-CQkEjqrb.js","/dashboard-ycx/assets/autoNavigationService-ymfFl8b6.js","/dashboard-ycx/assets/autoReportExportService-9sZyJMCe.js","/dashboard-ycx/assets/autoSyncCards-D2dIBbfz.js","/dashboard-ycx/assets/bonusHistory-foMcQ_h3.js","/dashboard-ycx/assets/captureEngine-hqD6MpWo.js","/dashboard-ycx/assets/checkThuongIframeService-Cz6UFKXT.js","/dashboard-ycx/assets/configStore-jfv_oEyo.js","/dashboard-ycx/assets/dataUtils-CZFZS1Uq.js","/dashboard-ycx/assets/dbService-BrsSl40H.js","/dashboard-ycx/assets/googleSheetsService-D0LTBUzq.js","/dashboard-ycx/assets/index-BLdJe3je.js","/dashboard-ycx/assets/index-C7Y14U2v.css","/dashboard-ycx/assets/index-CCMFbq7n.js","/dashboard-ycx/assets/index-CgJtiJsK.js","/dashboard-ycx/assets/khaiThacDb-D8hohtwU.js","/dashboard-ycx/assets/khoDataService-DKFBHIx6.js","/dashboard-ycx/assets/lineBot.types-Bb_zg9Qx.js","/dashboard-ycx/assets/presetBi-BZq-eou7.js","/dashboard-ycx/assets/salesJsonWriter.worker-ebFStE3g.js","/dashboard-ycx/assets/salesJsonWriter.worker-iky0iAuj.js","/dashboard-ycx/assets/scheduleHeartbeat.worker-DY9MOOqR.js","/dashboard-ycx/assets/shared-utils-B7TlnBwz.js","/dashboard-ycx/assets/vendor-excel-BGhuli8m.js","/dashboard-ycx/assets/vendor-firebase-BDIogyZH.js","/dashboard-ycx/assets/vendor-firebase-analytics-XfruttpD.js","/dashboard-ycx/assets/vendor-icons-8Z2_M0K_.js","/dashboard-ycx/assets/vendor-react-Birxz-Xg.js","/dashboard-ycx/assets/ycxAutoSyncService-Dxdd6pVC.js","/dashboard-ycx/favicon.svg","/dashboard-ycx/fonts/UTM AvoBold.ttf","/dashboard-ycx/icons/apple-touch-icon-120.png","/dashboard-ycx/icons/apple-touch-icon-152.png","/dashboard-ycx/icons/apple-touch-icon-167.png","/dashboard-ycx/icons/apple-touch-icon-180.png","/dashboard-ycx/icons/icon-192.png","/dashboard-ycx/icons/icon-512.png","/dashboard-ycx/icons/icon-maskable-512.png","/dashboard-ycx/man-cho-khoi-dong.js","/dashboard-ycx/manifest.webmanifest","/dashboard-ycx/prevent-pull-to-refresh.js","/dashboard-ycx/reload-on-chunk-error.js"];
const CORE = ["/dashboard-ycx/favicon.svg","/dashboard-ycx/manifest.webmanifest","/dashboard-ycx/icons/apple-touch-icon-180.png","/dashboard-ycx/icons/apple-touch-icon-167.png","/dashboard-ycx/icons/apple-touch-icon-152.png","/dashboard-ycx/icons/apple-touch-icon-120.png","/dashboard-ycx/fonts/UTM AvoBold.ttf","/dashboard-ycx/assets/index-CCMFbq7n.js","/dashboard-ycx/assets/vendor-react-Birxz-Xg.js","/dashboard-ycx/assets/shared-utils-B7TlnBwz.js","/dashboard-ycx/assets/vendor-icons-8Z2_M0K_.js","/dashboard-ycx/assets/vendor-firebase-BDIogyZH.js","/dashboard-ycx/assets/index-C7Y14U2v.css","/dashboard-ycx/reload-on-chunk-error.js","/dashboard-ycx/man-cho-khoi-dong.js","/dashboard-ycx/prevent-pull-to-refresh.js","/dashboard-ycx/prevent-pull-to-refresh.js","/dashboard-ycx/reload-on-chunk-error.js","/dashboard-ycx/man-cho-khoi-dong.js","/dashboard-ycx/fonts/UTM AvoBold.ttf","/dashboard-ycx/favicon.svg","/dashboard-ycx/manifest.webmanifest"];

/** File /assets/ có mã băm trong tên: bản ở HTTP cache / cache của bản cũ luôn đúng → không cần ép tải lại. */
const requestFor = (u) => new Request(u, { cache: u.includes('/assets/') ? 'default' : 'reload' });

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // index.html bắt buộc; file khác lỗi lẻ tẻ không làm hỏng cả lượt cài.
    await cache.add(new Request(self.registration.scope, { cache: 'reload' }));
    // Chép file /assets/ không đổi từ cache của bản trước (cache cũ chỉ bị dọn ở 'activate') — không tốn mạng.
    await Promise.allSettled(PRECACHE.filter((u) => u.includes('/assets/')).map(async (u) => {
      const old = await caches.match(u);
      if (old) await cache.put(u, old);
    }));
    await Promise.allSettled(CORE.map(async (u) => { if (!(await cache.match(u))) await cache.add(requestFor(u)); }));
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
      for (const u of PRECACHE) if (!(await cache.match(u))) todo.push(u);
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
    const cached = (isShell ? await cache.match(self.registration.scope) : await cache.match(request));
    if (cached) return cached;
    return network; // không có bản lưu: chờ mạng tới cùng (thay vì báo lỗi sau 4 giây)
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
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
