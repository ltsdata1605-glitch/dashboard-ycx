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
const VERSION = 'f84fe0ae1cd7';
const CACHE = 'ycx-shell-' + VERSION;
const PRECACHE = ["/assets/AboutView-CZQ_E0YF.js","/assets/AreaAutoExportButton-zIrnvjpc.js","/assets/Badge-B2WWRDU5.js","/assets/Banner-tTpicTN6.js","/assets/BiWrapper-CUC3_ODu.js","/assets/BiWrapper-DHw20h5K.css","/assets/ChangelogModal-CyOeJjkq.js","/assets/CheckThuongView-0oB9GJgk.js","/assets/Checkbox-erM004yg.js","/assets/ConfirmDialog-B1rNErE1.js","/assets/CouponConverterView-esj_TbKq.js","/assets/DashboardView-Cdjk0MDd.js","/assets/DataUpdater-S5bXyHDK.js","/assets/EmployeeAnalysis-CR0KYGLh.js","/assets/EmptyState-BnCDVqir.js","/assets/ExportOptionsModal-BTUE_0fw.js","/assets/ExternalToolView-_ZslFrro.js","/assets/FileHistoryModal-4gfpyEpZ.js","/assets/FileNamingModal-BNQdFhi6.js","/assets/GlobalAutoSyncDock-CeyZMI5B.js","/assets/IndustryGrid-B1vpHv-K.js","/assets/InstallAppHint-BZrY21V4.js","/assets/KhaiThacView-jMR8TviF.js","/assets/KpiCard-DHHOwn8t.js","/assets/KpiCardConfigModal-CsF4_6qX.js","/assets/LineBotView-CnZZxsMl.js","/assets/ListGroup-BMwIdi-n.js","/assets/LoginView-BvctS3k6.js","/assets/MobileMoreSheet-BYFCH_WK.js","/assets/Modal-E-A4Hjhk.js","/assets/MultiSelectDropdown-y4EYzTyZ.js","/assets/NhanVien-BbR7QNjr.js","/assets/NotificationDropdown-BQPo3TSU.js","/assets/PendingApprovalView-CTzK_T-o.js","/assets/PerformanceModal-YuLeXIjY.js","/assets/PhanCaView-B14Rh2k2.css","/assets/PhanCaView-BK6P_n6F.js","/assets/PriceComparisonView-i8e-8_gH.js","/assets/SectionCard-B-drYcSA.js","/assets/SectionHeader-D2OlLuJ5.js","/assets/Select-BpYqvZH3.js","/assets/SettingsView-uXT4siVr.js","/assets/ShiftWarehouseInputModal-rZqBIdM4.js","/assets/StickerEventApp-GWiDtplK.js","/assets/StickerPrinterView-CUm-P14T.js","/assets/StringMultiSelect-DFHW5A1Y.js","/assets/SummaryTable-CAlUr5Lw.js","/assets/Switch-BWwwtYpC.js","/assets/TaxCalculatorView-niZYwyw5.js","/assets/Textarea-DfYp8IZh.js","/assets/TopBarActions-BfivXpJB.js","/assets/TouchTitleHint-CXZ80T58.js","/assets/TrendChart-CXkIhbBq.js","/assets/UncollectedOrdersModal-Be0RivqQ.js","/assets/UnconfiguredGroupsModal-Ci1TJVWJ.js","/assets/UnshippedOrdersModal-B6Q7WLEG.js","/assets/UploadConflictModal-SkQAKia5.js","/assets/UploadTypeSelectionModal-CzXBfb0d.js","/assets/UserManagementView-CUjPhpKg.js","/assets/analysisEmployeeSyncService-CA5EEjY9.js","/assets/analytics.worker-CQkEjqrb.js","/assets/analytics.worker-Dc-N7PKi.js","/assets/analytics.worker-aCj7SzVk.js","/assets/autoNavigationService-B7yDp_IZ.js","/assets/autoReportExportService-D7oKdWT1.js","/assets/captureEngine-B6VAi_gf.js","/assets/chartConfig-C-f7hsgo.js","/assets/checkThuongIframeService-BQqjWUr1.js","/assets/cloudDataService-DH9uxnqT.js","/assets/configStore-jfv_oEyo.js","/assets/dataService-D6y-tUGn.js","/assets/dataUtils-CwwYIGg8.js","/assets/dbService-v9UP2P1L.js","/assets/firebaseProductConfigService-BBB_5dtM.js","/assets/googleSheetsService-BGBmW1BJ.js","/assets/googleSheetsService-D0LTBUzq.js","/assets/html2canvas.esm-QH1iLAAe.js","/assets/index-BIFoWCtc.js","/assets/index-CgJtiJsK.js","/assets/index-CvuJnNKe.js","/assets/index-DuaGrbqz.js","/assets/index-Yqd4S-bk.css","/assets/index.es-BeKsK3Vr.js","/assets/industryColors-NaMQqhES.js","/assets/jspdf.es.min-DdFkxrLA.js","/assets/khaiThacDb-DE2ju8Si.js","/assets/khoApplyPolicy-D5mz-J7x.js","/assets/khoDataService-DhgAcHBz.js","/assets/lineBot.types-Bw453DoZ.js","/assets/moTaBoLoc-B6sNO7U6.js","/assets/presetBi-BDF4FJ1c.js","/assets/salesJsonWriter.worker-BNAYiZX6.js","/assets/salesJsonWriter.worker-iky0iAuj.js","/assets/saoChep-DeiOkrDu.js","/assets/scheduleHeartbeat.worker-DY9MOOqR.js","/assets/shared-utils-B_Pb1ZNr.js","/assets/summaryService-6CoCOHNv.js","/assets/systemAnnouncementService-T-nhhRiW.js","/assets/useBiAutoSync-BALz19HD.js","/assets/useMultiMonthBonusRun-CfDLtRhU.js","/assets/vendor-charts-C3TwIp4Y.js","/assets/vendor-excel-BGhuli8m.js","/assets/vendor-firebase-DVZPizMJ.js","/assets/vendor-firebase-analytics-5cGotuqA.js","/assets/vendor-icons-DmTakvj8.js","/assets/vendor-react-spjDHvdB.js","/assets/worker-cpR07IC2.js","/assets/ycxAutoSyncService-ChSf_ltt.js","/favicon.svg","/fonts/UTM AvoBold.ttf","/icons/apple-touch-icon-120.png","/icons/apple-touch-icon-152.png","/icons/apple-touch-icon-167.png","/icons/apple-touch-icon-180.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/man-cho-khoi-dong.js","/manifest.webmanifest","/prevent-pull-to-refresh.js","/reload-on-chunk-error.js"];
const CORE = ["/assets/index-CvuJnNKe.js","/assets/vendor-react-spjDHvdB.js","/assets/shared-utils-B_Pb1ZNr.js","/assets/vendor-icons-DmTakvj8.js","/assets/vendor-firebase-DVZPizMJ.js","/assets/index-Yqd4S-bk.css","/prevent-pull-to-refresh.js","/reload-on-chunk-error.js","/man-cho-khoi-dong.js","/fonts/UTM AvoBold.ttf","/favicon.svg","/manifest.webmanifest"];

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
