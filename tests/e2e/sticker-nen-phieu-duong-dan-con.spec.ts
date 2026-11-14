import { test, expect, type Page } from '@playwright/test';
import { APP_BASE } from './helpers/appBase';

/**
 * 2026-11-14: app chạy dưới đường dẫn con `/dashboard-ycx/` (vite `base`). Nền phiếu In Sticker từng gọi '/frame/…' thẳng trong
 * url(...) → github.io/frame/bg_phieu.png 404, xem trước và bản in mất nền. Mã nền '/frame/…' giữ nguyên (lịch sử in so khớp theo
 * nó), chỗ vẽ đi qua `bgImageUrl()`. Bài này mở đúng đường dẫn con, kiểm ảnh nền ở xem trước VÀ trong trang in đều trả 200.
 */
const BASE = APP_BASE; // constants/appBase.ts — nguồn duy nhất
const ANH = process.env.ANH_NEN_PHIEU; // đặt thư mục để lưu ảnh xem trước (kiểm bằng mắt), không đặt thì bỏ qua

const CAC_LOAI: Array<{ sub: string; nen: string }> = [
    { sub: 'draw', nen: 'bg_phieu.png' },
    { sub: 'gia-soc', nen: 'X24_NEW.png' },
    { sub: 'gio-vang', nen: 'GVO2-scaled.png' },
];

/** url("…") của background-image → đường dẫn (bỏ origin) */
const duongDanNen = (bg: string) => {
    const m = /url\(["']?([^"')]+)["']?\)/.exec(bg);
    return m ? new URL(m[1]).pathname : '';
};

async function moInSticker(page: Page, sub: string) {
    await page.goto(`${BASE}?tab=tools-print-sticker&sub=${sub}`);
    const thu = page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i });
    const phieu = page.locator('#print-section .sticker-container').first();
    await expect(thu.or(phieu).first()).toBeVisible({ timeout: 60_000 }); // màn đăng nhập hiện sau khi app khởi động xong
    if (await thu.isVisible()) await thu.click();
    await expect(phieu).toBeVisible({ timeout: 30_000 });
}

/** Ảnh tải được thật (decode xong, có kích thước) */
async function anhTaiDuoc(page: Page, duongDan: string) {
    return page.evaluate(async (src) => {
        const img = new Image();
        img.src = src;
        try { await img.decode(); } catch { return 0; }
        return img.naturalWidth;
    }, duongDan);
}

test.describe('nền phiếu In Sticker dưới đường dẫn con /dashboard-ycx/', () => {
    test.use({ viewport: { width: 1366, height: 900 } });

    for (const { sub, nen } of CAC_LOAI) {
        test(`${sub}: xem trước và bản in có nền (${nen})`, async ({ page }) => {
            const loiNen: string[] = [];
            page.on('response', (r) => { if (r.url().includes('/frame/') && r.status() >= 400) loiNen.push(`${r.status()} ${r.url()}`); });
            page.on('requestfailed', (r) => { if (r.url().includes('/frame/')) loiNen.push(`FAILED ${r.url()}`); });

            await moInSticker(page, sub);

            // 1. Xem trước
            const bgXemTruoc = await page.locator('#print-section .sticker-container').first()
                .evaluate((el) => getComputedStyle(el).backgroundImage);
            expect(duongDanNen(bgXemTruoc)).toBe(`${BASE}frame/${nen}`);
            expect(await anhTaiDuoc(page, `${BASE}frame/${nen}`)).toBeGreaterThan(0);
            const r = await page.request.get(`${BASE}frame/${nen}`);
            expect(r.status()).toBe(200);
            if (ANH) await page.locator('#print-section').screenshot({ path: `${ANH}/xem-truoc-${sub}.png` });

            // 2. Bản in: chụp nền của trang in đúng lúc window.print() (printHost bị gỡ ngay sau đó)
            await page.evaluate(() => {
                (window as unknown as { __nenIn?: string[] }).__nenIn = undefined;
                window.print = () => {
                    (window as unknown as { __nenIn?: string[] }).__nenIn = [...document.querySelectorAll('#print-host .sticker-container')]
                        .map((el) => getComputedStyle(el).backgroundImage);
                };
            });
            await page.getByRole('button', { name: /Bấm để in/i }).click();
            await page.waitForFunction(() => Array.isArray((window as unknown as { __nenIn?: string[] }).__nenIn), null, { timeout: 30_000 });
            const nenIn = await page.evaluate(() => (window as unknown as { __nenIn: string[] }).__nenIn);
            expect(nenIn.length).toBeGreaterThan(0);
            const cacNen = [...new Set(nenIn.map(duongDanNen))];
            expect(cacNen).toEqual([`${BASE}frame/${nen}`]);

            expect(loiNen, 'ảnh nền /frame/ không được lỗi').toEqual([]);
        });
    }

    test('draw: đổi nền ĐMX → TGĐ vẫn có nền', async ({ page }) => {
        await moInSticker(page, 'draw');
        await page.getByRole('tab', { name: 'TGĐ' }).or(page.getByRole('button', { name: 'TGĐ', exact: true })).first().click();
        await expect.poll(async () => duongDanNen(await page.locator('#print-section .sticker-container').first()
            .evaluate((el) => getComputedStyle(el).backgroundImage))).toBe(`${BASE}frame/bg_phieutgd.png`);
        expect(await anhTaiDuoc(page, `${BASE}frame/bg_phieutgd.png`)).toBeGreaterThan(0);
        if (ANH) await page.locator('#print-section').screenshot({ path: `${ANH}/xem-truoc-draw-tgd.png` });
    });
});
