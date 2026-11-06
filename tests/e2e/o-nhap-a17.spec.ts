import { expect, test } from '@playwright/test';
import { moCheckThuong, napFileThuong, taoFileThuong } from './helpers/checkThuongNative';

/**
 * Audit A17 (2026-09-30).
 * 1) Input dùng chung: lỗi được nối vào ô (aria-invalid + aria-describedby → đúng dòng lỗi).
 * 2) Check thưởng trên điện thoại: Safari không tự phóng to khi chạm ô nhập, ô lọc Top thưởng cao ≥44px (chuẩn chạm).
 *    2026-11-06: bản cũ đo `input.mod-input` ở iframe /check-thuong.html, nên đỏ từ khi trang đó chuyển về app (2026-10-30).
 *    Điều kiện ≥16px chỉ cần cho iframe vì viewport của nó không chặn phóng to; app chặn bằng `maximum-scale=1.0` (index.html).
 *    2 ô Kho 1/Kho 2 giữ cao 32px trong capsule 34px theo quyết định của chủ dự án, đo ở check-thuong-mobile-topbar.spec.ts.
 *    WebKit trên máy tính không có hành vi tự phóng to của iPhone: bài này chỉ khoá thẻ viewport, không chứng minh trên máy thật.
 */
test('Input: lỗi nối vào ô cho trình đọc màn hình', async ({ page }) => {
    await page.goto('/');
    const kq = await page.evaluate(async () => {
        (await import('/tests/e2e/helpers/inputHarness.tsx' as string)).mountInput();
        const el = document.getElementById('input-harness')!;
        await new Promise(r => setTimeout(r, 300));
        const input = el.querySelector('input')!;
        const ids = (input.getAttribute('aria-describedby') || '').split(' ');
        return { invalid: input.getAttribute('aria-invalid'), ids, loi: ids.map(i => document.getElementById(i)?.textContent || null) };
    });
    expect(kq.invalid).toBe('true');
    expect(kq.ids[0]).toBe('goi-y'); // describedby sẵn có được giữ
    expect(kq.loi[1]).toBe('Mã kho phải là số');
});

test.describe('Check thưởng trên iPhone', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    test('viewport chặn tự phóng to, ô lọc Top thưởng cao ≥44px', async ({ page }) => {
        await moCheckThuong(page);
        await napFileThuong(page, taoFileThuong());
        expect(await page.locator('meta[name="viewport"]').getAttribute('content')).toMatch(/maximum-scale=1(\.0)?(,|$)/);

        await page.locator('#mobile-topbar-actions').getByRole('button', { name: /top/i }).click();
        const oLoc = [page.getByLabel('Chọn kênh siêu thị'), page.getByPlaceholder('Tìm theo mã kho hoặc tên siêu thị...')];
        for (const o of oLoc) {
            await expect(o).toBeVisible();
            const cao = (await o.boundingBox())!.height;
            console.log('Ô LỌC:', await o.evaluate(e => e.getAttribute('aria-label') || e.getAttribute('placeholder')), cao);
            expect(cao).toBeGreaterThanOrEqual(44);
        }
    });
});
