import baseline from '../tools/playwright-baseline.config.mjs';
export default {
 ...baseline, testMatch: ['tax-storage-atomicity.spec.ts', 'navigation-material.spec.ts'],
 outputDir: new URL(`../../test-results/c5-${process.env.AUDIT_RUN || 'main'}`, import.meta.url).pathname,
 reporter: [['list'], ['json', { outputFile: new URL(`./c5-${process.env.AUDIT_RUN || 'main'}.json`, import.meta.url).pathname }]],
};
