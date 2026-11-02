import baseline from '../tools/playwright-baseline.config.mjs';
export default {
  ...baseline,
  projects: baseline.projects.map(project => ({ ...project, use: { ...project.use, ...(process.env.AUDIT_MOBILE === '1' ? {viewport:{width:390,height:844},isMobile:true,hasTouch:true} : {}) } })),
  testMatch: ['searchable-select-keyboard.spec.ts'],
  webServer: {
    ...baseline.webServer,
    command: `npm run dev -- --config audit/evidence/c18-vite.config.mjs --port ${process.env.AUDIT_PORT || '5198'} --strictPort`,
  },
  outputDir: new URL(`../../test-results/c36-${process.env.AUDIT_RUN || 'main'}`, import.meta.url).pathname,
  reporter: [['list'], ['json', { outputFile: new URL(`./c36-${process.env.AUDIT_RUN || 'main'}.json`, import.meta.url).pathname }]],
};
