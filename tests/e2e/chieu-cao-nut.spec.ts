import { expect, test, type Page } from '@playwright/test';

/**
 * Chiều cao nút THẬT so với token (2026-10-28, việc 3 audit V6). Trước đó `--btn-height-md/lg` ghi 40/48px nhưng không ai đọc — nút
 * thật 36/44px. Nay Button.tsx đọc token. Bài này đo trên app thật (Chế độ Dùng Thử, Chromium):
 *  - token :root = 32 / 36 / 44 / 32 (sm / md / lg / icon);
 *  - mọi <Button> chuẩn (data-ui="shared") đang hiện mà KHÔNG đè chiều cao bằng className → cao ĐÚNG token của cỡ đó (laptop, chuột);
 *  - điện thoại/cảm ứng: nút sm/md cao ≥ 44 (vùng chạm Apple HIG).
 * In phân bố chiều cao (kể cả nút có đè) để báo cáo audit/button-height-report.md.
 */
const TABS = ['analysis', 'employees', 'check-thuong', 'tools-tax', 'tools-line-bot', 'tools-coupon', 'help'];
const CO: Record<string, string> = { 'h-[var(--btn-height-xs)]': 'xs', 'h-[var(--btn-height-icon-xs)]': 'icon-xs', 'h-[var(--btn-height-sm)]': 'sm', 'h-[var(--btn-height-md)]': 'md', 'h-[var(--btn-height-lg)]': 'lg', 'h-[var(--btn-height-icon)]': 'icon' };

async function vaoDungThu(page: Page, tab: string) {
    await page.goto(`/?tab=${tab}`);
    const nut = page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first();
    const app = page.locator('[data-app-chrome]:visible').first();
    // Lần đầu hiện màn đăng nhập; các lần sau (phiên Dùng Thử còn) vào thẳng app — chờ cái nào tới trước.
    await expect(nut.or(app)).toBeVisible({ timeout: 30_000 });
    if (await nut.isVisible()) await nut.click();
    await expect(app).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1500);
}

async function doNut(page: Page) {
    return page.evaluate((CO) => {
        const out: { co: string; h: number; text: string }[] = [];
        for (const b of Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-ui="shared"]'))) {
            const r = b.getBoundingClientRect();
            if (!r.width || !r.height || getComputedStyle(b).visibility === 'hidden') continue;
            const cls = b.className.split(/\s+/);
            // Nút "⋯" của ActionMenu: chủ ý `lg:min-h-9` = 36 trên laptop (chuẩn nút thao tác header thẻ/bảng 36px laptop).
            const co = cls.includes('lg:min-h-9') ? 'menu-trigger' : Object.keys(CO).find(k => cls.includes(k));
            // offsetHeight = cỡ bố cục, KHÔNG tính transform: nút trong menu nổi đang ẩn (`scale-95`) đo bằng getBoundingClientRect
            // ra 30,4 thay vì 32 (2026-10-29, nút "Phân quyền" ở menu thanh bên).
            out.push({ co: co === 'menu-trigger' ? 'menu' : co ? CO[co] : 'de', h: b.offsetHeight, text: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 30) });
        }
        return out;
    }, CO);
}

test.describe('laptop 1366 (chuột)', () => {
    test.use({ viewport: { width: 1366, height: 900 } });
    test('token = nút thật', async ({ page }) => {
        await vaoDungThu(page, 'analysis');
        const tok = await page.evaluate(() => ['xs', 'icon-xs', 'sm', 'md', 'lg', 'icon'].map(k => getComputedStyle(document.documentElement).getPropertyValue(`--btn-height-${k}`).trim()));
        expect(tok).toEqual(['24px', '24px', '32px', '36px', '44px', '36px']); // icon laptop 36 (chủ dự án chốt 2026-10-28); xs/icon-xs 24 (2026-10-29)
        const MONG: Record<string, number> = { xs: 24, 'icon-xs': 24, sm: 32, md: 36, lg: 44, icon: 36, menu: 36 };
        const tatCa: { tab: string; co: string; h: number; text: string }[] = [];
        for (const tab of TABS) {
            await vaoDungThu(page, tab);
            for (const n of await doNut(page)) tatCa.push({ tab, ...n });
        }
        const sai = tatCa.filter(n => n.co !== 'de' && Math.abs(n.h - MONG[n.co]) > 0.5);
        const phanBo: Record<string, Record<string, number>> = {};
        for (const n of tatCa) { (phanBo[n.co] ||= {})[String(n.h)] = ((phanBo[n.co] ||= {})[String(n.h)] || 0) + 1; }
        console.log('PHAN_BO_LAPTOP', JSON.stringify({ tong: tatCa.length, phanBo }));
        expect(sai, JSON.stringify(sai.slice(0, 10))).toEqual([]);
        expect(tatCa.filter(n => n.co !== 'de').length).toBeGreaterThan(5);

        // Ví dụ chủ dự án nêu (2026-10-28): Bot LINE › Kho mã — nút "Làm mới" (tự vẽ) phải cao bằng nút "⋯" (36 trên laptop).
        await vaoDungThu(page, 'tools-line-bot');
        const menu = page.getByTestId('coupon-thao-tac-khac');
        if (await menu.count()) {
            const hang = menu.locator('xpath=..');
            const lamMoi = hang.getByRole('button', { name: 'Làm mới' });
            const [a, b] = await Promise.all([lamMoi.boundingBox(), menu.boundingBox()]);
            expect(Math.round(a!.height)).toBe(36);
            expect(Math.round(b!.height)).toBe(36);
            await page.screenshot({ path: test.info().outputPath('bot-line-kho-ma.png') });
        }
    });
});

test.describe('iPhone 390 (cảm ứng)', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test('nút sm/md cao ≥ 44 (vùng chạm)', async ({ page }) => {
        const tatCa: { tab: string; co: string; h: number; text: string }[] = [];
        for (const tab of TABS) {
            await vaoDungThu(page, tab);
            for (const n of await doNut(page)) tatCa.push({ tab, ...n });
        }
        const thap = tatCa.filter(n => (n.co === 'sm' || n.co === 'md' || n.co === 'lg') && n.h < 43.5);
        const phanBo: Record<string, Record<string, number>> = {};
        for (const n of tatCa) { (phanBo[n.co] ||= {})[String(n.h)] = ((phanBo[n.co] ||= {})[String(n.h)] || 0) + 1; }
        console.log('PHAN_BO_IPHONE', JSON.stringify({ tong: tatCa.length, phanBo }));
        expect(thap, JSON.stringify(thap.slice(0, 10))).toEqual([]);
    });
});
