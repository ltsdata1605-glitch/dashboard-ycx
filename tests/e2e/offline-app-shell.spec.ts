import { test, expect, type Page } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import { APP_BASE } from './helpers/appBase';
import { chanGhiCloud, dangNhapRest, hasCustomToken } from './helpers/customTokenLogin';

/**
 * Offline (chủ dự án chốt 2026-10-08): mở app khi MẤT MẠNG vẫn thấy giao diện, không trang trắng.
 * Service worker chỉ có ở BẢN BUILD (dist/sw.js) nên test dựng `vite preview` trên dist; chưa build thì bỏ qua
 * (chạy: npm run build && npx playwright test tests/e2e/offline-app-shell.spec.ts).
 */
const PORT = 4179;
// App + service worker ở đường dẫn con APP_BASE (vite `base`, constants/appBase.ts) — phạm vi SW không phủ gốc '/'.
const BASE = `http://127.0.0.1:${PORT}${APP_BASE}`;
let server: ChildProcess | null = null;

test.skip(!fs.existsSync('dist/sw.js'), 'Chưa build: thiếu dist/sw.js');

test.beforeAll(async () => {
  // Gọi thẳng vite (không qua npx): kill ở afterAll chỉ trúng tiến trình npx, vite con sống tiếp giữ cổng 4179 (đo 22/10) → lần
  // chạy sau --strictPort hỏng nhưng vòng chờ dưới vẫn thấy máy chủ CŨ trả lời → test chạy trên bản build cũ.
  server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE)).ok) return; } catch { /* chưa lên */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('vite preview không khởi động được');
});
test.afterAll(() => { server?.kill('SIGTERM'); });

/** Chờ service worker tải sẵn xong: cache của bản này có đủ file (lõi lúc cài + phần tải ngầm khi trang rảnh). */
const choTaiSanXong = async (page: Page) => {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await expect.poll(async () => page.evaluate(async () => {
    const keys = (await caches.keys()).filter((k) => k.startsWith('ycx-shell-'));
    if (keys.length !== 1) return 0;
    return (await (await caches.open(keys[0])).keys()).length;
  }), { timeout: 90_000 }).toBeGreaterThan(60);
};

/* Dấu hiệu "React ĐÃ DỰNG XONG" — KHÔNG dò chữ trong <body> (2026-11-16). Bài này từng qua dù mất mạng chỉ còn màn chờ: nó chờ
 * /dashboard/i mà chữ "Dashboard" nằm sẵn trong màn chờ TĨNH #ycx-splash của index.html (có trước khi một dòng JS nào chạy).
 * Chủ dự án đổi tiêu đề sang "Báo Cáo" (aa2cd7e) mới lộ lỗi: trên vite preview (`Vary: Origin`) Chromium trượt cache ở MỌI file
 * /assets/ — scripts/sw-template.js `KHOP`. Chỉ dùng phần tử mà chỉ component React vẽ ra. */
const manDangNhap = (page: Page) => page.getByTestId('login-view');
/** Khung app sau khi đăng nhập (App.tsx AppContent) — không có ở màn đăng nhập/màn chờ. */
const khungApp = (page: Page) => page.locator('#global-header-actions');

/** `context.setOffline()` trên WebKit của Playwright làm hỏng CẢ lượt tải mà service worker trả từ cache ("WebKit encountered an
 *  internal error" — đo 16/11: fetch một file đã nằm trong cache cũng hỏng), nên bài dùng setOffline chỉ đo trên Chromium. WebKit
 *  (engine Safari iPhone) đo bằng bài "máy chủ không tới được" bên dưới: tắt hẳn máy chủ — cùng đường lỗi mạng của service worker. */
const SETOFFLINE_HONG_TREN_WEBKIT = 'Playwright WebKit: setOffline chặn cả phản hồi từ cache của service worker — xem bài "máy chủ không tới được"';

