import { test, expect, type Page } from '@playwright/test';
import { appPath } from './helpers/appBase';

/**
 * 2026-11-15 (chủ dự án): nhận xét theo cột % D.KIẾN là MỘT NÚT "Copy nhận xét" (bản đầu là dòng chữ trên thanh lọc — trên màn của chủ
 * dự án bị ép 3 dòng, đẩy "Dạng bảng" xuống hàng). Bấm → chép đoạn đánh giá: môn 80–99% sắp đạt 100% cần tập trung (còn thiếu bao
 * nhiêu), nhóm hiệu quả kém — theo NHÓM ĐANG LỌC ("không nhận xét all khi chỉ chọn 1 tiêu chí"). Logic chữ ở
 * features/check-thuong/services/nhanXetDuKien.ts (test đơn vị cạnh file).
 */
async function moHarness(page: Page) {
    await page.goto('/');
    await page.evaluate(async (duongDan) => (await import(duongDan)).mount(), appPath('/tests/e2e/helpers/checkThuongPhanTichHarness.tsx'));
}

test('laptop: "Copy nhận xét" chép đúng NHÓM ĐANG LỌC (Tất cả / < 100% / Đạt thưởng)', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.setViewportSize({ width: 1440, height: 900 });
    await moHarness(page);
    const nut = page.getByTestId('check-thuong-copy-nhan-xet');
    await expect(nut).toBeVisible({ timeout: 15000 });
    await expect(nut).toHaveText('Copy nhận xét');
    const docClipboard = () => page.evaluate(() => navigator.clipboard.readText());

    // 1. "Tất cả" — toàn bộ 7 môn của siêu thị
    await nut.click();
    await expect(page.getByText('Đã copy nhận xét nhóm Tất cả')).toBeVisible();
    const tatCa = await docClipboard();
    console.log('---TẤT CẢ---\n' + tatCa);
    expect(tatCa.split('\n').slice(0, 2)).toEqual(['NHẬN XÉT % DỰ KIẾN — ĐML Hùng Vương (cập nhật 08:58 14/11/2026)', 'Nhóm: Tất cả (7 môn)']);
    // Harness: TAI NGHE 99.3, BẢO HIỂM 98.5, CÁP SẠC 89.5 (80–99) · VIVO 79.7, CAMERA 70 (70–79) · ĐÈN 60 (< 70) · QUẠT 156 (đạt)
    expect(tatCa).toContain('SẮP ĐẠT 100% (80–99%) — 3 môn, cần tập trung:\n1. TAI NGHE: 99.3% (còn 0.7%, không quỹ)'); // không siêu thị nào có thưởng môn này → không quỹ
    expect(tatCa).toContain('HIỆU QUẢ KÉM (dưới 70%) — 1 môn:\n1. ĐÈN NĂNG LƯỢNG MẶT TRỜI: 60% (còn 40%)');

    // 2. Chọn "< 100%" — chỉ 6 môn chưa đạt, KHÔNG có QUẠT GIÓ
    await page.getByRole('button', { name: '< 100% 6', exact: true }).click();
    await nut.click();
    await expect(page.getByText('Đã copy nhận xét nhóm Chưa Đạt < 100%')).toBeVisible();
    const duoi100 = await docClipboard();
    console.log('---< 100%---\n' + duoi100);
    expect(duoi100).toContain('Nhóm: Chưa Đạt < 100% (6 môn)');
    expect(duoi100).toContain('Đạt ≥ 100%: 0/6 môn');
    expect(duoi100).not.toContain('QUẠT GIÓ');
    expect(duoi100).toContain('SẮP ĐẠT 100% (80–99%) — 3 môn, cần tập trung:');

    // 3. Chọn "Đạt thưởng" — chỉ QUẠT GIÓ, không có mục chưa đạt
    await page.getByRole('button', { name: 'Đạt thưởng 1', exact: true }).click();
    await nut.click();
    await expect(page.getByText('Đã copy nhận xét nhóm Đạt thưởng')).toBeVisible();
    const datThuong = await docClipboard();
    console.log('---ĐẠT THƯỞNG---\n' + datThuong);
    expect(datThuong).toContain('Nhóm: Đạt thưởng (1 môn)');
    expect(datThuong).toContain('ĐÃ ĐẠT ≥ 100% — 1 môn:\n1. QUẠT GIÓ: 156%');
    expect(datThuong).toContain('Cả nhóm đã đạt ≥ 100%.');
    expect(datThuong).not.toMatch(/SẮP ĐẠT|HIỆU QUẢ KÉM|TAI NGHE/);
});

for (const rong of [1440, 1280, 1024]) {
    test(`laptop ${rong}px: nút nằm ngay trước "Dạng bảng", cùng hàng, không tràn ngang`, async ({ page }) => {
        await page.setViewportSize({ width: rong, height: 900 });
        await moHarness(page);
        const nut = page.getByTestId('check-thuong-copy-nhan-xet');
        await expect(nut).toBeVisible({ timeout: 15000 });
        const a = (await nut.boundingBox())!;
        const b = (await page.getByRole('button', { name: /Dạng bảng/ }).boundingBox())!;
        expect(Math.abs(a.y - b.y)).toBeLessThan(2); // cùng hàng
        expect(a.x + a.width).toBeLessThanOrEqual(b.x); // ngay bên trái
        expect(a.height).toBeLessThan(40); // 1 dòng chữ, không bị ép xuống dòng
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        if (rong === 1280) {
            await nut.scrollIntoViewIfNeeded();
            await page.screenshot({ path: 'test-results/check-thuong-copy-nhan-xet-laptop.png' });
        }
    });
}

test.describe('iPhone', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test('nút đọc được, chạm được, không tràn ngang', async ({ page }) => {
        await moHarness(page);
        const nut = page.getByTestId('check-thuong-copy-nhan-xet');
        await expect(nut).toBeVisible({ timeout: 15000 });
        await nut.scrollIntoViewIfNeeded();
        const hop = (await nut.boundingBox())!;
        expect(hop.x + hop.width).toBeLessThanOrEqual(390);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.screenshot({ path: 'test-results/check-thuong-copy-nhan-xet-iphone.png' });
    });
});
