import { expect, test, type Page } from '@playwright/test';
import { appPath, APP_BASE } from './helpers/appBase';

type ProbeState = { versions: string[]; pings: number };
async function start(page: Page) {
    await page.goto(appPath('/tests/e2e/helpers/materialHarness.html'));
    await page.evaluate(async (B) => {
        const state: ProbeState = { versions: [], pings: 0 };
        (window as unknown as { auditProbe: ProbeState }).auditProbe = state;
        const path = B + 'features/bi-dashboard/services/userscriptProbeService.ts';
        const service = await import(/* @vite-ignore */ path);
        service.startUserscriptUpdateWatcher('2.0.0', (version: string) => state.versions.push(version));
    }, APP_BASE);
    const handle = await page.locator('#__ycx_userscript_probe_frame__').elementHandle();
    const frame = await handle!.contentFrame();
    await frame!.waitForLoadState();
    return frame!;
}
async function versions(page: Page) {
    return page.evaluate(() => ({
        callbacks: (window as unknown as { auditProbe: ProbeState }).auditProbe.versions,
        stored: localStorage.getItem('ycx_userscript_installed_version'),
    }));
}
// Real Window.postMessage with a barrier from the same sender; no synthetic MessageEvent.
async function sendVersion(frame: NonNullable<Awaited<ReturnType<typeof start>>>) {
    await frame.evaluate(async () => {
        await new Promise<void>(resolve => {
            const done = (e: MessageEvent) => {
                if (e.data === 'audit-message-barrier') { parent.removeEventListener('message', done); resolve(); }
            };
            parent.addEventListener('message', done);
            parent.postMessage({ type: 'ycx-probe-version', version: '2.0.0' }, '*');
            parent.postMessage('audit-message-barrier', '*');
        });
    });
}

test('unrelated same-origin frame cannot claim an installed version', async ({ page }) => {
    await start(page);
    // A sibling frame is the untrusted message source, not a fake application UI.
    await page.evaluate((B) => {
        const frame = document.createElement('iframe'); frame.id = 'unrelated'; frame.src = B + 'userscript-probe.html'; document.body.append(frame);
    }, APP_BASE);
    const frame = await (await page.locator('#unrelated').elementHandle())!.contentFrame();
    await frame!.waitForLoadState();
    await sendVersion(frame!);
    expect(await versions(page)).toEqual({ callbacks: [], stored: null });
});

test('opaque-origin message from the owned frame is rejected', async ({ page }) => {
    const frame = await start(page);
    // Same WindowProxy after navigation, but a different/opaque origin.
    await frame.goto('data:text/html,<title>Foreign origin fixture</title>');
    const received = page.evaluate(() => new Promise<void>(resolve => {
        const listener = (e: MessageEvent) => {
            if (e.data === 'audit-opaque-barrier') { window.removeEventListener('message', listener); resolve(); }
        };
        window.addEventListener('message', listener);
    }));
    await frame.evaluate(() => {
        parent.postMessage({ type: 'ycx-probe-version', version: '2.0.0' }, '*');
        parent.postMessage('audit-opaque-barrier', '*');
    });
    await received;
    expect(await versions(page)).toEqual({ callbacks: [], stored: null });
});

test('current probe after reload still reports version once', async ({ page }) => {
    await start(page);
    await page.evaluate(async (B) => {
        const path = B + 'features/bi-dashboard/services/userscriptProbeService.ts';
        (await import(/* @vite-ignore */ path)).reloadProbeIframe();
    }, APP_BASE);
    const frame = await (await page.locator('#__ycx_userscript_probe_frame__').elementHandle())!.contentFrame();
    await frame!.waitForLoadState();
    await sendVersion(frame!);
    await sendVersion(frame!);
    expect(await versions(page)).toEqual({ callbacks: ['2.0.0'], stored: '2.0.0' });
});

test('probe accepts parent ping and rejects a sibling ping', async ({ page }) => {
    const probe = await start(page);
    await probe.evaluate(() => {
        (window as unknown as { auditPings: number }).auditPings = 0;
        window.addEventListener('ycx-bonus-bridge:ping', e => {
            // Count postMessage-triggered pings only, not the periodic bridge timer.
            if ((e as CustomEvent).detail?.nonce?.startsWith('probe_')) (window as unknown as { auditPings: number }).auditPings++;
        });
    });
    await page.evaluate((B) => {
        const sibling = document.createElement('iframe'); sibling.id = 'unrelated'; sibling.src = B + 'userscript-probe.html'; document.body.append(sibling);
    }, APP_BASE);
    const sibling = await (await page.locator('#unrelated').elementHandle())!.contentFrame();
    await sibling!.waitForLoadState();
    const before = await probe.evaluate(() => (window as unknown as { auditPings: number }).auditPings);
    await sibling!.evaluate(() => {
        const target = parent.document.getElementById('__ycx_userscript_probe_frame__') as HTMLIFrameElement;
        target.contentWindow!.postMessage({ type: 'ycx-probe-ping' }, location.origin);
    });
    // Drain message tasks in the receiver by a parent-origin barrier.
    await page.evaluate(async () => {
        const target = (document.getElementById('__ycx_userscript_probe_frame__') as HTMLIFrameElement).contentWindow!;
        await new Promise<void>(resolve => {
            const listener = (e: MessageEvent) => { if (e.data === 'audit-ping-barrier') { target.removeEventListener('message', listener); resolve(); } };
            target.addEventListener('message', listener); target.postMessage('audit-ping-barrier', location.origin);
        });
    });
    expect(await probe.evaluate(() => (window as unknown as { auditPings: number }).auditPings)).toBe(before);
    await page.evaluate(() => (document.getElementById('__ycx_userscript_probe_frame__') as HTMLIFrameElement).contentWindow!.postMessage({ type: 'ycx-probe-ping' }, location.origin));
    await expect.poll(() => probe.evaluate(() => (window as unknown as { auditPings: number }).auditPings)).toBeGreaterThan(before);
});

test('userscript pong boundary still reaches the watcher through the real probe', async ({ page }) => {
    const probe = await start(page);
    // Protocol fixture at the extension boundary, not an installed Tampermonkey claim.
    await probe.evaluate(() => window.dispatchEvent(new CustomEvent('ycx-bonus-bridge:pong', {
        detail: { source: 'ycx-bonus-bridge', type: 'pong', nonce: 'audit-pong', version: '2.0.0' },
    })));
    await expect.poll(() => versions(page)).toEqual({ callbacks: ['2.0.0'], stored: '2.0.0' });
});
