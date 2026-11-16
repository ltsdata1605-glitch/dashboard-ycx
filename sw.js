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
const VERSION = 'bef88c10e858';
const CACHE = 'ycx-shell-' + VERSION;
const PRECACHE = ["/report/assets/AboutView-Bn31Fer-.js","/report/assets/Badge-CmOFmTao.js","/report/assets/Banner-C4OH1-7y.js","/report/assets/BiWrapper-BTe0skjF.js","/report/assets/BiWrapper-DHw20h5K.css","/report/assets/CheckThuongView-zTERNYPW.js","/report/assets/Checkbox-BmFBWgb3.js","/report/assets/ConfirmDialog-CXIF2bma.js","/report/assets/CouponConverterView-WPR1-c_k.js","/report/assets/EmptyState-3GbtneZ7.js","/report/assets/ExternalToolView-Dfk9RCBH.js","/report/assets/GlobalAutoSyncDock-CVS7jpY4.js","/report/assets/InstallAppHint-CBiG6Ywf.js","/report/assets/InstallGuideModal-DDo6qiIB.js","/report/assets/KhaiThacView-CWQTuuaD.js","/report/assets/KpiCard-BH1wCeAP.js","/report/assets/LineBotView-BknAABqP.js","/report/assets/ListGroup-BhQTrcgV.js","/report/assets/LoginView-BZshBw2i.js","/report/assets/MobileMoreSheet-BV9SrsI9.js","/report/assets/Modal-Wojx1Dl7.js","/report/assets/MultiSelectDropdown-bQVnu_5F.js","/report/assets/NhanVien-BysWdGxN.js","/report/assets/NotificationDropdown-Bnus6Yuc.js","/report/assets/PendingApprovalView-BU1KZ6LX.js","/report/assets/PhanCaView-B14Rh2k2.css","/report/assets/PhanCaView-DCfM_I0G.js","/report/assets/SectionCard-z3PlJ3c3.js","/report/assets/SettingsView-D8UoHJVf.js","/report/assets/StickerPrinterView-BG-gz8jc.js","/report/assets/Switch-Bno6T3eU.js","/report/assets/Tabs-Cg4UX-BI.js","/report/assets/TaxCalculatorView-D_bpdAi5.js","/report/assets/Textarea-DfPQ_Kr7.js","/report/assets/TopBarActions-D6hgxlBM.js","/report/assets/TouchTitleHint-CtYm7-KI.js","/report/assets/UserManagementView-CGt2-OLN.js","/report/assets/analytics.worker-CQkEjqrb.js","/report/assets/autoNavigationService-ymfFl8b6.js","/report/assets/autoReportExportService-BB5GWDXd.js","/report/assets/autoSyncCards-D2dIBbfz.js","/report/assets/bonusHistory-BQDs1An6.js","/report/assets/captureEngine-DEyzj45Z.js","/report/assets/checkThuongIframeService-CIcfOYjq.js","/report/assets/configStore-jfv_oEyo.js","/report/assets/dataUtils-CZFZS1Uq.js","/report/assets/dbService-gTM5yZyA.js","/report/assets/googleSheetsService-D0LTBUzq.js","/report/assets/index-BLdJe3je.js","/report/assets/index-C2shMVW7.css","/report/assets/index-CgJtiJsK.js","/report/assets/index-Cn_j4uxA.js","/report/assets/khaiThacDb-CX_lDk43.js","/report/assets/khoDataService-BOTdRV4b.js","/report/assets/lineBot.types-CsTQV04F.js","/report/assets/presetBi-CJzYsp9_.js","/report/assets/salesJsonWriter.worker-BvXL3ac6.js","/report/assets/salesJsonWriter.worker-iky0iAuj.js","/report/assets/scheduleHeartbeat.worker-DY9MOOqR.js","/report/assets/shared-utils-B7TlnBwz.js","/report/assets/vendor-excel-BGhuli8m.js","/report/assets/vendor-firebase-BDIogyZH.js","/report/assets/vendor-firebase-analytics-XfruttpD.js","/report/assets/vendor-icons-8Z2_M0K_.js","/report/assets/vendor-react-Birxz-Xg.js","/report/assets/ycxAutoSyncService-Dxdd6pVC.js","/report/favicon.svg","/report/fonts/UTM AvoBold.ttf","/report/icons/apple-touch-icon-120.png","/report/icons/apple-touch-icon-152.png","/report/icons/apple-touch-icon-167.png","/report/icons/apple-touch-icon-180.png","/report/icons/icon-192.png","/report/icons/icon-512.png","/report/icons/icon-maskable-512.png","/report/man-cho-khoi-dong.js","/report/manifest.webmanifest","/report/prevent-pull-to-refresh.js","/report/reload-on-chunk-error.js"];
const CORE = ["/report/favicon.svg","/report/manifest.webmanifest","/report/icons/apple-touch-icon-180.png","/report/icons/apple-touch-icon-167.png","/report/icons/apple-touch-icon-152.png","/report/icons/apple-touch-icon-120.png","/report/fonts/UTM AvoBold.ttf","/report/assets/index-Cn_j4uxA.js","/report/assets/vendor-react-Birxz-Xg.js","/report/assets/shared-utils-B7TlnBwz.js","/report/assets/vendor-icons-8Z2_M0K_.js","/report/assets/vendor-firebase-BDIogyZH.js","/report/assets/index-C2shMVW7.css","/report/reload-on-chunk-error.js","/report/man-cho-khoi-dong.js","/report/prevent-pull-to-refresh.js","/report/prevent-pull-to-refresh.js","/report/reload-on-chunk-error.js","/report/man-cho-khoi-dong.js","/report/fonts/UTM AvoBold.ttf","/report/favicon.svg","/report/manifest.webmanifest"];

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
