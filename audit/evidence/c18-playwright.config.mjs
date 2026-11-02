import baseline from '../tools/playwright-baseline.config.mjs';
export default {
  ...baseline,
  testMatch: ['audit-network-isolation.spec.ts', 'bi-nhan-vien-theo-sieu-thi.spec.ts', 'bi-competition.spec.ts', 'sidebar-hover-flyout.spec.ts', 'menu-khac-xoay-ngang.spec.ts'],
  webServer: {
    ...baseline.webServer,
    command: `npm run dev -- --config audit/evidence/c18-vite.config.mjs --port ${process.env.AUDIT_PORT || '5198'} --strictPort`,
  },
  outputDir: new URL(`../../test-results/c18-${process.env.AUDIT_RUN || 'main'}`, import.meta.url).pathname,
  reporter: [['list'], ['json', { outputFile: new URL(`./c18-${process.env.AUDIT_RUN || 'main'}.json`, import.meta.url).pathname }]],
};
