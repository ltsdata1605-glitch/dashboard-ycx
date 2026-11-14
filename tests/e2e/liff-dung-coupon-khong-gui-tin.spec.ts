import { expect, test, type Page } from '@playwright/test';
import { appPath } from './helpers/appBase';

/**
 * Trang LIFF bấm dùng coupon (public/liff-copy.html) — 2026-10-20 chủ dự án chốt "Tắt tin nhắn xác nhận khi dùng coupon":
 * KHÔNG gửi tin nào vào nhóm (bot không push, người dùng cũng không gửi thay), chỉ copy mã + đánh dấu đã dùng trên máy chủ.
 * SDK LIFF và máy chủ giả lập.
 */
const SDK_GIA = `
window.__gui = []; window.__dong = 0;
window.liff = {
  init: async () => {}, isInClient: () => true,
  getDecodedIDToken: () => ({ name: 'DMST-Nhân-107617SALE' }), getProfile: async () => ({ displayName: 'DMST-Nhân-107617SALE' }),
  sendMessages: async (m) => { window.__gui.push(m[0].text); }, closeWindow: () => { window.__dong++; },
};`;

async function mo(page: Page, phanHoi: object | null, treMs = 0, status = 200, responseGate?: Promise<void>) {
    if (page.context().browser()?.browserType().name() === 'chromium') {
        await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    } else {
        // WebKit does not expose these Playwright permissions; only clipboard success is mocked.
        await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', {
            configurable: true, value: { writeText: async () => {} },
        }));
    }
    const goi: string[] = [];
    await page.route('https://static.line-scdn.net/**', r => r.fulfill({ contentType: 'application/javascript', body: SDK_GIA }));
    await page.route('https://linebotwebhook-zrczpxylcq-as.a.run.app/**', async r => {
        goi.push(r.request().url());
        if (phanHoi === null) { await r.abort('internetdisconnected'); return; }
        if (responseGate) await responseGate;
        if (treMs) await new Promise(res => setTimeout(res, treMs));
        await r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(phanHoi) }).catch(() => {});
    });
    await page.goto(appPath('/liff-copy.html?code=ABC123&type=PMH&index=3'));
    return goi;
}
const soTinGui = (page: Page) => page.evaluate(() => (window as unknown as { __gui: string[] }).__gui.length);
const soLanDong = (page: Page) => page.evaluate(() => (window as unknown as { __dong: number }).__dong);

test('dùng coupon: ghi nhận đã dùng trên máy chủ, KHÔNG gửi tin vào nhóm, tự đóng', async ({ page }) => {
    const goi = await mo(page, { success: true, updatedCount: 1, quotedSent: false });
    await expect.poll(() => soLanDong(page), { timeout: 10_000 }).toBeGreaterThan(0);
    expect(goi).toHaveLength(1);
    expect(goi[0]).toContain('action=mark-used');
    expect(goi[0]).toContain('code=ABC123');
    expect(await soTinGui(page)).toBe(0);
});

test('máy chủ chậm > 4 giây: vẫn đóng, KHÔNG gửi tin', async ({ page }) => {
    await mo(page, { success: true, updatedCount: 1, quotedSent: false }, 6000);
    await expect.poll(() => soLanDong(page), { timeout: 12_000 }).toBeGreaterThan(0);
    expect(await soTinGui(page)).toBe(0);
});

test('mã đã có người dùng: báo rõ, KHÔNG gửi tin', async ({ page }) => {
    await mo(page, { success: true, updatedCount: 0, alreadyUsed: true, previousUser: '107000 - An', quotedSent: false });
    await expect(page.getByText('Mã này đã được sử dụng!')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/107000 - An/)).toBeVisible();
    expect(await soTinGui(page)).toBe(0);
});

const sentFlag = (page: Page) => page.evaluate(() => localStorage.getItem('coupon_sent_ABC123'));

for (const scenario of [
    { name: 'API từ chối', response: { success: false, error: 'Không ghi được' }, status: 200 },
    { name: 'vé không hợp lệ', response: { success: false, error: 'Thẻ coupon không hợp lệ.' }, status: 403 },
    { name: 'mất mạng', response: null, status: 200 },
    { name: 'không có coupon khớp', response: { success: true, updatedCount: 0 }, status: 200 },
]) {
    test(`${scenario.name}: không báo đã ghi nhận hoặc lưu cờ thành công; cho thử lại`, async ({ page }) => {
        await mo(page, scenario.response, 0, scenario.status);
        await expect(page.locator('#statusDesc')).toContainText('Chưa xác nhận được');
        expect(await sentFlag(page)).toBeNull();
        expect(await soLanDong(page)).toBe(0);
        expect(await soTinGui(page)).toBe(0);
        await expect(page.getByRole('button', { name: 'Thử ghi nhận lại' })).toBeEnabled();
    });
}

test('thử lại sau lỗi: chỉ lưu cờ sau phản hồi ghi nhận thành công, không gửi tin', async ({ page }) => {
    await mo(page, { success: false, error: 'Tạm lỗi' });
    await expect(page.getByRole('button', { name: 'Thử ghi nhận lại' })).toBeVisible();
    expect(await sentFlag(page)).toBeNull();
    await page.route('https://linebotwebhook-zrczpxylcq-as.a.run.app/**', r => r.fulfill({
        contentType: 'application/json', body: JSON.stringify({ success: true, updatedCount: 1 }),
    }));
    await page.getByRole('button', { name: 'Thử ghi nhận lại' }).click();
    await expect.poll(() => sentFlag(page)).toBe('true');
    await expect.poll(() => soLanDong(page)).toBeGreaterThan(0);
    expect(await soTinGui(page)).toBe(0);
});

test('phản hồi chậm: lúc đóng chưa xác nhận; phản hồi muộn mới lưu cờ', async ({ page }) => {
    let releaseResponse!: () => void;
    const responseGate = new Promise<void>(resolve => { releaseResponse = resolve; });
    await mo(page, { success: true, updatedCount: 1 }, 0, 200, responseGate);
    await expect.poll(() => soLanDong(page)).toBeGreaterThan(0);
    expect(await sentFlag(page)).toBeNull();
    await expect(page.locator('#statusDesc')).toContainText('Chưa xác nhận được');
    releaseResponse();
    await expect.poll(() => sentFlag(page), { timeout: 5000 }).toBe('true');
    expect(await soTinGui(page)).toBe(0);
});

test('mã hoàn kho: không lưu cờ đã dùng và không gửi tin', async ({ page }) => {
    await mo(page, { success: true, updatedCount: 0, revoked: true });
    await expect(page.locator('#statusTitle')).toContainText('Mã đã tự động hoàn kho');
    expect(await sentFlag(page)).toBeNull();
    expect(await soTinGui(page)).toBe(0);
});

test('có tên cache và mạng lỗi: không có rejection bỏ sót, cho thử lại', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('line_user_display_name', 'Audit User'));
    await mo(page, null);
    await expect(page.getByRole('button', { name: 'Thử ghi nhận lại' })).toBeVisible();
    expect(await sentFlag(page)).toBeNull();
    expect(errors).toEqual([]);
    expect(await soTinGui(page)).toBe(0);
    await page.screenshot({ path: `audit/evidence/c19-retry-${page.context().browser()?.browserType().name()}-${page.viewportSize()?.width}.png` });
});
