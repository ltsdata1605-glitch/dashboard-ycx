// Safe baseline: fresh profiles, external browser traffic sent to a closed loopback proxy.
import { defineConfig, devices } from '@playwright/test';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const port = Number(process.env.AUDIT_PORT || 5189);
export default defineConfig({
  testDir: path.join(root, 'tests/e2e'),
  testMatch: ['smoke.spec.ts', 'modal-ngan-xep.spec.ts', 'apple-tuong-thich.spec.ts'],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: process.env.AUDIT_OUTPUT_FILE || path.join(root, 'audit/evidence/e2e-' + (process.env.AUDIT_ENGINE || 'chromium') + '.json') }]],
  outputDir: path.join(root, 'test-results/phase2-' + (process.env.AUDIT_ENGINE || 'chromium')),
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    proxy: { server: 'http://127.0.0.1:9', bypass: 'localhost,127.0.0.1' },
    trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'off',
  },
  projects: [{ name: process.env.AUDIT_ENGINE || 'chromium', use: process.env.AUDIT_ENGINE === 'webkit' ? devices['Desktop Safari'] : devices['Desktop Chrome'] }],
  webServer: {
    command: `npm run dev -- --port ${port} --strictPort`,
    cwd: root,
    env: { BROWSER: 'none' },
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