/** Máy chủ tĩnh riêng trên dist/ (không qua vite preview) với công tắc vite preview không có: `cham` (index.html trả sau 6 s),
 *  `banMoi` (index.html mang dấu bản mới), `tat()` (ngừng hẳn, đóng cả kết nối keep-alive). page.route không chặn được yêu cầu do
 *  service worker tự gửi nên phải làm ở máy chủ. `vary`: header Vary gửi kèm mọi file (vd 'Origin' như vite preview). */
const mayChuDist = async (port: number, opts: { vary?: string } = {}) => {
  const http = await import('node:http');
  const path = await import('node:path');
  const cong = { cham: false, banMoi: false };
  const loai: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
  const sv = http.createServer((req, res) => {
    const p = decodeURIComponent((req.url || '/').split('?')[0]).replace(new RegExp(`^${APP_BASE.replace(/\/$/, '')}(?=/|$)`), '');
    let f = path.join('dist', p);
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join('dist', 'index.html');
    const gui = () => {
      let body: Buffer | string = fs.readFileSync(f);
      if (f.endsWith('index.html') && cong.banMoi) body = body.toString().replace('</body>', '<!--BAN-MOI-VE-TRE--></body>');
      res.writeHead(200, { 'content-type': loai[path.extname(f)] || 'application/octet-stream', ...(opts.vary ? { vary: opts.vary } : {}) });
      res.end(body);
    };
    if (cong.cham && f.endsWith('index.html')) setTimeout(gui, 6000); else gui();
  });
  await new Promise<void>((r) => sv.listen(port, '127.0.0.1', () => r()));
  const tat = () => new Promise<void>((r) => { sv.close(() => r()); sv.closeAllConnections(); });
  return { goc: `http://127.0.0.1:${port}${APP_BASE}`, cong, tat };
};

test('mất mạng: tải lại trang vẫn dựng được app từ bản lưu của service worker', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', SETOFFLINE_HONG_TREN_WEBKIT);
  const swErrors: string[] = [];
  page.on('console', (m) => { if (/\[SW\]/.test(m.text())) swErrors.push(m.text()); });
  await page.goto(BASE);
  await choTaiSanXong(page);

  await context.setOffline(true);
  await page.reload();
  // Chưa có phiên → màn đăng nhập thật (React đã dựng xong), không kẹt màn chờ.
  await expect(manDangNhap(page)).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-man-cho-khoi-dong]')).toHaveCount(0);

  // đường dẫn SPA khác cũng mở được (dùng chung app shell)
  await page.goto(`${BASE}?tab=tools-line-bot`);
  await expect(manDangNhap(page)).toBeVisible({ timeout: 30_000 });
  expect(swErrors).toEqual([]);
});

test('có mạng lại: trang mới vẫn lấy từ mạng (không kẹt bản lưu)', async ({ page, context }) => {
  await page.goto(BASE);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await context.setOffline(false);
  const res = await page.reload();
  expect(res?.ok()).toBeTruthy();
  await expect(manDangNhap(page)).toBeVisible({ timeout: 30_000 });
});

