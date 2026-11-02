import { expect, test, type Page } from '@playwright/test';
import { createSalesXlsx } from './helpers/salesFixture';

/**
 * Liquid Glass (Apple Design System V2, 2026-10-28) — số đo THẬT trên khung app (Chromium; WebKit chạy ở CI job e2e-webkit):
 *  - Thanh tab nổi iPhone = viên kính 3 tab (icon + nhãn) + nút tròn kính "Khác" tách riêng, nằm trong màn ở mọi bề rộng
 *    320→440, nhãn không bị cắt, vùng chạm ≥ 44, mục chọn có viên xám (--glass-selected-bg) + aria-current.
 *  - Kính lấy giá trị từ token (--glass-*), không tự chế: blur 24px + saturate 180%.
 *  - Bật "Giảm độ trong suốt" (prefers-reduced-transparency) / "Tăng tương phản" → kính lùi về nền đặc, không blur.
 *  - Nội dung cuối trang không bị thanh tab nổi che (đáy trang chừa đủ).
 *  - Dock laptop (điều hướng trái + Auto Sync phải) dùng chung .ycx-glass.
 */
async function vaoDungThu(page: Page, tab = 'analysis') {
    await page.goto(`/?tab=${tab}`);
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click({ timeout: 30_000 });
}

for (const w of [320, 375, 393, 440]) {
    test.describe(`iPhone ${w}px`, () => {
        test.use({ viewport: { width: w, height: 760 }, isMobile: true, hasTouch: true });
        test('thanh tab kính: vừa màn, nhãn đủ chữ, vùng chạm ≥ 44, mục chọn có viên xám', async ({ page }) => {
            await vaoDungThu(page);
            const nav = page.locator('nav[data-app-chrome="tabbar"]');
            await expect(nav).toBeVisible();
            const r = (await nav.boundingBox())!;
            expect(r.x).toBeGreaterThanOrEqual(0);
            expect(r.x + r.width).toBeLessThanOrEqual(w);
            expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);

            const capsule = nav.locator('[data-glass="capsule"]');
            const circle = nav.locator('[data-glass="circle"]');
            const cs = await capsule.evaluate(el => { const s = getComputedStyle(el); return { bf: s.backdropFilter || s.getPropertyValue('-webkit-backdrop-filter'), bg: s.backgroundColor, br: s.borderRadius }; });
            expect(cs.bf).toContain('blur(24px)');
            expect(cs.bf).toContain('saturate(1.8)');
            expect(cs.bg).toBe('rgba(255, 255, 255, 0.72)');
            const c = (await circle.boundingBox())!;
            expect(Math.round(c.width)).toBe(Math.round(c.height));

            for (const b of await nav.getByRole('button').all()) {
                const box = (await b.boundingBox())!;
                expect(box.height, await b.getAttribute('aria-label') ?? '').toBeGreaterThanOrEqual(44);
                expect(box.width, await b.getAttribute('aria-label') ?? '').toBeGreaterThanOrEqual(44);
            }
            // Nhãn không bị cắt (scrollWidth ≤ clientWidth) — "Check thưởng" là nhãn dài nhất.
            const catChu = await capsule.locator('button span[aria-hidden]').evaluateAll(els => els.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
            expect(catChu).toEqual([]);

            const chon = nav.getByRole('button', { name: 'Phân tích' });
            await expect(chon).toHaveAttribute('aria-current', 'page');
            expect(await chon.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(120, 120, 128, 0.16)');
            expect(await nav.getByRole('button', { name: 'Report BI' }).evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
            await page.screenshot({ path: test.info().outputPath(`tabbar-${w}.png`), clip: { x: 0, y: 760 - 110, width: w, height: 110 } });
        });
    });
}

test.describe('iPhone 390 — đường lùi & chừa đáy', () => {
    test.use({ viewport: { width: 390, height: 760 }, isMobile: true, hasTouch: true });

    test('Giảm độ trong suốt / Tăng tương phản → nền đặc, không blur', async ({ page }) => {
        await vaoDungThu(page);
        const capsule = page.locator('nav[data-app-chrome="tabbar"] [data-glass="capsule"]');
        await expect(capsule).toBeVisible();
        // Chromium chưa có media `prefers-reduced-transparency` để giả lập → kiểm luật CSS đã được trình duyệt nạp đúng: đổi token
        // ở :root như khối @media sẽ làm → bề mặt kính lùi theo (chứng minh mọi nơi đọc token, không viết cứng).
        await page.evaluate(() => { const r = document.documentElement.style; r.setProperty('--glass-bg', 'var(--glass-fallback-bg)'); r.setProperty('--glass-filter', 'none'); });
        const s = await capsule.evaluate(el => { const c = getComputedStyle(el); return { bf: c.backdropFilter, bg: c.backgroundColor }; });
        expect(s.bf).toBe('none');
        expect(s.bg).toBe('rgba(255, 255, 255, 0.97)');
        // Có đúng khối @media trong CSS đã nạp (không chỉ trong file nguồn).
        const coMedia = await page.evaluate(() => {
            const out: string[] = [];
            const duyet = (rules: CSSRuleList) => { for (const r of Array.from(rules)) { if (r instanceof CSSMediaRule) { if (/prefers-(reduced-transparency|contrast)/.test(r.conditionText) && /--glass-/.test(r.cssText)) out.push(r.conditionText); } if ('cssRules' in r && (r as CSSGroupingRule).cssRules) duyet((r as CSSGroupingRule).cssRules); } };
            for (const sh of Array.from(document.styleSheets)) { try { duyet(sh.cssRules); } catch { /* chéo nguồn */ } }
            return out;
        });
        expect(coMedia.join('|')).toContain('prefers-reduced-transparency');
        expect(coMedia.join('|')).toContain('prefers-contrast');
        await page.emulateMedia({ contrast: 'more' } as Parameters<Page['emulateMedia']>[0]);
        await page.evaluate(() => { const r = document.documentElement.style; r.removeProperty('--glass-bg'); r.removeProperty('--glass-filter'); });
        expect(await capsule.evaluate(el => getComputedStyle(el).backdropFilter)).toBe('none');
    });

    test('cuối trang Phân tích có dữ liệu: nội dung cuối không bị thanh tab nổi che', async ({ page }) => {
        await vaoDungThu(page);
        await page.locator('input[type="file"]').first().setInputFiles(createSalesXlsx());
        await page.locator('[data-modal-overlay]').getByText('Tệp Realtime (Xem nhanh)').click();
        await expect(page.getByText(/chi tiết theo kho/i).first()).toBeVisible({ timeout: 90_000 });
        // AUD-002: Dùng Thử không có Bot LINE → KHÔNG được tự chụp ảnh "Chi Tiết Theo Kho" sau khi nạp (trước đây có, hẹn 1,5 s).
        await page.waitForTimeout(3500);
        await expect(page.getByText('Đang chụp ảnh…')).toHaveCount(0);
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(400);
        const nav = (await page.locator('nav[data-app-chrome="tabbar"]').boundingBox())!;
        const cuoi = await page.locator('footer').last().boundingBox();
        expect(cuoi, 'có footer').not.toBeNull();
        expect(cuoi!.y + cuoi!.height).toBeLessThanOrEqual(nav.y + 1);
        await page.screenshot({ path: test.info().outputPath('cuoi-trang-390.png') });
    });
});

test.describe('laptop 1366', () => {
    test.use({ viewport: { width: 1366, height: 800 } });
    test('dock điều hướng trái + dock Auto Sync dùng chung kính', async ({ page }) => {
        await vaoDungThu(page);
        const trai = page.getByTestId('desktop-nav-menu');
        await expect(trai).toBeVisible();
        for (const el of [trai, page.getByTestId('ycx-auto-dock')]) {
            if (!(await el.isVisible())) continue;
            const s = await el.evaluate(e => { const c = getComputedStyle(e); return { cls: e.className, bf: c.backdropFilter, bg: c.backgroundColor }; });
            expect(s.cls).toContain('ycx-glass');
            expect(s.bf).toContain('blur(24px)');
            expect(s.bg).toBe('rgba(255, 255, 255, 0.86)');
        }
        await page.screenshot({ path: test.info().outputPath('laptop-dock.png') });
    });
});
