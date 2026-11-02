#!/usr/bin/env node
/**
 * Kiểm kê file v2 (phiên 2026-10-28) — CHỈ ĐỌC, không sửa gì ngoài audit/.
 *
 * Khác bản v1 (inventory.py): mẫu số là file Git theo dõi + file chưa theo dõi không bị .gitignore — KHÔNG liệt kê từng file
 * của node_modules/dist/cache (bản v1 làm vậy → 137.057 dòng, 55 MB CSV trong Git). Thư mục loại trừ được đếm gộp ở
 * audit/excluded-summary.csv kèm lý do.
 *
 * Đồ thị import: phân tích tĩnh bằng regex trên `import … from '…'`, `import('…')`, `export … from '…'`, `require('…')`,
 * `lazyWithRetry(() => import('…'))` — đủ để đếm số nơi nhập (inbound) cho từng file nguồn. File nguồn 0 inbound và không phải
 * điểm vào được đánh dấu ORPHAN_CANDIDATE — CHƯA phải code chết: phải kiểm thêm tham chiếu động/runtime (xem dead-code-report.md).
 *
 * Chạy: node audit/tools/inventory-v2.mjs
 */
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const sh = (c) => execSync(c, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

const tracked = sh('git ls-files -z').split('\0').filter(Boolean);
const untracked = sh('git ls-files -z --others --exclude-standard').split('\0').filter(Boolean);
const all = [...new Set([...tracked, ...untracked])].filter((p) => existsSync(p) && statSync(p).isFile()).sort();

const SRC_EXT = /\.(tsx?|jsx?|mjs|cjs)$/;
function loai(p) {
  if (p.startsWith('audit/') && !p.startsWith('audit/tools/')) return 'DOCUMENTATION';
  if (/(^|\/)tests?\//.test(p) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(p)) return 'TEST';
  if (p.startsWith('scripts/') || p.startsWith('audit/tools/') || p.startsWith('functions/scripts/') || p.startsWith('archive/')) return p.endsWith('.zip') ? 'BACKUP' : 'SCRIPT';
  if (/\.(css)$/.test(p)) return 'STYLE';
  if (/\.(md|txt)$/i.test(p)) return 'DOCUMENTATION';
  if (/(^|\/)(package(-lock)?\.json|tsconfig[^/]*\.json|vite\.config\.ts|vitest\.config\.ts|playwright\.config\.ts|eslint\.config\.js|firebase\.json|netlify\.toml|\.firebaserc|firestore\.(rules|indexes\.json)|\.github\/.*\.ya?ml|\.gitignore|metadata\.json|skills-lock\.json|violations-baseline\.json)$/.test(p)) return 'CONFIG';
  if (/firebase-applet-config\.json$/.test(p)) return 'SECRET_CONFIG'; // cấu hình web công khai — xem CLAUDE.md 1.1
  if (/\.(png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|mp3|wav|pdf)$/i.test(p)) return 'ASSET';
  if (SRC_EXT.test(p) || p.endsWith('.html')) return 'SOURCE';
  if (p.endsWith('.json')) return 'CONFIG';
  return 'OTHER';
}
function module_(p) {
  const s = p.split('/');
  if (s[0] === 'features' && s[1]) return `features/${s[1]}`;
  if (s[0] === 'components' && s[1] && !s[1].includes('.')) return s[1] === 'shared' && s[2] && !s[2].includes('.') ? `components/shared/${s[2]}` : `components/${s[1]}`;
  if (s.length === 1) return 'root';
  return s[0];
}

// ── Đồ thị import (tĩnh) ──
const srcFiles = all.filter((p) => SRC_EXT.test(p) && !p.startsWith('node_modules/'));
const srcSet = new Set(srcFiles);
const inbound = new Map(srcFiles.map((p) => [p, 0]));
const outbound = new Map();
const RE = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)|new URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url/g;
const EXTS = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '/index.ts', '/index.tsx', '/index.js'];
function resolve(from, spec) {
  spec = spec.replace(/\?.*$/, ''); // '…?worker', '…?url'
  let base;
  if (spec.startsWith('.')) base = path.posix.join(path.posix.dirname(from), spec);
  else if (spec.startsWith('@/')) base = spec.slice(2);
  else return null;
  for (const e of EXTS) if (srcSet.has(base + e)) return base + e;
  return null;
}
for (const f of srcFiles) {
  let txt;
  try { txt = readFileSync(f, 'utf8'); } catch { continue; }
  const out = new Set();
  for (const m of txt.matchAll(RE)) {
    const r = resolve(f, m[1] || m[2] || m[3] || m[4]);
    if (r && r !== f) out.add(r);
  }
  outbound.set(f, out.size);
  for (const r of out) inbound.set(r, (inbound.get(r) || 0) + 1);
}

