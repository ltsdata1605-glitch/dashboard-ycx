import baseline from '../tools/playwright-baseline.config.mjs';
export default {
  ...baseline,
  globalTimeout: 180_000,
  testMatch: ['apple-tuong-thich.spec.ts', 'glass-controls.spec.ts', 'glass-material-foundation.spec.ts', 'lop-apple-gd3.spec.ts'],
  outputDir: new URL(`../../test-results/c3-${process.env.AUDIT_RUN || process.env.AUDIT_ENGINE || 'chromium'}`, import.meta.url).pathname,
  reporter: [['list'], ['json', { outputFile: new URL(`./c3-${process.env.AUDIT_RUN || process.env.AUDIT_ENGINE || 'chromium'}.json`, import.meta.url).pathname }]],
};
