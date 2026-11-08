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
const VERSION = '1143c47bf24f';
const CACHE = 'ycx-shell-' + VERSION;
const PRECACHE = ["/assets/AboutView-V8Chy9v9.js","/assets/Badge-B2WWRDU5.js","/assets/Banner-CWGi3oI2.js","/assets/BiWrapper-BCuyK9eW.js","/assets/BiWrapper-DHw20h5K.css","/assets/ChangelogModal-D_D7RKMK.js","/assets/CheckThuongView-B3s_noS2.js","/assets/Checkbox-erM004yg.js","/assets/ConfirmDialog-Hy_zbVJk.js","/assets/CouponConverterView-B3bSKaSX.js","/assets/DashboardView-CYarR-Dk.js","/assets/DataUpdater-DPrxF_9t.js","/assets/EmployeeAnalysis-Di6mLx3g.js","/assets/EmptyState-C6h1Vp8x.js","/assets/ExportOptionsModal-Oxf92skJ.js","/assets/ExternalToolView-_ZslFrro.js","/assets/FeatureLandingLayout-BxGnKD0F.js","/assets/FileHistoryModal-DyuyFGTp.js","/assets/FileNamingModal-B7tG3nm7.js","/assets/GlobalAutoSyncDock-DYvlhIbQ.js","/assets/IndustryGrid-c042dl7A.js","/assets/InstallAppHint-DqnPfFoz.js","/assets/KhaiThacView-DiVC4VF7.js","/assets/KpiCard-D--En74m.js","/assets/KpiCardConfigModal-B41VcaJ5.js","/assets/LineBotView-D4PlLBqj.js","/assets/ListGroup-mZ91j5vQ.js","/assets/LoginView-C7SgSdR_.js","/assets/MobileMoreSheet-C5ETlANe.js","/assets/Modal-CsoI_kta.js","/assets/MultiSelectDropdown-pvXBVF9c.js","/assets/NhanVien-J02Kl49R.js","/assets/NotificationDropdown-DX5s9Tod.js","/assets/PendingApprovalView-Sdj0WAcC.js","/assets/PerformanceModal-D1-vQnSy.js","/assets/PhanCaView-B14Rh2k2.css","/assets/PhanCaView-GveTXE8e.js","/assets/PriceComparisonView-DpMB0NKn.js","/assets/SectionCard-B-drYcSA.js","/assets/SectionHeader-DDdJICx-.js","/assets/Select-BdC7z_9-.js","/assets/SettingsView-DIhYYPvK.js","/assets/ShiftWarehouseInputModal-D9xqpVhR.js","/assets/StickerEventApp-BPzKw_bo.js","/assets/StickerPrinterView-BSkbxtfo.js","/assets/StringMultiSelect-BoIrNXRJ.js","/assets/SummaryTable-CgxZ_SyH.js","/assets/Switch-3B63_CQO.js","/assets/TaxCalculatorView-CzcYoNG7.js","/assets/Textarea-DfYp8IZh.js","/assets/TopBarActions-CHBv4_fJ.js","/assets/TouchTitleHint-CXZ80T58.js","/assets/TrendChart-BnIcpeVC.js","/assets/UncollectedOrdersModal-Gw8SKPdb.js","/assets/UnconfiguredGroupsModal-Bvu0T2h3.js","/assets/UnshippedOrdersModal-DYHkQLLE.js","/assets/UploadConflictModal-CDa17KF3.js","/assets/UploadTypeSelectionModal-OBP1sBX4.js","/assets/UserManagementView-BQ83ZcP_.js","/assets/analysisEmployeeSyncService-j0hZn9_K.js","/assets/analytics.worker-CQkEjqrb.js","/assets/analytics.worker-Dc-N7PKi.js","/assets/analytics.worker-aCj7SzVk.js","/assets/autoNavigationService-e4ptvpTT.js","/assets/autoReportExportService-CVZmjjtY.js","/assets/autoSyncCards-Cqo-iQXK.js","/assets/captureEngine-bpMVKkG-.js","/assets/chartConfig-C-f7hsgo.js","/assets/checkThuongIframeService--ixOHv-T.js","/assets/cloudDataService-Dqo84hG7.js","/assets/configStore-jfv_oEyo.js","/assets/dataService-KpH3_O0j.js","/assets/dataUtils-BuJ6TFkm.js","/assets/dbService-BH7cpGkD.js","/assets/firebaseProductConfigService-Cilcodv1.js","/assets/googleSheetsService-BGBmW1BJ.js","/assets/googleSheetsService-D0LTBUzq.js","/assets/html2canvas.esm-QH1iLAAe.js","/assets/index-BIFoWCtc.js","/assets/index-CU5W-4mS.css","/assets/index-CgJtiJsK.js","/assets/index-DuaGrbqz.js","/assets/index-laM-Onr4.js","/assets/index.es-LX9kLqzo.js","/assets/industryColors-NaMQqhES.js","/assets/jspdf.es.min-Dny__1eT.js","/assets/khaiThacDb-BVOPXZLB.js","/assets/khoApplyPolicy-D5mz-J7x.js","/assets/khoDataService-D_MpQ5-A.js","/assets/lineBot.types-DLCyjs27.js","/assets/moTaBoLoc-B6sNO7U6.js","/assets/presetBi-phHzPAuz.js","/assets/salesJsonWriter.worker-BNAYiZX6.js","/assets/salesJsonWriter.worker-iky0iAuj.js","/assets/saoChep-482yuZmF.js","/assets/scheduleHeartbeat.worker-DY9MOOqR.js","/assets/shared-utils-B_Pb1ZNr.js","/assets/summaryService-AJbp4JRq.js","/assets/systemAnnouncementService-BIx3V9zn.js","/assets/useBiAutoSync-BLbiof0n.js","/assets/useMultiMonthBonusRun-DE75N8da.js","/assets/vendor-charts-C3TwIp4Y.js","/assets/vendor-excel-BGhuli8m.js","/assets/vendor-firebase-DVZPizMJ.js","/assets/vendor-firebase-analytics-5cGotuqA.js","/assets/vendor-icons-DVrjBvzN.js","/assets/vendor-react-spjDHvdB.js","/assets/worker-cpR07IC2.js","/assets/ycxAutoSyncService-ChSf_ltt.js","/favicon.svg","/fonts/UTM AvoBold.ttf","/icons/apple-touch-icon-120.png","/icons/apple-touch-icon-152.png","/icons/apple-touch-icon-167.png","/icons/apple-touch-icon-180.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/man-cho-khoi-dong.js","/manifest.webmanifest","/prevent-pull-to-refresh.js","/reload-on-chunk-error.js"];
const CORE = ["/assets/index-laM-Onr4.js","/assets/vendor-react-spjDHvdB.js","/assets/shared-utils-B_Pb1ZNr.js","/assets/vendor-icons-DVrjBvzN.js","/assets/vendor-firebase-DVZPizMJ.js","/assets/index-CU5W-4mS.css","/prevent-pull-to-refresh.js","/reload-on-chunk-error.js","/man-cho-khoi-dong.js","/fonts/UTM AvoBold.ttf","/favicon.svg","/manifest.webmanifest"];

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
