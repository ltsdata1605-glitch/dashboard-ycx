import projectConfig from '../../vite.config.ts';
import path from 'node:path';
import os from 'node:os';

// Audit only: keep production Vite config unchanged. Use one server at a time.
export default async (env) => {
  const base = typeof projectConfig === 'function' ? await projectConfig(env) : projectConfig;
  return {
    ...base,
    cacheDir: path.join(os.tmpdir(), `ycx-audit-vite-${process.env.AUDIT_PORT || '5198'}`),
    server: {
      ...base.server,
      open: false,
      proxy: {},
      hmr: false,
      watch: null,
    },
    plugins: [
      {
        name: 'audit-deny-server-proxy',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = new URL(req.url || '/', 'http://localhost');
            if (url.pathname.startsWith('/api-line-proxy')) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'text/plain');
              res.end('AUDIT_EXTERNAL_PROXY_DISABLED');
              return;
            }
            next();
          });
        },
      },
      ...(base.plugins || []),
    ],
  };
};
