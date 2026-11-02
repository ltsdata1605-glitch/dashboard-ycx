import { test, expect } from '@playwright/test';

/**
 * Màn khởi động động (2026-10-22): index.html #ycx-splash + public/man-cho-khoi-dong.js.
 * - Khung đầu TRÙNG KHÍT ảnh khởi động tĩnh của iOS (public/splash/*.png) → iPhone chuyển ảnh → trang không giật.
 * - Logo "thở" + vệt sáng, chữ có ánh xanh chạy qua, thanh chờ mảnh hiện sau 0,6 s.
 * - App vẽ xong nội dung thật (màn đăng nhập) → mờ dần rồi gỡ khỏi trang; không che nút bấm.
 */
test.use({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, browserName: 'chromium' });

test('khung đầu trùng ảnh khởi động iOS; hiệu ứng chạy; chụp từng khung', async ({ page }) => {
    await page.route(/\/index\.tsx/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'export {};' })); // app không chạy → màn chờ đứng yên để soi (tự tắt sau 12 s)
    // Đóng băng mọi hiệu ứng ở thời điểm 0 bằng DevTools (chèn CSS từ addInitScript không kịp — document chưa có lúc đó).
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Animation.enable');
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 0 });
    await page.goto('/');
    await expect(page.locator('#ycx-splash')).toBeVisible();
    await page.waitForTimeout(300);
    const anh = await page.screenshot({ path: 'test-results/khoi-dong-khung-dau.png' });
    // So từng điểm ảnh với ảnh khởi động iOS bằng canvas ngay trong trình duyệt (không cần thư viện ảnh).
    const tiLe = await page.evaluate(async (chupB64) => {
        const nap = (src: string) => new Promise<HTMLImageElement>((ok, loi) => { const i = new Image(); i.onload = () => ok(i); i.onerror = loi; i.src = src; });
        const [a, b] = await Promise.all([nap('/splash/iphone-1179x2556.png'), nap('data:image/png;base64,' + chupB64)]);
        if (a.width !== b.width || a.height !== b.height) return 1;
        const doc = (img: HTMLImageElement) => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d')!; x.drawImage(img, 0, 0); return x.getImageData(0, 0, c.width, c.height).data; };
        const da = doc(a), db = doc(b);
        let lech = 0;
        for (let i = 0; i < da.length; i += 4) {
            if (Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])) > 48) lech++;
        }
        return lech / (a.width * a.height);
    }, anh.toString('base64'));
    console.log('LECH_SO_VOI_PNG', (tiLe * 100).toFixed(3) + '%');
    expect(tiLe).toBeLessThan(0.003);

    // Cho hiệu ứng chạy, chụp từng khung để xem
    await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
    for (const ms of [0, 700, 1100, 1500, 2100]) {
        if (ms) await page.waitForTimeout(ms === 700 ? 700 : 400);
        await page.locator('#ycx-splash .nhom').screenshot({ path: `test-results/khoi-dong-${ms}.png`, scale: 'css' });
    }
});

test('app vẽ xong màn đăng nhập → màn chờ mờ dần và được gỡ, nút bấm được ngay', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('login-google')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#ycx-splash')).toHaveCount(0, { timeout: 2_000 });
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).click({ timeout: 3_000 });
});

test('app Màn hình chính (thanh trạng thái "default"): đẩy cụm logo lên nửa chiều cao thanh trạng thái cho khớp ảnh tĩnh', async ({ page }) => {
    await page.route(/\/index\.tsx/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'export {};' }));
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'standalone', { get: () => true });
        Object.defineProperty(screen, 'height', { get: () => 852 + 54 }); // iPhone 15: thanh trạng thái 54pt nằm ngoài khung trang
    });
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('ycx-splash')!).getPropertyValue('--ycx-lech').trim())).toBe('-27px');
});

test('MỞ app: màn khởi động giữ tối thiểu ~1,3 s cho hiệu ứng chạy trọn; TẢI LẠI thì vào ngay', async ({ page }) => {
    // Bài kiểm mặc định bỏ thời gian tối thiểu (navigator.webdriver) — bật lại riêng ở đây như người dùng thật.
    await page.addInitScript(() => localStorage.setItem('ycxSplashToiThieu', '1'));
    const doThoiGian = async (taiLai = false) => {
        if (taiLai) await page.reload(); else await page.goto('/');
        await page.getByTestId('login-google').waitFor({ timeout: 30_000 });
        await page.locator('#ycx-splash').waitFor({ state: 'detached', timeout: 5_000 });
        return page.evaluate(() => performance.now());
    };
    const lanDau = await doThoiGian();
    console.log('LAN_DAU_GO_SAU', Math.round(lanDau), 'ms');
    expect(lanDau).toBeGreaterThanOrEqual(1300);
    // Ngay giữa chừng (lần đầu) hiệu ứng phải đang chạy chứ không đứng yên
    await page.goto('/');
    await page.waitForTimeout(600);
    const dangChay = await page.evaluate(() => {
        const ten = document.querySelector('#ycx-splash .ten');
        return ten ? getComputedStyle(ten).backgroundPositionX : 'da-go';
    });
    console.log('VI_TRI_ANH_CHU_0_6S', dangChay);
    expect(dangChay).not.toBe('100%'); // ánh xanh đã chạy khỏi vị trí đầu
    const taiLai = await doThoiGian(true);
    console.log('TAI_LAI_GO_SAU', Math.round(taiLai), 'ms');
    expect(taiLai).toBeLessThan(lanDau);
});
