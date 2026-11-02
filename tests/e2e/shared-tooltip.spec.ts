import { expect, test } from '@playwright/test';

for (const width of [390, 1366]) {
    test.describe(`Tooltip ${width}`, () => {
        test.use({ viewport: { width, height: 844 } });
        test('keyboard description and Escape preserve focus and caller description', async ({ page }) => {
            await page.goto('/tests/e2e/helpers/materialHarness.html?tooltip');
            const trigger = page.getByRole('button', { name: 'Thao tác' });
            await expect(trigger).toBeVisible();
            await page.keyboard.press('Tab');
            await expect(trigger).toBeFocused();
            const tooltip = page.getByRole('tooltip');
            await expect(tooltip).toBeVisible();
            const id = await tooltip.getAttribute('id');
            expect(id).toBeTruthy();
            expect((await trigger.getAttribute('aria-describedby'))!.split(' ')).toEqual(['tooltip-help', id]);
            await page.keyboard.press('Escape');
            await expect(tooltip).toHaveCount(0);
            await expect(trigger).toBeFocused();
            await expect(trigger).toHaveAttribute('aria-describedby', 'tooltip-help');
            await page.keyboard.press('Tab');
            await expect(page.getByRole('button', { name: 'Tiếp theo' })).toBeFocused();
        });
        test('Escape cancels a pending hover timer', async ({ page }) => {
            await page.clock.install();
            await page.goto('/tests/e2e/helpers/materialHarness.html?tooltip');
            await page.getByRole('button', { name: 'Thao tác' }).hover();
            await page.keyboard.press('Escape');
            await page.clock.fastForward(500);
            await expect(page.getByRole('tooltip')).toHaveCount(0);
        });
        test('hover dismissal works and leaving the pointer preserves keyboard focus tooltip', async ({ page }) => {
            await page.goto('/tests/e2e/helpers/materialHarness.html?tooltip');
            const trigger = page.getByRole('button', { name: 'Thao tác' });
            await trigger.hover();
            await expect(page.getByRole('tooltip')).toBeVisible();
            await page.keyboard.press('Escape');
            await expect(page.getByRole('tooltip')).toHaveCount(0);
            await page.mouse.move(5, 5);
            await expect(trigger).toBeVisible();
            await page.keyboard.press('Tab');
            await expect(trigger).toBeFocused();
            await expect(page.getByRole('tooltip')).toBeVisible();
            await trigger.hover();
            await page.mouse.move(5, 5);
            await expect(page.getByRole('tooltip')).toBeVisible();
            await page.screenshot({path:`audit/evidence/${process.env.AUDIT_SCREENSHOT_PREFIX || 'c13'}-tooltip-${width}.png`, animations:'disabled'});
        });
    });
}

