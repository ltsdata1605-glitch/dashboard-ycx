import { describe, expect, it } from 'vitest';
import React from 'react';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from './Button';

const h = React.createElement;
const lop = (html: string) => (html.match(/class="([^"]*)"/) || ['', ''])[1].split(/\s+/);

/**
 * Kiểu nút theo VAI TRÒ (2026-10-29, chủ dự án "xử lý hết" 268 nút tự vẽ). Trước đó mọi phần tử bấm được không mang hình nút đều là
 * `variant="unstyled"` — không biết vai trò, mỗi nơi tự chép con trỏ/chuyển màu. Nay: cell / row / card / tab (không ép cỡ), toggle
 * (bật = aria-pressed), warning (amber đặc), cỡ icon-inline / xs / icon-xs.
 */
describe('Button — kiểu theo vai trò', () => {
    it('cell/row/card/tab không ép cỡ và KHÔNG gắn data-ui="shared" (chế độ mật độ gọn Report BI vẫn co nội dung bên trong)', () => {
        for (const variant of ['cell', 'row', 'card', 'tab'] as const) {
            const html = renderToStaticMarkup(h(Button, { variant, size: 'md' }, 'x'));
            expect(html, variant).not.toContain('data-ui="shared"');
            expect(lop(html).some(c => c.startsWith('h-[var(--btn-height')), variant).toBe(false);
            expect(lop(html).some(c => /^px-/.test(c)), variant).toBe(false);
        }
    });

    it('row rộng hết, căn trái; card có vòng sáng khi đang chọn', () => {
        expect(lop(renderToStaticMarkup(h(Button, { variant: 'row' }, 'x')))).toEqual(expect.arrayContaining(['flex', 'w-full', 'text-left']));
        expect(lop(renderToStaticMarkup(h(Button, { variant: 'card' }, 'x')))).toContain('aria-pressed:ring-2');
    });

    it('toggle: trạng thái bật theo aria-pressed, màu bật theo nghĩa đè bằng lớp aria-pressed:* của nơi gọi', () => {
        const html = renderToStaticMarkup(h(Button, { variant: 'toggle', size: 'xs', 'aria-pressed': true, className: 'aria-pressed:bg-emerald-600' }, 'x'));
        expect(html).toContain('aria-pressed="true"');
        expect(lop(html)).toEqual(expect.arrayContaining(['bg-white', 'border-slate-200', 'aria-pressed:bg-emerald-600']));
        expect(html).toContain('data-ui="shared"');
    });

    it('icon-inline: không viền (biến thể ghost có viền 1px trong suốt — làm icon trong dòng chữ nở 2px), có vùng chạm ycx-hit', () => {
        const c = lop(renderToStaticMarkup(h(Button, { variant: 'ghost', size: 'icon-inline' }, 'x')));
        expect(c).toEqual(expect.arrayContaining(['border-0', 'ycx-hit', 'p-0.5']));
        expect(c).not.toContain('border');
    });

    it('xs / icon-xs đọc token 24px', () => {
        expect(lop(renderToStaticMarkup(h(Button, { variant: 'secondary', size: 'xs' }, 'x')))).toContain('h-[var(--btn-height-xs)]');
        expect(lop(renderToStaticMarkup(h(Button, { variant: 'ghost', size: 'icon-xs' }, 'x')))).toContain('h-[var(--btn-height-icon-xs)]');
    });
});

describe('không còn nút tự vẽ (variant="unstyled")', () => {
    it('cả app 0 chỗ — dùng biến thể chuẩn hoặc kiểu vai trò (cell/row/card/tab)', () => {
        const ROOT = resolve(__dirname, '../../..');
        const out: string[] = [];
        const quet = (p: string) => {
            if (statSync(p).isFile()) {
                if (p.endsWith('.tsx') && !p.endsWith('.test.tsx') && readFileSync(p, 'utf8').includes('variant="unstyled"')) out.push(relative(ROOT, p));
                return;
            }
            for (const t of readdirSync(p)) if (t !== 'node_modules' && !t.startsWith('.')) quet(join(p, t));
        };
        ['components', 'features'].forEach(d => quet(join(ROOT, d)));
        quet(join(ROOT, 'App.tsx'));
        expect(out).toEqual([]);
    });
});
