import baseline from '../tools/playwright-baseline.config.mjs';
export default {
 ...baseline, testMatch: ['tax-merge-storage.spec.ts', 'tax-storage-atomicity.spec.ts'],
 outputDir: new URL('../../test-results/c6-storage', import.meta.url).pathname,
 reporter: [['list'], ['json', { outputFile: new URL('./c6-storage.json', import.meta.url).pathname }]],
};
