import { expect, test } from '@playwright/test';
import { appPath } from './helpers/appBase';

for (const width of [390, 1366]) {
    test.describe(`shared form states ${width}`, () => {
        test.use({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390 });
        test('error linkage, busy state, keyboard focus and dense exceptions', async ({ page }) => {
            await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?forms'));
            const save = page.getByRole('button', { name: 'Lưu', exact: true });
            await expect(save).toBeVisible();
            await page.keyboard.press('Tab');
            await expect(save).toBeFocused();
            await expect(save).toHaveCSS('outline-style', 'solid');
            await expect(save).toHaveCSS('outline-width', '2px');
            await expect(save).toHaveCSS('outline-offset', '2px');
            const input = page.getByRole('textbox', { name: 'Tên', exact: true });
            const select = page.getByRole('combobox', { name: 'Kỳ', exact: true });
            await expect(input).toHaveCSS('height', width === 390 ? '44px' : '36px');
            await expect(select).toHaveCSS('height', width === 390 ? '44px' : '36px');
            await expect(page.getByRole('textbox', { name: 'Ô dense' })).toHaveCSS('height', '28px');
            await expect(page.getByRole('combobox', { name: 'Kỳ dense' })).toHaveCSS('height', '28px');
            // Nút icon: 32px iPhone/iPad, 36px laptop ≥ lg (chủ dự án chốt AUD-012, 2026-10-28).
            await expect(page.getByRole('button', { name: 'Nút icon' })).toHaveCSS('width', width === 390 ? '32px' : '36px');
            await expect(save.locator('svg')).toHaveCSS('width', width === 390 ? '18px' : '16px');
            await expect(page.getByRole('combobox', { name: 'Kỳ khóa' })).toBeDisabled();
            await select.selectOption('b');
            await expect(page.locator('output')).toHaveText('b');
            await expect(select).toHaveAttribute('aria-invalid', 'false');
            await page.evaluate(() => document.documentElement.style.setProperty('--btn-radius', '17px'));
            for (const control of [save, input, select]) await expect(control).toHaveCSS('border-radius', '17px');
            await page.evaluate(() => document.documentElement.style.removeProperty('--btn-radius'));
            await page.getByRole('button', { name: 'Kiểm lỗi' }).click();
            for (const [control, message] of [[input, 'Thiếu tên'], [select, 'Thiếu kỳ']] as const) {
                await expect(control).toHaveAttribute('aria-invalid', 'true');
                const ids = (await control.getAttribute('aria-describedby'))!.split(' ');
                expect(ids).toContain('form-help');
                expect(ids).toHaveLength(2);
                // Resolve the actual relation instead of assuming React's generated ID format.
                const text = await control.evaluate(el => document.getElementById(el.getAttribute('aria-describedby')!.split(' ')[1])?.textContent);
                expect(text).toBe(message);
                await expect(page.getByRole('alert').filter({ hasText: message })).toBeVisible();
            }
            await save.click();
            await expect(save).toBeDisabled();
            await expect(save).toHaveAttribute('aria-busy', 'true');
            await page.screenshot({ path: `audit/evidence/${process.env.AUDIT_SCREENSHOT_PREFIX || 'c9'}-forms-${width}.png`, animations: 'disabled' });
            await page.getByRole('button', { name: 'Đặt lại' }).click();
            await expect(save).toBeEnabled();
            await expect(save).not.toHaveAttribute('aria-busy', 'true');
            await page.getByRole('button', { name: 'Kiểm lỗi' }).click();
            await expect(select).toHaveAttribute('aria-describedby', 'form-help');
            await expect(select).toHaveAttribute('aria-invalid', 'false');
            await expect(page.getByRole('alert')).toHaveCount(0);
        });
    });
}

test('loading button exposes busy state independently of form validation', async ({ page }) => {
    await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?forms'));
    const save = page.getByRole('button', { name: 'Lưu', exact: true });
    await save.click();
    await expect(save).toBeDisabled();
    await expect(save).toHaveAttribute('aria-busy', 'true');
});

