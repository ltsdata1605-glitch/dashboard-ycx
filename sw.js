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
const VERSION = '61551678f923';
const CACHE = 'ycx-shell-' + VERSION;
const PRECACHE = ["/assets/AboutView-BjNOb0bC.js","/assets/Badge-B2WWRDU5.js","/assets/Banner-D7fXXwVd.js","/assets/BiWrapper-C_dcGyOk.js","/assets/BiWrapper-DHw20h5K.css","/assets/ChangelogModal-MbSVDW47.js","/assets/CheckThuongView-CTuaRcP7.js","/assets/Checkbox-erM004yg.js","/assets/ConfirmDialog-BsLSh_ud.js","/assets/CouponConverterView-CEfcXoAo.js","/assets/DashboardView-DGIT6gBF.js","/assets/DataUpdater-DX9Mcwc-.js","/assets/EmployeeAnalysis-DBY72NQ0.js","/assets/EmptyState-bms7lt9S.js","/assets/ExportOptionsModal-BkGUs8hs.js","/assets/ExternalToolView-_ZslFrro.js","/assets/FeatureLandingLayout-C_BdTCDw.js","/assets/FileHistoryModal-Bay3d_e4.js","/assets/FileNamingModal-B4cRSqg-.js","/assets/GlobalAutoSyncDock-D-2YmwBI.js","/assets/IndustryGrid-ymfHqCIm.js","/assets/InstallAppHint-BtpiV6DU.js","/assets/InstallGuideModal-fKyalAmT.js","/assets/KhaiThacView-DiI6T7V9.js","/assets/KpiCard-BbnFtsqj.js","/assets/KpiCardConfigModal-Czu3YX_V.js","/assets/LineBotView-f3gmupqG.js","/assets/ListGroup-kuQuTm52.js","/assets/LoginView-CJvucpn7.js","/assets/MobileMoreSheet-B1CXBpJ1.js","/assets/Modal-CuAOdQKw.js","/assets/MultiSelectDropdown-Bpg8YHFY.js","/assets/NhanVien-99CjM-it.js","/assets/NotificationDropdown-D_zn4jGn.js","/assets/PendingApprovalView-eZtn5NPS.js","/assets/PerformanceModal-D6VTFWpQ.js","/assets/PhanCaView-B14Rh2k2.css","/assets/PhanCaView-CYM8MxSm.js","/assets/PriceComparisonView-Cv2y23HR.js","/assets/SectionCard-B-drYcSA.js","/assets/SectionHeader-itMrm_FA.js","/assets/Select-ChJAGcWW.js","/assets/SettingsView-un6YMt6v.js","/assets/ShiftWarehouseInputModal-BBAR1iGA.js","/assets/StickerEventApp-BmI6L_3X.js","/assets/StickerPrinterView-DiGlHJUp.js","/assets/StringMultiSelect-ZN8-End4.js","/assets/SummaryTable-Dt8VyfHW.js","/assets/Switch-B5Swyt23.js","/assets/TaxCalculatorView-BgnYczgR.js","/assets/Textarea-DfYp8IZh.js","/assets/TopBarActions-BGV28H3R.js","/assets/TouchTitleHint-CXZ80T58.js","/assets/TrendChart-oXeVi1oh.js","/assets/UncollectedOrdersModal-CkTd6H0g.js","/assets/UnconfiguredGroupsModal-COVTHK1Z.js","/assets/UnshippedOrdersModal-DEUyXyW_.js","/assets/UploadConflictModal-BQmhttvi.js","/assets/UploadTypeSelectionModal-eol_EtJE.js","/assets/UserManagementView-C5trJKOq.js","/assets/analysisEmployeeSyncService-CtlxWVqR.js","/assets/analytics.worker-CQkEjqrb.js","/assets/analytics.worker-Dc-N7PKi.js","/assets/analytics.worker-aCj7SzVk.js","/assets/autoNavigationService-B2m9vqhK.js","/assets/autoReportExportService-CxC6oa3J.js","/assets/autoSyncCards-Cqo-iQXK.js","/assets/captureEngine-CDxAuQeh.js","/assets/chartConfig-C-f7hsgo.js","/assets/checkThuongIframeService-B_mgvZAa.js","/assets/cloudDataService-DGnXdmGq.js","/assets/configStore-jfv_oEyo.js","/assets/dataService-DMkNq9uu.js","/assets/dataUtils-Bj4iTg1D.js","/assets/dbService-B7CPYBV0.js","/assets/firebaseProductConfigService-B-L3kHrF.js","/assets/googleSheetsService-BGBmW1BJ.js","/assets/googleSheetsService-D0LTBUzq.js","/assets/html2canvas.esm-QH1iLAAe.js","/assets/index-BIFoWCtc.js","/assets/index-C7_d1C9Y.js","/assets/index-CKeQdMLm.css","/assets/index-CgJtiJsK.js","/assets/index-DuaGrbqz.js","/assets/index.es-BXFkPSOY.js","/assets/industryColors-NaMQqhES.js","/assets/jspdf.es.min-DM6R2z-i.js","/assets/khaiThacDb--ggikoXr.js","/assets/khoApplyPolicy-D5mz-J7x.js","/assets/khoDataService-BjfPhklf.js","/assets/lineBot.types-H-ikcOdl.js","/assets/moTaBoLoc-B6sNO7U6.js","/assets/presetBi-B7txOqr1.js","/assets/salesJsonWriter.worker-BNAYiZX6.js","/assets/salesJsonWriter.worker-iky0iAuj.js","/assets/saoChep-Dv0bLNu1.js","/assets/scheduleHeartbeat.worker-DY9MOOqR.js","/assets/shared-utils-B_Pb1ZNr.js","/assets/summaryService-BvZ915PU.js","/assets/systemAnnouncementService-C8CZLtuM.js","/assets/useBiAutoSync-v1sVn4y4.js","/assets/useMultiMonthBonusRun-Dyy7tH6y.js","/assets/vendor-charts-C3TwIp4Y.js","/assets/vendor-excel-BGhuli8m.js","/assets/vendor-firebase-DVZPizMJ.js","/assets/vendor-firebase-analytics-5cGotuqA.js","/assets/vendor-icons-DVrjBvzN.js","/assets/vendor-react-spjDHvdB.js","/assets/worker-cpR07IC2.js","/assets/ycxAutoSyncService-ChSf_ltt.js","/favicon.svg","/fonts/UTM AvoBold.ttf","/icons/apple-touch-icon-120.png","/icons/apple-touch-icon-152.png","/icons/apple-touch-icon-167.png","/icons/apple-touch-icon-180.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/man-cho-khoi-dong.js","/manifest.webmanifest","/prevent-pull-to-refresh.js","/reload-on-chunk-error.js"];
const CORE = ["/assets/index-C7_d1C9Y.js","/assets/vendor-react-spjDHvdB.js","/assets/shared-utils-B_Pb1ZNr.js","/assets/vendor-icons-DVrjBvzN.js","/assets/vendor-firebase-DVZPizMJ.js","/assets/index-CKeQdMLm.css","/prevent-pull-to-refresh.js","/reload-on-chunk-error.js","/man-cho-khoi-dong.js","/fonts/UTM AvoBold.ttf","/favicon.svg","/manifest.webmanifest"];

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
