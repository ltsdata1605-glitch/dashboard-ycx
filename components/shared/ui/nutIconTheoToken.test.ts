import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

/**
 * Nút icon theo MỘT token (2026-10-28, chủ dự án chốt "nút icon laptop 36px"). `--btn-height-icon` (styles/tokens.css) = 32 iPhone /
 * 36 laptop; `<Button size="icon">` đọc token. Trước đó 32 nút tự vẽ cứng `h-8 w-8` → laptop đứng cạnh nút "⋯" 36px lệch 4px
 * (vd Bot LINE › Kho mã). Test đỏ khi một `<Button>` vuông 32 cứng (`h-8` + `w-8`) mà không có mốc laptop đọc token.
 */
const ROOT = resolve(__dirname, '../../..');
function quet(p: string, out: string[]) {
    if (statSync(p).isFile()) { if (p.endsWith('.tsx') && !p.endsWith('.test.tsx')) out.push(p); return; }
    for (const ten of readdirSync(p)) { if (ten !== 'node_modules' && !ten.startsWith('.')) quet(join(p, ten), out); }
}

describe('nút icon theo token --btn-height-icon', () => {
    it('không còn <Button> vuông 32px cứng trên laptop', () => {
        const files: string[] = [];
        ['components', 'features'].forEach((d) => quet(join(ROOT, d), files));
        const viPham: string[] = [];
        for (const f of files) {
            const s = readFileSync(f, 'utf8');
            if (!s.includes('<Button')) continue;
            const sf = ts.createSourceFile(f, s, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
            const visit = (n: ts.Node) => {
                if ((ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) && n.tagName.getText(sf) === 'Button') {
                    for (const a of n.attributes.properties) {
                        if (!ts.isJsxAttribute(a) || a.name.getText(sf) !== 'className' || !a.initializer) continue;
                        const cls = a.initializer.getText(sf);
                        const vuong32 = /\bh-8\b/.test(cls) && /\bw-8\b/.test(cls);
                        const coMocLaptop = /lg:(h|w|min-h|min-w)-9|lg:h-\[var\(--btn-height-icon\)\]/.test(cls);
                        if (vuong32 && !coMocLaptop) viPham.push(`${relative(ROOT, f)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`);
                    }
                }
                ts.forEachChild(n, visit);
            };
            visit(sf);
        }
        expect(viPham, 'Dùng size="icon" hoặc h-[var(--btn-height-icon)] w-[var(--btn-height-icon)]').toEqual([]);
    });
});