for (const width of [390, 1366]) {
    test.describe(`height tokens ${width}`, () => {
        test.use({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390 });
        test('height tokens propagate without changing dense/icon/caller exceptions', async ({ page }) => {
            await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?forms'));
            const save = page.getByRole('button', { name: 'Lưu', exact: true });
            const input = page.getByRole('textbox', { name: 'Tên', exact: true });
            const select = page.getByRole('combobox', { name: 'Kỳ', exact: true });
            await expect(save).toHaveCSS('height', width === 390 ? '44px' : '36px');
            await expect(page.getByRole('button', { name: 'Nhỏ', exact: true })).toHaveCSS('height', width === 390 ? '44px' : '32px');
            await expect(page.getByRole('button', { name: 'Lớn', exact: true })).toHaveCSS('height', '44px');
            await page.evaluate(() => {
                document.documentElement.style.setProperty('--btn-height-md', '50px');
                document.documentElement.style.setProperty('--input-height', '52px');
            });
            await expect(save).toHaveCSS('height', '50px');
            await expect(input).toHaveCSS('height', '52px');
            await expect(select).toHaveCSS('height', '52px');
            await expect(page.getByRole('textbox', { name: 'Ô dense' })).toHaveCSS('height', '28px');
            await expect(page.getByRole('combobox', { name: 'Kỳ dense' })).toHaveCSS('height', '28px');
            await expect(page.getByRole('button', { name: 'Nút icon' })).toHaveCSS('height', width === 390 ? '32px' : '36px');
            await expect(page.getByRole('button', { name: 'Cao riêng', exact: true })).toHaveCSS('height', '48px');
            await expect(page.getByRole('textbox', { name: 'Cao riêng input' })).toHaveCSS('height', '48px');
            await expect(page.getByRole('combobox', { name: 'Cao riêng select' })).toHaveCSS('height', '48px');
            await expect(page.getByRole('button', { name: 'Không size' })).toHaveCSS('height', '20px');
        });
    });
}

for (const width of [390, 1366]) {
    test.describe(`radius contract ${width}`, () => {
        test.use({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390 });
        test('shared radius propagates while caller exceptions retain their tokens', async ({ page }) => {
            await page.goto(appPath('/tests/e2e/helpers/materialHarness.html?forms'));
            const shared = [
                page.getByRole('button', { name: 'Lưu', exact: true }),
                page.getByRole('textbox', { name: 'Tên', exact: true }),
                page.getByRole('combobox', { name: 'Kỳ', exact: true }),
                page.getByRole('textbox', { name: 'Ô dense' }),
                page.getByRole('combobox', { name: 'Kỳ dense' }),
            ];
            for (const control of shared) await expect(control).toHaveCSS('border-radius', '8px');
            await page.evaluate(() => {
                document.documentElement.style.setProperty('--btn-radius', '17px');
                document.documentElement.style.setProperty('--card-radius', '21px');
                document.documentElement.style.setProperty('--popup-radius', '13px');
            });
            for (const control of shared) await expect(control).toHaveCSS('border-radius', '17px');
            await expect(page.getByRole('button', { name: 'Cao riêng', exact: true })).toHaveCSS('border-radius', '21px');
            await expect(page.getByRole('textbox', { name: 'Cao riêng input' })).toHaveCSS('border-radius', '0px');
            await expect(page.getByRole('combobox', { name: 'Cao riêng select' })).toHaveCSS('border-radius', '13px');
            await page.evaluate(() => {
                for (const token of ['--btn-radius', '--card-radius', '--popup-radius']) document.documentElement.style.removeProperty(token);
            });
            for (const control of shared) await expect(control).toHaveCSS('border-radius', '8px');
            await expect(page.getByRole('button', { name: 'Cao riêng', exact: true })).toHaveCSS('border-radius', '16px');
            await expect(page.getByRole('combobox', { name: 'Cao riêng select' })).toHaveCSS('border-radius', '12px');
            await page.screenshot({ path: `audit/evidence/${process.env.AUDIT_SCREENSHOT_PREFIX || 'c11'}-radius-${width}.png`, animations: 'disabled' });
        });
    });
}
