import { chromium, webkit } from '@playwright/test';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const root = path.resolve(import.meta.dirname, '../..');
const PORT = 5192;

async function startServer() {
  const proc = spawn('npm', ['run', 'dev', '--', '--port', String(PORT), '--strictPort'], {
    cwd: root,
    env: { ...process.env, BROWSER: 'none' },
    stdio: 'pipe',
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server start timeout')), 30000);
    proc.stdout.on('data', (d) => {
      const s = d.toString();
      if (s.includes(`localhost:${PORT}`) || s.includes(`127.0.0.1:${PORT}`)) {
        clearTimeout(timer);
        resolve();
      }
    });
    proc.stderr.on('data', (d) => {
      // console.error(d.toString());
    });
    proc.on('error', reject);
  });
  return proc;
}

async function inspectEngine(browserType, name) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const log = [];
  const logMsg = (m) => {
    console.log(`[${name}] ${m}`);
    log.push(`[${name}] ${m}`);
  };

  try {
    await page.goto(`http://127.0.0.1:${PORT}/`);
    await page.evaluate(async () => {
      const p = '/tests/e2e/helpers/modalHarness.tsx';
      const mod = await import(/* @vite-ignore */ p);
      mod.mountHarness();
    });

    await page.locator('#mo-a').waitFor({ state: 'visible' });

    // Focus trigger and open modal
    await page.locator('#mo-a').focus();
    logMsg(`Trigger activeElement: ${await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)}`);
    await page.keyboard.press('Enter');

    const dialog = page.getByRole('dialog', { name: 'Hộp thoại A' });
    await dialog.waitFor({ state: 'visible' });

    // Wait for initial focus inside dialog
    await page.waitForTimeout(300);
    const initialActive = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      id: document.activeElement?.id,
      text: document.activeElement?.textContent?.slice(0, 30),
      ariaLabel: document.activeElement?.getAttribute('aria-label'),
      tabIndex: document.activeElement?.tabIndex,
    }));
    logMsg(`Initial focus in dialog: ${JSON.stringify(initialActive)}`);

    // Tab progression
    for (let i = 1; i <= 8; i++) {
      await page.keyboard.press('Tab');
      const active = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        id: document.activeElement?.id,
        text: document.activeElement?.textContent?.slice(0, 30),
        ariaLabel: document.activeElement?.getAttribute('aria-label'),
        tabIndex: document.activeElement?.tabIndex,
        isBody: document.activeElement === document.body,
      }));
      const inside = await dialog.evaluate(el => el.contains(document.activeElement));
      logMsg(`Tab #${i}: inside=${inside}, active=${JSON.stringify(active)}`);
    }

    // Test Alt+Tab / Option+Tab if WebKit
    logMsg(`Testing Shift+Tab from current state:`);
    await page.keyboard.press('Shift+Tab');
    const afterShift = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      id: document.activeElement?.id,
      text: document.activeElement?.textContent?.slice(0, 30),
    }));
    logMsg(`After Shift+Tab: active=${JSON.stringify(afterShift)}`);

    // Test Shift+Tab specifically from first focusable button 'Đóng'
    await dialog.getByRole('button', { name: 'Đóng' }).focus();
    logMsg(`Directly focused 'Đóng', now pressing Shift+Tab...`);
    await page.keyboard.press('Shift+Tab');
    const wrapShift = await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      id: document.activeElement?.id,
      text: document.activeElement?.textContent?.slice(0, 30),
    }));
    logMsg(`After Shift+Tab from 'Đóng': active=${JSON.stringify(wrapShift)}`);

    // Test Alt+Tab on WebKit (Safari keyboard navigation shortcut)
    if (name === 'webkit') {
      logMsg(`Testing Alt+Tab (macOS Option+Tab) behavior in WebKit...`);
      await page.locator('#a-input').focus();
      logMsg(`Focused #a-input, pressing Alt+Tab...`);
      await page.keyboard.press('Alt+Tab');
      const afterAltTab = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        id: document.activeElement?.id,
        text: document.activeElement?.textContent?.slice(0, 30),
      }));
      logMsg(`After Alt+Tab: active=${JSON.stringify(afterAltTab)}`);
    }

    // Inspect tabbable order per HTML spec vs WebKit implementation
    const tabbables = await dialog.evaluate((el) => {
      const candidates = Array.from(el.querySelectorAll('button, input, [tabindex]'));
      return candidates.map(c => ({
        tag: c.tagName,
        id: c.id,
        tabIndex: c.tabIndex,
        text: c.textContent?.slice(0, 20),
      }));
    });
    logMsg(`Dialog tabbables in DOM: ${JSON.stringify(tabbables)}`);

  } finally {
    await browser.close();
  }
  return log;
}

async function main() {
  console.log('Starting dev server on port', PORT);
  const server = await startServer();
  try {
    console.log('Testing Chromium...');
    const chromLogs = await inspectEngine(chromium, 'chromium');
    console.log('\nTesting WebKit...');
    const webkitLogs = await inspectEngine(webkit, 'webkit');

    const outPath = path.join(root, 'audit/evidence/webkit-focus-investigation.txt');
    fs.writeFileSync(outPath, [...chromLogs, '', ...webkitLogs].join('\n'), 'utf8');
    console.log('\nSaved investigation report to', outPath);
  } finally {
    server.kill();
  }
}

main().catch(err => {
  console.error('Investigation error:', err);
  process.exit(1);
});
