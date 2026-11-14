import { test, expect } from '@playwright/test';

test('Clicking Google login button navigates in the same window/tab without opening any popup window', async ({ page, context }) => {
    let popupOpened = false;
    context.on('page', () => {
        popupOpened = true;
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const googleBtn = page.getByRole('button', { name: /Tiếp tục với Google/i });
    await expect(googleBtn).toBeVisible({ timeout: 10_000 });

    // Listen for navigation request from the main page
    const navigationPromise = page.waitForRequest(req => {
        const url = req.url();
        return url.includes('dashboa-7e20b.firebaseapp.com/__/auth/handler') || url.includes('accounts.google.com');
    }, { timeout: 10_000 });

    // Click Google button
    await googleBtn.click();

    // Verify request triggered in the SAME page/window
    const navRequest = await navigationPromise;
    expect(navRequest).toBeTruthy();
    expect(navRequest.url()).toContain('dashboa-7e20b.firebaseapp.com/__/auth/handler');
    expect(navRequest.url()).toContain('redirectUrl=');
    const decodedUrl = decodeURIComponent(decodeURIComponent(navRequest.url()));
    expect(decodedUrl).toContain('ret=http://127.0.0.1:5173');
    // 2026-11-14: trang về (pwa-login.html) PHẢI cùng origin với trang xử lý Google — khác origin là không đọc được kết quả
    // (sessionStorage theo origin) → lặp vòng đăng nhập mãi trên máy tính (video chủ dự án).
    const handler = new URL(navRequest.url());
    const ve = new URL(handler.searchParams.get('redirectUrl')!);
    expect(ve.origin).toBe(handler.origin);
    expect(ve.pathname).toBe('/pwa-login.html');

    // Confirm that absolutely no popup window was opened!
    expect(popupOpened).toBe(false);
});
