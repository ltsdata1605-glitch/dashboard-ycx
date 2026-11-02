import { test, expect } from '@playwright/test';

for (const variant of ['underline', 'pills', 'segment', 'chips']) {
  test(`${variant}: exposes selection and native keyboard changes`, async ({ page, browserName }) => {
    await page.goto(`/tests/e2e/helpers/materialHarness.html?tabs&variant=${variant}`);
    const one = page.getByRole('button', { name: 'Một', exact: true });
    const two = page.getByRole('button', { name: 'Hai', exact: true });
    await expect(one).toHaveAttribute('aria-pressed', 'true');
    await expect(two).toHaveAttribute('aria-pressed', 'false');
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await page.keyboard.press(tab);
    await expect(one).toBeFocused();
    await page.keyboard.press(tab);
    await expect(two).toBeFocused();
    await page.keyboard.press('Space');
    await expect(two).toHaveAttribute('aria-pressed', 'true');
    await expect(one).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('output')).toHaveText('two');
    await expect(page.getByRole('button', { name:'Khóa' })).toBeDisabled();
  });
}

test.describe('touch landscape target', () => {
  test.use({hasTouch:true,viewport:{width:844,height:390}});
  for (const variant of ['underline','pills']) {
    for (const size of ['sm','md']) {
      test(`${variant} ${size}:44px`, async ({page}) => {
        await page.goto(`/tests/e2e/helpers/materialHarness.html?tabs&variant=${variant}&size=${size}`);
        const button=page.getByRole('button',{name:'Một',exact:true});
        await expect(button).toBeVisible();
        expect(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches)).toBe(true);
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      });
    }
  }
});
