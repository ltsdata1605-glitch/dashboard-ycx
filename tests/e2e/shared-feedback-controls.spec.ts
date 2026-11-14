import { test, expect } from '@playwright/test';
import { appPath } from './helpers/appBase';

for (const width of [390, 1366]) {
  test.describe(`Feedback ${width}`, () => {
    test.use({ viewport: { width, height: 844 } });
    test.beforeEach(async ({ page }) => {
      await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?feedback'));
    });
    test('progress names and bounded visual/ARIA values', async ({ page }) => {
      const bars = page.getByRole('progressbar');
      await expect(bars).toHaveCount(3);
      await expect(bars.nth(0)).toHaveAccessibleName('Hoàn thành');
      await expect(bars.nth(0)).toHaveAttribute('aria-valuenow', '100');
      await expect(bars.nth(1)).toHaveAccessibleName('Chưa có tổng');
      await expect(bars.nth(1)).toHaveAttribute('aria-valuenow', '0');
      await expect(bars.nth(1)).toHaveAttribute('aria-valuemax', '100');
      await expect(bars.nth(2)).toHaveAccessibleName('Quỹ thời gian');
      await expect(bars.nth(2)).toHaveAttribute('aria-valuenow', '50');
      await expect(page.locator('main')).not.toContainText('NaN');
    });
    test('banner disclosure has independent controlled content and keyboard toggle', async ({ page, browserName }) => {
      const expand = page.getByRole('button', { name: 'Xem thêm' });
      await expect(expand).toHaveCount(2);
      await expect(expand.nth(0)).toHaveAttribute('aria-expanded', 'false');
      const firstId = await expand.nth(0).getAttribute('aria-controls');
      const secondId = await expand.nth(1).getAttribute('aria-controls');
      expect(firstId).toBeTruthy();
      expect(firstId).not.toBe(secondId);
      await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
      await expect(expand.nth(0)).toBeFocused();
      await page.keyboard.press('Enter');
      const collapse = page.getByRole('button', { name: 'Thu gọn' });
      await expect(collapse).toHaveAttribute('aria-expanded', 'true');
      const body = page.locator(`[id="${firstId}"]`);
      expect(await body.evaluate(el => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      await expect(expand).toHaveCount(1);
      await expect(expand).toHaveAttribute('aria-expanded', 'false');
      await page.screenshot({path:`audit/evidence/c21-feedback-${browserName}-${width}.png`,animations:'disabled'});
      await page.keyboard.press('Space');
      await expect(page.getByRole('button', {name:'Xem thêm'})).toHaveCount(2);
    });
  });
}