test('mất mạng khi ĐÃ CÓ phiên đăng nhập trên máy: vào thẳng app với dữ liệu đã lưu, không về màn đăng nhập', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', SETOFFLINE_HONG_TREN_WEBKIT);
  test.skip(!hasCustomToken(), 'Máy không có khoá tài khoản test (FIREBASE_TEST_UID + FIREBASE_TEST_SA_B64)');
  test.setTimeout(180_000);
  // CHỈ ĐỌC: chặn mọi lượt ghi Firestore + Cloud Function (trừ resolveSession — bắt buộc để vào app).
  const biChan = await chanGhiCloud(page);
  const phien = await dangNhapRest();
  if (!phien) throw new Error('Không đăng nhập được tài khoản test qua REST');
  await page.goto(BASE);
  // Bản build không import được module của app (khác dev server) → đặt phiên vào đúng chỗ Firebase Auth tự lưu (IndexedDB
  // firebaseLocalStorageDb, khoá firebase:authUser:<apiKey>:[DEFAULT]) như máy đã đăng nhập Google từ trước, rồi tải lại.
  await page.evaluate(async ({ apiKey, uid, idToken, refreshToken, expiresIn }) => {
    const value = { uid, emailVerified: false, isAnonymous: false, providerData: [], apiKey, appName: '[DEFAULT]',
      stsTokenManager: { refreshToken, accessToken: idToken, expirationTime: Date.now() + Number(expiresIn) * 1000 },
      createdAt: String(Date.now()), lastLoginAt: String(Date.now()) };
    await new Promise<void>((xong, loi) => {
      const mo = indexedDB.open('firebaseLocalStorageDb', 1);
      mo.onupgradeneeded = () => mo.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
      mo.onerror = () => loi(mo.error);
      mo.onsuccess = () => {
        const tx = mo.result.transaction('firebaseLocalStorage', 'readwrite');
        tx.objectStore('firebaseLocalStorage').put({ fbase_key: `firebase:authUser:${apiKey}:[DEFAULT]`, value });
        tx.oncomplete = () => { mo.result.close(); xong(); };
        tx.onerror = () => loi(tx.error);
      };
    });
  }, phien);
  await page.reload();
  await expect(khungApp(page)).toBeAttached({ timeout: 60_000 });
  await choTaiSanXong(page);

  await context.setOffline(true);
  await page.reload();
  await expect(khungApp(page)).toBeAttached({ timeout: 30_000 });
  await expect(manDangNhap(page)).toHaveCount(0);
  await expect(page.locator('[data-man-cho-khoi-dong]')).toHaveCount(0);
  // Không lượt ghi nào bị chặn (kênh Write của Firestore tự mở sẵn để chờ — mục trơn 'Firestore/Write' không mang document nào).
  expect(biChan.filter((x) => x !== 'Firestore/Write')).toEqual([]);
});

test('máy chủ không tới được (đo cả trên WebKit — engine Safari iPhone): vẫn dựng app từ bản lưu, kể cả khi máy chủ gửi Vary: Origin', async ({ page }) => {
  test.setTimeout(150_000);
  // Vary: Origin — đúng điều kiện làm cache.match trượt trước bản sửa 16/11 (scripts/sw-template.js `KHOP`). Chỉ Chromium dính
  // (gửi `origin` cho yêu cầu crossorigin cùng origin); WebKit không gửi nên qua cả trước bản sửa — bài vẫn đo đường offline của nó.
  const mc = await mayChuDist(4181, { vary: 'Origin' });
  let daTat = false;
  try {
    await page.goto(mc.goc);
    await choTaiSanXong(page);
    await mc.tat(); daTat = true;
    await page.reload();
    await expect(manDangNhap(page)).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-man-cho-khoi-dong]')).toHaveCount(0);
    await page.goto(`${mc.goc}?tab=tools-line-bot`);
    await expect(manDangNhap(page)).toBeVisible({ timeout: 30_000 });
  } finally {
    if (!daTat) await mc.tat();
  }
});

test('mạng chậm quá 4 giây: dùng bản lưu nhưng bản mới về trễ VẪN được lưu (không kẹt bản cũ → vòng tải lại 2026-10-21)', async ({ page }) => {
  test.setTimeout(90_000);
  const mc = await mayChuDist(4180);
  try {
    const goc = mc.goc;
    await page.goto(goc);
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 }).toBe(true);
    mc.cong.cham = true; mc.cong.banMoi = true;
    const t0 = Date.now();
    await page.reload();
    const ms = Date.now() - t0;
    console.log('RELOAD_MS', ms);
    expect(ms).toBeLessThan(5_900); // trả bản lưu sau ~4 giây, không chờ mạng 6 giây
    await expect.poll(() => page.evaluate(async (base) => {
      const k = (await caches.keys()).find((x) => x.startsWith('ycx-shell-'));
      const res = k ? await (await caches.open(k)).match(base) : undefined;
      return res ? (await res.text()).includes('BAN-MOI-VE-TRE') : false;
    }, APP_BASE), { timeout: 15_000 }).toBe(true);
  } finally {
    await mc.tat();
  }
});
