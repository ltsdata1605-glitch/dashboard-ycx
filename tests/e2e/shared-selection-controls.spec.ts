import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/helpers/materialHarness.html?selection-controls');
});

for (const [name, width, height] of [['Nhỏ', 36, 20], ['Vừa', 44, 26]] as const) {
  test(`${name}: vùng chạm 44 giữ nguyên kích thước nhìn thấy`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const control = page.getByRole('switch', { name, exact: true });
    await expect(control).toBeVisible();
    const box = (await control.boundingBox())!;
    expect(box.width).toBe(width);
    expect(box.height).toBe(height);
    // Click within 44px target, outside the visible track; real React state must toggle.
    await page.mouse.click(box.x + width / 2, box.y + height / 2 - 21);
    await expect(control).toHaveAttribute('aria-checked', 'true');
    await page.mouse.click(box.x + width / 2, box.y + height / 2 + 21);
    await expect(control).toHaveAttribute('aria-checked', 'false');
  });
}

test('bàn phím, focus visible, disabled và reduced motion', async ({ page, browserName }) => {
  const small = page.getByRole('switch', { name: 'Nhỏ', exact: true });
  await expect(small).toBeVisible();
  // WebKit default keyboard navigation uses Option+Tab to include buttons.
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(small).toBeFocused();
  const ring = await small.evaluate(el => {
    const s = getComputedStyle(el);
    return [s.outlineStyle, s.outlineWidth, s.outlineOffset, s.outlineColor];
  });
  expect(ring.slice(0, 3)).toEqual(['solid', '2px', '2px']);
  expect(ring[3]).not.toBe('rgba(0, 0, 0, 0)');
  await page.keyboard.press('Space');
  await expect(small).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Enter');
  await expect(small).toHaveAttribute('aria-checked', 'false');
  const disabled = page.getByRole('switch', { name: 'Khóa' });
  await expect(disabled).toBeDisabled();
  const box = (await disabled.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(disabled).toHaveAttribute('aria-checked', 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await small.evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
});
