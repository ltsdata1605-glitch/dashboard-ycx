import { expect, test } from '@playwright/test';
import { appPath } from './helpers/appBase';

/**
 * Tab loại bảng/cột của 2 hộp thoại cấu hình (7 Ngày, cột nhân viên) — 2026-10-28 chuyển từ 3 nút tự vẽ sang <Tabs variant="underline">.
 * Tabs underline/pills trước không báo mục đang chọn cho trình đọc màn hình — nay aria-pressed. Render thật qua harness modal.
 */
test.use({ viewport: { width: 1366, height: 768 } });
for (const ten of ['HeadToHeadConfigModal', 'ColumnConfigModal']) {
  test(ten, async ({ page }) => {
    const loiJs: string[] = []; page.on('pageerror', e => loiJs.push(e.message));
    await page.goto('/'); await page.waitForTimeout(1500);
    const loi = await page.evaluate(async ({ n, duongDan }) => { const m = await import(duongDan); return m.mountModal(n); }, { n: ten, duongDan: appPath('/tests/e2e/helpers/modalSizeHarness.tsx') });
    expect(loi).toBeFalsy();
    const hop = page.locator('[role="dialog"]').last();
    const tabs = hop.getByRole('button', { name: /Truy vấn Data|Tính Toán|Thiết lập Target/ });
    await expect(tabs).toHaveCount(3);
    await expect(tabs.nth(0)).toHaveAttribute('aria-pressed', 'true');
    // Nhóm chọn "Đơn vị đo lường" (2026-10-28: nút tự vẽ → <Tabs variant="segment">): bấm là chọn, đúng một mục được chọn.
    const nhom = hop.locator('[data-segmented]').first();
    await expect(nhom).toBeVisible();
    await nhom.getByRole('button', { name: /Số lượng/ }).click();
    await expect(nhom.getByRole('button', { name: /Số lượng/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(nhom.locator('[aria-pressed="true"]')).toHaveCount(1);
    // Viên trắng (thumb) phải trượt tới đúng mục đang chọn — đo sau khi hiệu ứng 250ms xong.
    await page.waitForTimeout(450);
    const lech = await nhom.evaluate((el) => {
        const thumb = el.querySelector<HTMLElement>(':scope > span[aria-hidden]')!.getBoundingClientRect();
        const chon = el.querySelector<HTMLElement>('[aria-pressed="true"]')!.getBoundingClientRect();
        return Math.abs(thumb.left - chon.left) + Math.abs(thumb.width - chon.width);
    });
    expect(lech).toBeLessThan(2);
    await page.screenshot({ path: test.info().outputPath(ten + '-segment.png') });
    const truoc = (await hop.innerText()).length;
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(tabs.nth(0)).toHaveAttribute('aria-pressed', 'false');
    const sau = (await hop.innerText()).length;
    expect(sau).not.toBe(truoc);
    await page.screenshot({ path: test.info().outputPath(ten + '.png') });
    expect(loiJs).toEqual([]);
  });
}
