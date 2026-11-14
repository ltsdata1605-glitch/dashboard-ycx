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
const VERSION = 'eaac952fe342';
const CACHE = 'ycx-shell-' + VERSION;
const PRECACHE = ["/assets/AboutView-aWi14bai.js","/assets/Badge-CW_BSyfA.js","/assets/Banner-DCWQ7ApU.js","/assets/BiWrapper-BoaQXXVi.js","/assets/BiWrapper-DHw20h5K.css","/assets/CheckThuongView-BKghSltc.js","/assets/Checkbox-D18PH1g2.js","/assets/ConfirmDialog-CmXrohgM.js","/assets/CouponConverterView-DEzGxhKx.js","/assets/EmptyState-BPk6rxVf.js","/assets/ExternalToolView-C_8c8JMF.js","/assets/GlobalAutoSyncDock-DHcdfogD.js","/assets/InstallAppHint-BEjamMDE.js","/assets/InstallGuideModal-BgzpgWuC.js","/assets/KhaiThacView-B5cdLx1e.js","/assets/KpiCard-CuRjXxrO.js","/assets/LineBotView-DrRN1zMV.js","/assets/ListGroup-B1I5poCl.js","/assets/LoginView-Ur0nkIhY.js","/assets/MobileMoreSheet-DBoTnPPP.js","/assets/Modal-Keph09nP.js","/assets/MultiSelectDropdown-gGeR_LbU.js","/assets/NhanVien-CIYXtFLA.js","/assets/NotificationDropdown-C5jMN9AK.js","/assets/PendingApprovalView-C5JfuBsS.js","/assets/PhanCaView-B14Rh2k2.css","/assets/PhanCaView-BwiJ582j.js","/assets/PriceComparisonView-CfLCP6Do.js","/assets/SectionCard--OET4BYc.js","/assets/SettingsView-BVmejtBn.js","/assets/StickerEventApp-BsT_Pw3A.js","/assets/StickerPrinterView-Cgq6kN0e.js","/assets/Switch-Cn0bkTqA.js","/assets/Tabs-DxD7-yux.js","/assets/TaxCalculatorView-DQpJpg8a.js","/assets/Textarea-1fxv3X62.js","/assets/TopBarActions-BulGZlJV.js","/assets/TouchTitleHint-B2gMPY2Q.js","/assets/UserManagementView-CHILRFjR.js","/assets/analytics.worker-CQkEjqrb.js","/assets/autoNavigationService-DABS8oN0.js","/assets/autoReportExportService-CWsBzRcm.js","/assets/autoSyncCards-D2dIBbfz.js","/assets/bonusHistory-Cm_KYtpj.js","/assets/checkThuongIframeService-D0kK79vt.js","/assets/configStore-jfv_oEyo.js","/assets/dataService-vNKOvbrA.js","/assets/dataUtils-CnSDW-z7.js","/assets/dbService-Be0nuu43.js","/assets/googleSheetsService-D0LTBUzq.js","/assets/html2canvas.esm-QH1iLAAe.js","/assets/index-B2lsIyjC.css","/assets/index-CafwbU3-.js","/assets/index-CgJtiJsK.js","/assets/index-DQNPyJ3i.js","/assets/index.es-BCxSNHA9.js","/assets/jspdf.es.min-BMK6GOJ1.js","/assets/khaiThacDb-feCIl4oj.js","/assets/khoDataService-B1c_sz73.js","/assets/lineBot.types-BIjLqCAL.js","/assets/presetBi-OcsF0AlQ.js","/assets/salesJsonWriter.worker-BNAYiZX6.js","/assets/salesJsonWriter.worker-iky0iAuj.js","/assets/scheduleHeartbeat.worker-DY9MOOqR.js","/assets/shared-utils-B7TlnBwz.js","/assets/vendor-excel-BGhuli8m.js","/assets/vendor-firebase-Bk98Al26.js","/assets/vendor-firebase-analytics-40nNlhQL.js","/assets/vendor-icons-B36_5ndA.js","/assets/vendor-react-BTx_gWm7.js","/assets/ycxAutoSyncService-Dxdd6pVC.js","/favicon.svg","/fonts/UTM AvoBold.ttf","/icons/apple-touch-icon-120.png","/icons/apple-touch-icon-152.png","/icons/apple-touch-icon-167.png","/icons/apple-touch-icon-180.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/man-cho-khoi-dong.js","/manifest.webmanifest","/prevent-pull-to-refresh.js","/reload-on-chunk-error.js"];
const CORE = ["/assets/index-CafwbU3-.js","/assets/vendor-react-BTx_gWm7.js","/assets/shared-utils-B7TlnBwz.js","/assets/vendor-icons-B36_5ndA.js","/assets/vendor-firebase-Bk98Al26.js","/assets/index-B2lsIyjC.css","/prevent-pull-to-refresh.js","/reload-on-chunk-error.js","/man-cho-khoi-dong.js","/fonts/UTM AvoBold.ttf","/favicon.svg","/manifest.webmanifest"];

/** File /assets/ có mã băm trong tên: bản ở HTTP cache / cache của bản cũ luôn đúng → không cần ép tải lại. */
const requestFor = (u) => new Request(u, { cache: u.startsWith('/assets/') ? 'default' : 'reload' });

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // index.html bắt buộc; file khác lỗi lẻ tẻ không làm hỏng cả lượt cài.
    await cache.add(new Request('/index.html', { cache: 'reload' }));
    // Chép file /assets/ không đổi từ cache của bản trước (cache cũ chỉ bị dọn ở 'activate') — không tốn mạng.
    await Promise.allSettled(PRECACHE.filter((u) => u.startsWith('/assets/')).map(async (u) => {
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

const isHashedAsset = (url) => url.pathname.startsWith('/assets/');
const isStaticFile = (url) => /^\/(fonts|icons|frame|splash|scripts|Tuts)\//.test(url.pathname) || /\.(woff2?|ttf|png|jpe?g|svg|webp|ico|webmanifest)$/.test(url.pathname) || /^\/(prevent-pull-to-refresh|reload-on-chunk-error|man-cho-khoi-dong)\.js$/.test(url.pathname);

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
    if (fresh && fresh.ok) return cache.put(isShell ? '/index.html' : request, fresh.clone()).then(() => fresh);
    return fresh;
  });
  event.waitUntil(network.catch(() => {}));
  try {
    return await Promise.race([
      network,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
    ]);
  } catch (e) {
    const cached = (isShell ? await cache.match('/index.html') : await cache.match(request));
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
  if (request.mode === 'navigate') { event.respondWith(networkFirstNavigation(event)); return; }
  if (isHashedAsset(url) || isStaticFile(url)) { event.respondWith(cacheFirst(request)); return; }
});
