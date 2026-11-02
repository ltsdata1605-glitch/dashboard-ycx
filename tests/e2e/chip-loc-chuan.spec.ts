import { expect, test } from '@playwright/test';

/**
 * Chip lọc (2026-10-28, chủ dự án chốt "Chuyển"): 2 hộp thoại chọn người dùng LINE + danh mục avatar Report BI trước tự vẽ
 * nút lọc tô emerald/sky — nay dùng <Tabs variant="chips"> chung (chọn = slate-900, số đếm thành huy hiệu). Render thật qua harness.
 */
test.use({ viewport: { width: 1366, height: 768 } });
const CA: Array<{ ten: string; mo?: string; chip: RegExp; dem?: Record<string, string> }> = [
  { ten: 'line/SelectFilterUserModal', chip: /Từ Nhóm LINE/, dem: { 'Tất cả': '3', 'Chưa thêm': '2', 'Đã trong danh sách': '1', 'Từ Nhóm LINE': '2' } },
  { ten: 'line/SelectInteractedUserModal', chip: /Nhắn riêng 1-1/, dem: { 'Tất cả': '3', 'Từ Nhóm LINE': '2', 'Nhắn riêng 1-1': '1' } },
  { ten: 'bi/AvatarPickerModal', chip: /Thú cưng/ },
];
for (const c of CA) {
  test(c.ten, async ({ page }) => {
    const loiJs: string[] = []; page.on('pageerror', e => loiJs.push(e.message));
    await page.goto('/'); await page.waitForTimeout(1500);
    const loi = await page.evaluate(async (n) => { const m = await import('/tests/e2e/helpers/modalSizeHarness.tsx' as string); return m.mountModal(n); }, c.ten);
    expect(loi).toBeFalsy();
    const hop = page.locator('[role="dialog"]').last();
    const tatCa = hop.getByRole('button', { name: /^Tất cả/ });
    await expect(tatCa).toHaveAttribute('aria-pressed', 'true');
    for (const [nhan, so] of Object.entries(c.dem ?? {})) {
      await expect(hop.getByRole('button', { name: new RegExp(`^${nhan}\\s*${so}$`) })).toBeVisible();
    }
    const chip = hop.getByRole('button', { name: c.chip });
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(tatCa).toHaveAttribute('aria-pressed', 'false');
    // Chip đang chọn theo chuẩn chung: nền slate-900, chữ trắng (chờ hiệu ứng transition-all xong).
    await expect.poll(() => chip.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('oklch(0.208 0.042 265.755)');
    expect(await chip.evaluate(el => getComputedStyle(el).color)).toMatch(/rgb\(255, 255, 255\)|oklch\(1 0 0\)/);
    await hop.screenshot({ path: test.info().outputPath('chip.png') });
    expect(loiJs).toEqual([]);
  });
}
