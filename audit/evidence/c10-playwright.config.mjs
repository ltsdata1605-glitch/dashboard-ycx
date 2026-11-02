import baseline from '../tools/playwright-baseline.config.mjs';
export default { ...baseline, testMatch: ['shared-form-states.spec.ts', 'glass-controls.spec.ts', 'apple-tuong-thich.spec.ts'],
 outputDir: new URL(`../../test-results/c10-${process.env.AUDIT_RUN || 'main'}`, import.meta.url).pathname,
 reporter: [['list'], ['json', {outputFile: new URL(`./c10-${process.env.AUDIT_RUN || 'main'}.json`, import.meta.url).pathname}]],
};
