import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GlassSurface } from './GlassSurface';

/**
 * Khoá "Liquid Glass MỘT nguồn" (Apple Design System V2, 2026-10-28). Trước đó công thức kính bị chép tay ở 5 nơi, mỗi nơi một
 * số (rgba 0.75/0.9/0.95, blur 20/24px, bóng 16/24/32/48px): `.ycx-floating-dock` + 2 khối capsule thanh trên trong styles.css,
 * `CapsuleBar`, `GlobalAutoSyncDock`, `MobileBottomNav`. Nay mọi lớp kính đi qua token --glass-* (styles/tokens.css) và lớp
 * `.ycx-glass` / `<GlassSurface>`. Test đỏ khi ai đó lại chép "vệt phản chiếu" inset trắng hay khôi phục lớp dock cũ.
 */
const ROOT = resolve(__dirname, '../../..');
const QUET = ['components', 'features', 'App.tsx'];
// Kính tự chế = trên CÙNG một dòng có cả làm mờ nền lẫn vệt phản chiếu inset trắng (nút gradient chỉ có vệt inset thì không tính).
const MAU_KINH = /^(?=.*backdrop-blur)(?=.*inset_0_1px_1px_rgba\(255,\s*255,\s*255).*$/m;
const MAU_DOCK_CU = /ycx-floating-dock/;

function quet(p: string, out: string[]) {
    if (statSync(p).isFile()) { if (/\.tsx?$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p); return; }
    for (const ten of readdirSync(p)) {
        if (ten === 'node_modules' || ten.startsWith('.')) continue;
        quet(join(p, ten), out);
    }
}

describe('Liquid Glass một nguồn', () => {
    it('không chép tay công thức kính trong component (dùng <GlassSurface> / .ycx-glass)', () => {
        const files: string[] = [];
        QUET.forEach((d) => { try { quet(join(ROOT, d), files); } catch { /* không có */ } });
        const viPham = files
            .map((f) => relative(ROOT, f).replace(/\\/g, '/'))
            .filter((rel) => { const s = readFileSync(join(ROOT, rel), 'utf8'); return MAU_KINH.test(s) || MAU_DOCK_CU.test(s); });
        expect(viPham, 'Dùng <GlassSurface> từ components/shared/ui/GlassSurface').toEqual([]);
    });

    it('styles.css không còn số kính viết cứng — chỉ token --glass-*', () => {
        const css = readFileSync(join(ROOT, 'styles.css'), 'utf8');
        expect(css).not.toMatch(/\.ycx-floating-dock\s*\{/);
        expect(css).not.toMatch(/rgba\(255,\s*255,\s*255,\s*0\.75\)/);
        const tokens = readFileSync(join(ROOT, 'styles/tokens.css'), 'utf8');
        for (const t of ['--glass-bg:', '--glass-filter:', '--glass-border:', '--glass-highlight:', '--glass-shadow:', '--glass-fallback-bg:']) {
            expect(tokens, t).toContain(t);
        }
        // Đường lùi phải nằm NGOÀI @layer (tokens.css) — trong layer thì :root của tokens.css thắng và đường lùi vô tác dụng.
        expect(tokens).toMatch(/prefers-reduced-transparency:\s*reduce\)\s*\{\s*:root\s*\{[^}]*--glass-filter:\s*none/);
        expect(tokens).toMatch(/prefers-contrast:\s*more\)\s*\{\s*:root/);
    });

    it('GlassSurface gắn đúng lớp/thuộc tính theo hình dạng', () => {
        const h = React.createElement;
        const html = renderToStaticMarkup(h(GlassSurface, { as: 'nav', shape: 'circle', elevation: 'sm', tone: 'strong', 'aria-label': 'x' }, 'a'));
        expect(html).toMatch(/^<nav /);
        expect(html).toContain('ycx-glass');
        expect(html).toContain('rounded-full');
        expect(html).toContain('data-glass="circle"');
        expect(html).toContain('data-glass-elevation="sm"');
        expect(html).toContain('data-glass-tone="strong"');
        expect(renderToStaticMarkup(h(GlassSurface, { shape: 'panel' }))).toContain('rounded-card');
    });
});
