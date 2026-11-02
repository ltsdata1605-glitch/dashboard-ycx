import { expect, test, type Page, type Route } from '@playwright/test';
import { fileNhanVien } from './helpers/phanCaFixture';

/**
 * Phân Ca — 2 hành trình trước chỉ có unit test (user-journey-matrix, 2026-10-30): xuất Google Sheet và gợi ý ca xoay bằng AI.
 * Chế độ Dùng Thử, KHÔNG gọi dịch vụ thật:
 *  - Đăng nhập Google (popup lấy quyền Sheets) được thay bằng module giả qua route của dev server — chỉ trong bài test.
 *  - sheets.googleapis.com / googleapis.com/drive và hàm generateWithGemini trả lời giả; bài test soi NỘI DUNG app gửi đi.
 */
async function vaoPhanCaCoNhanVien(page: Page, loi: string[]) {
    page.on('pageerror', e => loi.push(e.message));
    await page.goto('/?tab=tools-phanca');
    await page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first().click({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Tạo lịch' })).toBeVisible({ timeout: 30_000 });
    await page.locator('input[type="file"]').first().setInputFiles(fileNhanVien());
    const modal = page.getByRole('dialog', { name: /Cấu Hình Nhập Nhân Viên/i });
    await modal.getByPlaceholder(/VD: 1234/).fill('9999 - ST Thử');
    await modal.getByRole('button', { name: 'Lưu & Tiếp Tục' }).click();
    await expect(modal).toBeHidden();
    await page.getByRole('button', { name: 'Tạo lịch' }).click();
    await expect(page.getByText(/LỊCH PHÂN CA - 9999 - ST Thử/i).first()).toBeVisible({ timeout: 20_000 });
}

test.use({ viewport: { width: 1366, height: 900 } });

test('xuất Google Sheet: tạo trang tính, ghi đủ nhân viên + đầu tuần, chia sẻ, báo "Đã tạo Google Sheet"', async ({ page }) => {
    const loi: string[] = [];
    // Module đăng nhập Google của Phân Ca → bản giả (đặt token như sau khi người dùng đồng ý quyền).
    await page.route(/\/features\/phan-ca\/services\/firebase\.ts(\?.*)?$/, r => r.fulfill({
        contentType: 'text/javascript',
        body: `export const auth = {};
export const loginWithGoogleForceConsent = async () => { sessionStorage.setItem('googleOAuthToken', 'tok-e2e'); return {}; };`,
    }));
    const goi: { url: string; method: string; auth: string | null; body: string }[] = [];
    const traLoi = async (route: Route) => {
        const req = route.request();
        goi.push({ url: req.url(), method: req.method(), auth: req.headers()['authorization'] ?? null, body: req.postData() || '' });
        const url = req.url();
        if (req.method() === 'POST' && /\/v4\/spreadsheets$/.test(url)) {
            return route.fulfill({ json: { spreadsheetId: 'SHEET123', spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/SHEET123/edit', sheets: [{ properties: { sheetId: 0 } }] } });
        }
        return route.fulfill({ json: {} });
    };
    await page.route(/sheets\.googleapis\.com/, traLoi);
    await page.route(/googleapis\.com\/drive/, traLoi);

    await vaoPhanCaCoNhanVien(page, loi);
    await page.getByRole('button', { name: 'Sheet', exact: true }).click();
    await expect(page.getByText('Đã tạo Google Sheet')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: 'Mở Sheet' })).toBeVisible();

    expect(goi.every(g => g.auth === 'Bearer tok-e2e')).toBe(true);
    const tao = goi.find(g => /\/v4\/spreadsheets$/.test(g.url))!;
    expect(JSON.parse(tao.body).properties.title).toMatch(/^Lịch Phân Ca - Tháng \d{1,2}\/\d{4}$/);
    const ghi = goi.find(g => /\/values\//.test(g.url))!;
    const values: string[][] = JSON.parse(ghi.body).values;
    expect(values[0].slice(0, 3)).toEqual(['STT', 'HỌ VÀ TÊN', 'GIỜ CÔNG']);
    expect(values[0]).toContain('TUẦN 1');
    const ten = values.slice(2).map(r => String(r[1]));
    // Lịch xếp THEO BỘ PHẬN đang chọn (mặc định BP All In One) — Sheet xuất đúng 8 người của bộ phận đó, theo thứ tự nhập.
    expect(ten).toEqual(Array.from({ length: 8 }, (_, i) => `${100 + i} - Nhân Viên ${i + 1}`));
    expect(goi.some(g => /:batchUpdate/.test(g.url))).toBe(true);
    expect(goi.some(g => /drive\/v3\/files\/SHEET123\/permissions/.test(g.url))).toBe(true);
    expect(loi).toEqual([]);
});

test('gợi ý ca xoay bằng AI: gửi yêu cầu cho đúng bộ phận, hiện gợi ý, Áp dụng vào danh sách ca', async ({ page }) => {
    const loi: string[] = [];
    let prompt = '';
    await page.route(/generateWithGemini/, async r => {
        prompt = JSON.parse(r.request().postData() || '{}')?.data?.prompt || '';
        await r.fulfill({ json: { result: { ca_xoay: ['123', '456', '2345', '23'] } } });
    });
    await vaoPhanCaCoNhanVien(page, loi);
    await page.getByRole('button', { name: 'Ca Xoay' }).click();
    const mau = page.getByRole('dialog', { name: /Quản Lý Mẫu Ca Xoay/i });
    await expect(mau).toBeVisible();
    await mau.getByRole('button', { name: 'Gợi ý AI' }).click();
    const ai = page.getByRole('dialog', { name: /Gợi Ý Ca Xoay Bằng AI/i });
    await expect(ai).toBeVisible();
    await ai.getByRole('button', { name: 'Tạo Gợi Ý' }).click();
    await expect(ai.getByRole('button', { name: 'Áp Dụng' })).toBeEnabled({ timeout: 15_000 });
    expect(prompt).toContain('ca_xoay');
    expect(prompt.toUpperCase()).toContain('ALL IN ONE'); // đúng bộ phận đang chọn
    await ai.getByRole('button', { name: 'Áp Dụng' }).click();
    await expect(ai).toBeHidden();
    // Danh sách ca của bộ phận nhận đúng 4 ca AI gợi ý.
    for (const ca of ['123', '456', '2345', '23']) await expect(mau.locator(`input[value="${ca}"]`).first()).toBeAttached();
    expect(loi).toEqual([]);
});