for (const width of [390, 1366]) {
    test.describe(`Tooltip lifecycle ${width}`, () => {
        test.use({ viewport: { width, height: 844 } });
        for (const side of ['top', 'bottom', 'left', 'right']) {
            test(`pointer crosses gap onto ${side} tooltip and leaves without focus`, async ({ page }) => {
                await page.goto(`/tests/e2e/helpers/materialHarness.html?tooltip&side=${side}`);
                const trigger = page.getByRole('button', { name: 'Thao tác' });
                await trigger.hover();
                await expect(trigger).not.toBeFocused();
                const tooltip = page.getByRole('tooltip');
                await expect(tooltip).toBeVisible();
                const box = (await tooltip.boundingBox())!;
                await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 16 });
                await expect(tooltip).toBeVisible();
                // Prove the pointer reached the real tooltip, not a stale visible sibling.
                await expect(tooltip).toHaveJSProperty('id', await trigger.getAttribute('aria-describedby').then(ids => ids!.split(' ')[1]));
                expect(await tooltip.evaluate(el => el.matches(':hover'))).toBe(true);
                await page.mouse.move(5, 5, { steps: 16 });
                await expect(tooltip).toHaveCount(0);
                await expect(trigger).toHaveAttribute('aria-describedby', 'tooltip-help');
            });
        }
        test('disabled cancels pending and visible tooltip without stale re-entry', async ({ page }) => {
            await page.clock.install();
            await page.goto('/tests/e2e/helpers/materialHarness.html?tooltip');
            const trigger = page.getByRole('button', { name: 'Thao tác' });
            await expect(trigger).toBeVisible();
            await page.keyboard.press('Tab');
            await expect(trigger).toBeFocused();
            await page.keyboard.press('d');
            await expect(page.locator('output')).toHaveText('disabled');
            await page.clock.fastForward(500);
            await expect(page.getByRole('tooltip')).toHaveCount(0);
            await expect(trigger).toHaveAttribute('aria-describedby', 'tooltip-help');
            await page.keyboard.press('d');
            await page.keyboard.press('Tab');
            await page.keyboard.press('Shift+Tab');
            await page.clock.fastForward(500);
            await expect(page.getByRole('tooltip')).toBeVisible();
            await page.keyboard.press('d');
            await expect(page.getByRole('tooltip')).toHaveCount(0);
            await expect(trigger).toBeFocused();
        });
        test('unmount while pending then remount creates a clean tooltip', async ({ page }) => {
            await page.clock.install();
            await page.goto('/tests/e2e/helpers/materialHarness.html?tooltip');
            const trigger = page.getByRole('button', { name: 'Thao tác' });
            await expect(trigger).toBeVisible();
            await page.keyboard.press('Tab');
            await expect(trigger).toBeFocused();
            await page.keyboard.press('u');
            await expect(trigger).toHaveCount(0);
            await page.clock.fastForward(500);
            await expect(page.getByRole('tooltip')).toHaveCount(0);
            await page.getByRole('button', { name: 'Gắn lại' }).click();
            await expect(trigger).toBeVisible();
            await page.clock.fastForward(500);
            await expect(page.getByRole('tooltip')).toHaveCount(0);
            await trigger.hover();
            await page.clock.fastForward(500);
            await expect(page.getByRole('tooltip')).toBeVisible();
        });
    });
}

for (const width of [390, 1366]) {
    test.describe(`Tooltip viewport ${width}`, () => {
        test.use({ viewport: { width, height: 844 } });
        for (const side of ['top', 'bottom', 'left', 'right']) {
            test(`long content at ${side} edge stays readable inside viewport`, async ({ page, browserName }) => {
                await page.goto(`/tests/e2e/helpers/materialHarness.html?tooltip&side=${side}&edge=${side}`);
                const trigger = page.getByRole('button', { name: 'Ở mép' });
                await expect(trigger).toBeVisible();
                // WebKit/macOS button traversal uses Option+Tab; this is not a default-Tab acceptance test.
                await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
                await expect(trigger).toBeFocused();
                const tooltip = page.getByRole('tooltip');
                await expect(tooltip).toBeVisible();
                const geometry = () => tooltip.evaluate(el => {
                    const r = el.getBoundingClientRect();
                    const content = el.firstElementChild!;
                    const trigger = el.parentElement!.querySelector('button')!.getBoundingClientRect();
                    return { noTriggerOverlap: r.right <= trigger.left || r.left >= trigger.right || r.bottom <= trigger.top || r.top >= trigger.bottom, inside: r.left >= 7 && r.top >= 7 && r.right <= innerWidth - 7 && r.bottom <= innerHeight - 7,
                        wraps: r.height > 40, noTextOverflow: content.scrollWidth <= content.clientWidth + 1,
                        noPageOverflow: document.documentElement.scrollWidth <= innerWidth };
                });
                expect(await geometry()).toEqual({noTriggerOverlap:true, inside:true, wraps:true, noTextOverflow:true, noPageOverflow:true});
                await page.setViewportSize({width:320, height:568});
                await expect.poll(geometry).toEqual({noTriggerOverlap:true, inside:true, wraps:true, noTextOverflow:true, noPageOverflow:true});
                await page.screenshot({path:`audit/evidence/${process.env.AUDIT_SCREENSHOT_PREFIX || 'c14'}-edge-${width}-${side}.png`, animations:'disabled'});
                await page.keyboard.press('Escape');
                await expect(tooltip).toHaveCount(0);
                await expect(trigger).toBeFocused();
            });
        }
    });
}
