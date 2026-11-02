import baseline from '../tools/playwright-baseline.config.mjs';
export default {
 ...baseline, testMatch: ['userscript-probe-boundary.spec.ts'],
 outputDir: new URL(`../../test-results/c8-${process.env.AUDIT_RUN || 'main'}`, import.meta.url).pathname,
 reporter: [['list'], ['json', { outputFile: new URL(`./c8-${process.env.AUDIT_RUN || 'main'}.json`, import.meta.url).pathname }]],
};
