import { expect, test } from '@playwright/test';

// This contract belongs to audit/evidence/c18-vite.config.mjs, not the production dev server.
test.skip(process.env.AUDIT_ISOLATED_SERVER !== '1', 'Audit-only server contract; run with C18 config and AUDIT_ISOLATED_SERVER=1');

test('audit server rejects LINE proxy requests before forwarding and renders the app', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i })).toBeVisible();
    const denied = await page.evaluate(async () => {
        const result = await fetch('/api-line-proxy/__audit_noop__');
        return { status: result.status, body: await result.text() };
    });
    expect(denied).toEqual({ status: 403, body: 'AUDIT_EXTERNAL_PROXY_DISABLED' });
    expect(await page.evaluate(() => localStorage.getItem('ycx_demo_mode'))).not.toBe('true');
});
