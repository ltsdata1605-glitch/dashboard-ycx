import { test, expect } from '@playwright/test';

test('failed CSS request may retry; pending and loaded requests deduplicate', async ({ page }) => {
  let count = 0;
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('https://fonts.googleapis.com/**', async route => {
    count++;
    if (count === 1) return route.abort('failed');
    await gate;
    await route.fulfill({contentType:'text/css',body:'/* successful mocked stylesheet */'});
  });
  await page.goto('/tests/e2e/helpers/materialHarness.html?fonts');
  const load = page.getByRole('button', {name:'Tải Inter'});
  await load.click();
  await expect.poll(() => count).toBe(1);
  await expect(page.locator('link[data-phong-google]')).toHaveCount(0);
  await load.click();
  await expect.poll(() => count).toBe(2);
  await load.click();
  const link = page.locator('link[data-phong-google]');
  await expect(link).toHaveCount(1);
  const href = (await link.getAttribute('href'))!;
  expect(new URL(href).searchParams.getAll('family')).toEqual(['Inter:wght@400;500;600;700;800;900']);
  expect(count).toBe(2);
  release();
  await expect.poll(() => link.evaluate(el => Boolean((el as HTMLLinkElement).sheet))).toBe(true);
  await load.click();
  await page.getByRole('button', {name:'Phông cục bộ'}).click();
  await expect(link).toHaveCount(1);
  expect(count).toBe(2);
});
