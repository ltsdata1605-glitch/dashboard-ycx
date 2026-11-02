import baseline from '../tools/playwright-baseline.config.mjs';
export default {
  globalTimeout: 180_000,
  ...baseline,
  testMatch: ['smoke.spec.ts', 'modal-ngan-xep.spec.ts', 'apple-tuong-thich.spec.ts', 'lop-apple-gd3.spec.ts', 'glass-material-foundation.spec.ts'],
  reporter: [['list'], ['json', {outputFile: new URL('./correction-e2e.json', import.meta.url).pathname}]],
};
