#!/usr/bin/env node
/**
 * Gỡ khai báo top-level đã xác minh chết (Knip + grep toàn repo = 0 tham chiếu ngoài dòng khai báo). Dùng AST TypeScript để cắt
 * đúng câu lệnh (kèm JSDoc của nó), không đụng phần khác. Đầu vào: dòng "file<TAB>tên" từ stdin.
 */
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'node:fs';
const lines = readFileSync(0, 'utf8').trim().split('\n').map((l) => l.split('\t'));
const byFile = new Map();
for (const [f, n] of lines) { if (!byFile.has(f)) byFile.set(f, []); byFile.get(f).push(n); }
for (const [file, names] of byFile) {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const cuts = [];
  for (const st of sf.statements) {
    let ten = null;
    if ((ts.isFunctionDeclaration(st) || ts.isInterfaceDeclaration(st) || ts.isTypeAliasDeclaration(st) || ts.isClassDeclaration(st) || ts.isEnumDeclaration(st)) && st.name) ten = st.name.text;
    else if (ts.isVariableStatement(st) && st.declarationList.declarations.length === 1 && ts.isIdentifier(st.declarationList.declarations[0].name)) ten = st.declarationList.declarations[0].name.text;
    if (ten && names.includes(ten)) {
      let start = st.getStart(sf, true);
      // lùi về đầu dòng
      while (start > 0 && src[start - 1] !== '\n') start--;
      let end = st.getEnd();
      while (end < src.length && src[end] !== '\n') end++;
      end = Math.min(src.length, end + 1);
      cuts.push([start, end, ten]);
    }
  }
  const found = cuts.map((c) => c[2]);
  const missing = names.filter((n) => !found.includes(n));
  let out = src;
  for (const [s, e] of cuts.sort((a, b) => b[0] - a[0])) out = out.slice(0, s) + out.slice(e);
  out = out.replace(/\n{3,}/g, '\n\n');
  writeFileSync(file, out);
  console.log(`${file}: gỡ ${found.join(', ')}${missing.length ? ' | KHÔNG THẤY: ' + missing.join(', ') : ''}`);
}
