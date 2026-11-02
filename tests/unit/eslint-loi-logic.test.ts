import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

/**
 * 2026-10-28 (AUD-018): `else if` có điều kiện TRÙNG HỆT nhánh trên làm nhánh lưu mốc "đã áp dữ liệu Kho" không bao giờ chạy →
 * dữ liệu Kho bị xử lý lại mỗi 3 phút. Lint bằng ĐÚNG eslint.config.js của dự án (không khai lại luật ở đây) ở gốc lẫn features/*.
 */
const eslint = new ESLint({ cwd: process.cwd() });
const CHO = ['hooks/__thu__.ts', 'services/__thu__.ts', 'features/bi-dashboard/__thu__.ts', 'features/sticker-event/__thu__.tsx'];
const loi = async (code: string, filePath: string, rule: string) => {
    const [r] = await eslint.lintText(code, { filePath });
    return r.messages.filter((m) => m.ruleId === rule).map((m) => m.severity);
};

describe('ESLint chặn lỗi logic máy bắt chắc chắn', () => {
    it('else-if trùng điều kiện (đúng dạng lỗi AUD-018) là LỖI ở mọi khu vực', async () => {
        const code = 'export function f(n: number, a: string, b: string, moi: boolean) {\n  if (n > 0 && a !== b && !moi) { return 1; }\n  else if (n > 0 && a !== b && !moi) { return 2; }\n  return 0;\n}\n';
        for (const f of CHO) expect(await loi(code, f, 'no-dupe-else-if'), f).toEqual([2]);
    }, 30_000);
    it('so sánh với chính nó, case trùng, khoá trùng cũng là LỖI', async () => {
        const f = 'services/__thu__.ts';
        expect(await loi('export const x = (a: number) => a === a;\n', f, 'no-self-compare')).toEqual([2]);
        expect(await loi('export const x = (a: number) => { switch (a) { case 1: return 1; case 1: return 2; } return 0; };\n', f, 'no-duplicate-case')).toEqual([2]);
        expect(await loi('export const x = { a: 1, a: 2 };\n', f, 'no-dupe-keys')).toEqual([2]);
    }, 30_000);
    it('không bắt nhầm else-if khác điều kiện', async () => {
        const code = 'export function f(a: boolean, b: boolean) { if (a && !b) { return 1; } else if (a && b) { return 2; } return 0; }\n';
        expect(await loi(code, 'hooks/__thu__.ts', 'no-dupe-else-if')).toEqual([]);
    }, 30_000);
});
