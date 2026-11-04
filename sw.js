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
const VERSION = 'eaf52c527185';
const CACHE = 'ycx-shell-' + VERSION;
const PRECACHE = ["/assets/AboutView-h8Hfcpwn.js","/assets/AreaAutoExportButton-CAblyxvQ.js","/assets/Badge-B2WWRDU5.js","/assets/Banner-BI_H3C5Z.js","/assets/BiWrapper-DHw20h5K.css","/assets/BiWrapper-DsvJ3Mdv.js","/assets/ChangelogModal-DmOuK8z3.js","/assets/CheckThuongView-DzlxANZO.js","/assets/Checkbox-erM004yg.js","/assets/ConfirmDialog-D73z1AV0.js","/assets/CouponConverterView-NVAeKxqT.js","/assets/DashboardView-BVcerZoz.js","/assets/DataUpdater-C26SIAEF.js","/assets/EmployeeAnalysis-Bvpn9ED5.js","/assets/EmptyState-DRhcKcAh.js","/assets/ExportOptionsModal-XVT0mgHE.js","/assets/ExternalToolView-_ZslFrro.js","/assets/FileHistoryModal-CIypSKpk.js","/assets/FileNamingModal-BhBCTw12.js","/assets/GlobalAutoSyncDock-D7SdRa-K.js","/assets/IndustryGrid-CQDCe_UO.js","/assets/InstallAppHint-xENIPZMC.js","/assets/KhaiThacView-CDxtCkXL.js","/assets/KpiCard-4o3ccVw2.js","/assets/KpiCardConfigModal-D5WIKXBE.js","/assets/LineBotView-Nn0FcFoG.js","/assets/ListGroup-BvMJmBVe.js","/assets/LoginView-BUrLtbWz.js","/assets/MobileMoreSheet-DfRfJb2v.js","/assets/Modal-BiXUuLQ8.js","/assets/MultiSelectDropdown-mak2NwCj.js","/assets/NhanVien-BWkFSm8t.js","/assets/NotificationDropdown-CmnWxp5I.js","/assets/PendingApprovalView-D6Ky-Rvc.js","/assets/PerformanceModal-Iq11YGIj.js","/assets/PhanCaView-B14Rh2k2.css","/assets/PhanCaView-De1HM1iv.js","/assets/PriceComparisonView-BYoO7xGF.js","/assets/SectionCard-B-drYcSA.js","/assets/SectionHeader-kmobJlRw.js","/assets/Select-yuYXkJYD.js","/assets/SettingsView-CAAXRGV-.js","/assets/ShiftWarehouseInputModal-UZ53AQhf.js","/assets/StickerEventApp-D7CwCQKo.js","/assets/StickerPrinterView-CdtlzTPf.js","/assets/StringMultiSelect-BLUT98Bx.js","/assets/SummaryTable-CxsGs25T.js","/assets/Switch-ooBm2X5n.js","/assets/TaxCalculatorView-_nnldLRw.js","/assets/Textarea-DfYp8IZh.js","/assets/TopBarActions-BqZoWUYw.js","/assets/TouchTitleHint-CXZ80T58.js","/assets/TrendChart-F1Kz8_RB.js","/assets/UncollectedOrdersModal-BY2HZWQ-.js","/assets/UnconfiguredGroupsModal-D8nkCQlM.js","/assets/UnshippedOrdersModal-wRoueeur.js","/assets/UploadConflictModal-_dAyCyPk.js","/assets/UploadTypeSelectionModal-k6jY3hpy.js","/assets/UserManagementView-CvLw1oAA.js","/assets/analysisEmployeeSyncService-BEbJHJhR.js","/assets/analytics.worker-CQkEjqrb.js","/assets/analytics.worker-Dc-N7PKi.js","/assets/analytics.worker-aCj7SzVk.js","/assets/autoNavigationService-B2snSxUE.js","/assets/autoReportExportService-Cr0xRqLV.js","/assets/autoSyncCards-Cqo-iQXK.js","/assets/captureEngine-DIrh5wGV.js","/assets/chartConfig-C-f7hsgo.js","/assets/checkThuongIframeService-CHd_xYfL.js","/assets/cloudDataService-Cfd_NlRj.js","/assets/configStore-jfv_oEyo.js","/assets/dataService-Bz0jmDBU.js","/assets/dataUtils-Cb2kIQgh.js","/assets/dbService-CCZPC2cX.js","/assets/firebaseProductConfigService-Dq3uSCnl.js","/assets/googleSheetsService-BGBmW1BJ.js","/assets/googleSheetsService-D0LTBUzq.js","/assets/html2canvas.esm-QH1iLAAe.js","/assets/index-BIFoWCtc.js","/assets/index-CF1DtSXi.js","/assets/index-CgJtiJsK.js","/assets/index-CpYYgz3_.css","/assets/index-DuaGrbqz.js","/assets/index.es-DxBRZyMr.js","/assets/industryColors-NaMQqhES.js","/assets/jspdf.es.min-DCLKcPbe.js","/assets/khaiThacDb-QK7Fr7eQ.js","/assets/khoApplyPolicy-D5mz-J7x.js","/assets/khoDataService-B9XxKlAp.js","/assets/lineBot.types-DRvUDZ5n.js","/assets/moTaBoLoc-B6sNO7U6.js","/assets/presetBi-C1JTWj2x.js","/assets/salesJsonWriter.worker-BNAYiZX6.js","/assets/salesJsonWriter.worker-iky0iAuj.js","/assets/saoChep-CGxi3aHP.js","/assets/scheduleHeartbeat.worker-DY9MOOqR.js","/assets/shared-utils-B_Pb1ZNr.js","/assets/summaryService-CZT6fVpm.js","/assets/systemAnnouncementService-CxPTKFvY.js","/assets/useBiAutoSync-da8QKGud.js","/assets/useMultiMonthBonusRun-D9cyFBS8.js","/assets/vendor-charts-C3TwIp4Y.js","/assets/vendor-excel-BGhuli8m.js","/assets/vendor-firebase-DVZPizMJ.js","/assets/vendor-firebase-analytics-5cGotuqA.js","/assets/vendor-icons-DmTakvj8.js","/assets/vendor-react-spjDHvdB.js","/assets/worker-cpR07IC2.js","/assets/ycxAutoSyncService-ChSf_ltt.js","/favicon.svg","/fonts/UTM AvoBold.ttf","/icons/apple-touch-icon-120.png","/icons/apple-touch-icon-152.png","/icons/apple-touch-icon-167.png","/icons/apple-touch-icon-180.png","/icons/icon-192.png","/icons/icon-512.png","/icons/icon-maskable-512.png","/man-cho-khoi-dong.js","/manifest.webmanifest","/prevent-pull-to-refresh.js","/reload-on-chunk-error.js"];
const CORE = ["/assets/index-CF1DtSXi.js","/assets/vendor-react-spjDHvdB.js","/assets/shared-utils-B_Pb1ZNr.js","/assets/vendor-icons-DmTakvj8.js","/assets/vendor-firebase-DVZPizMJ.js","/assets/index-CpYYgz3_.css","/prevent-pull-to-refresh.js","/reload-on-chunk-error.js","/man-cho-khoi-dong.js","/fonts/UTM AvoBold.ttf","/favicon.svg","/manifest.webmanifest"];

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