// Điểm vào: được build/chạy không qua import tĩnh.
const ENTRY = [
  /^index\.tsx$/, /^App\.tsx$/, /\.(test|spec)\.[cm]?[jt]sx?$/, /^tests\//, /^scripts\//, /^functions\/(src\/index\.ts|scripts\/)/,
  /^public\//, /^audit\/tools\//, /^archive\//, /(^|\/)(vite|vitest|playwright)\.config\.ts$/, /^eslint\.config\.js$/,
  /^auth-hosting\//, /^price-scraper-server\//, /\.d\.ts$/, /^\.agents\//, /^\.github\//,
];
const isEntry = (p) => ENTRY.some((r) => r.test(p));

const rows = [['path', 'type', 'module', 'size', 'sha256', 'git_state', 'inbound_imports', 'outbound_imports', 'entry_point', 'review_method', 'audit_status']];
const counts = {};
for (const p of all) {
  const st = statSync(p);
  const buf = readFileSync(p);
  const t = loai(p);
  const inb = srcSet.has(p) ? inbound.get(p) : '';
  const outb = srcSet.has(p) ? outbound.get(p) ?? 0 : '';
  const entry = isEntry(p) ? 'YES' : (srcSet.has(p) ? 'NO' : '');
  let status = 'STATIC_ANALYZED';
  if (!srcSet.has(p)) status = t === 'ASSET' || t === 'BACKUP' ? 'INVENTORIED' : 'INVENTORIED';
  if (srcSet.has(p) && inb === 0 && entry === 'NO' && t === 'SOURCE') status = 'NEEDS_REVIEW'; // ORPHAN_CANDIDATE
  const method = srcSet.has(p) ? 'git+sha256+regex-import-graph+tsc+eslint' : 'git+sha256';
  rows.push([p, t, module_(p), st.size, createHash('sha256').update(buf).digest('hex'), tracked.includes(p) ? 'TRACKED' : 'UNTRACKED', inb, outb, entry, method, status]);
  counts[t] = (counts[t] || 0) + 1;
}
const csv = (r) => r.map((v) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',');
writeFileSync('audit/file-inventory.csv', rows.map(csv).join('\n') + '\n');

// Thư mục loại trừ: đếm gộp.
const ex = [['path', 'files', 'reason']];
for (const [d, why] of [['node_modules', 'DEPENDENCY — thư viện bên thứ ba (npm)'], ['functions/node_modules', 'DEPENDENCY'], ['dist', 'GENERATED — bản build Vite'], ['functions/lib', 'GENERATED — bản build Cloud Functions'], ['test-results', 'GENERATED — kết quả Playwright'], ['playwright-report', 'GENERATED'], ['.e2e-chrome-profile', 'GENERATED — hồ sơ trình duyệt e2e (có thể chứa phiên đăng nhập)']]) {
  if (!existsSync(d)) continue;
  let n = 0; try { n = Number(sh(`find ${d} -type f | wc -l`).trim()); } catch { /* bỏ qua */ }
  ex.push([d, n, why]);
}
writeFileSync('audit/excluded-summary.csv', ex.map(csv).join('\n') + '\n');

const orphans = rows.slice(1).filter((r) => r[10] === 'NEEDS_REVIEW').map((r) => r[0]);
writeFileSync('audit/orphan-candidates.txt', orphans.join('\n') + '\n');
console.log(JSON.stringify({ total: all.length, tracked: tracked.length, untracked: untracked.length, byType: counts, sourceFiles: srcFiles.length, orphanCandidates: orphans.length }, null, 2));
