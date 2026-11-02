import baseline from '../tools/playwright-baseline.config.mjs';
export default {
 ...baseline, testMatch: ['tax-merge-storage.spec.ts', 'tax-storage-atomicity.spec.ts'],
 outputDir: new URL(`../../test-results/c7-${process.env.AUDIT_RUN || 'main'}`, import.meta.url).pathname,
 reporter: [['list'], ['json', { outputFile: new URL(`./c7-${process.env.AUDIT_RUN || 'main'}.json`, import.meta.url).pathname }]],
};
