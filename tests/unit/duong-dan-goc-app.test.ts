import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 2026-11-14 (ảnh chủ dự án: "Cài đặt Script ngay" mở ltsdata1605-glitch.github.io/scripts/…user.js → 404).
 * App nay chạy dưới đường dẫn con `/dashboard-ycx/` (vite `base`). Vite tự thêm tiền tố cho url() trong CSS và cho index.html,
 * nhưng chuỗi viết trong code JS/TSX ('/scripts/…', src="/icons/…") thì KHÔNG → 404 trên github.io.
 * File trong public/ phải gọi qua `${import.meta.env.BASE_URL}<đường dẫn>`.
 */
const PUBLIC = readdirSync('public');
const THU_MUC_CODE = ['components', 'features', 'services', 'hooks', 'utils', 'contexts', 'constants'];
const FILE_GOC = ['App.tsx', 'index.tsx'];

/** Đã biết, CHỜ SỬA riêng — chỉ được GỠ khỏi danh sách, không thêm. Nền phiếu In Sticker: chuỗi '/frame/…' vừa là mã định danh
 *  (so sánh, lưu trong lịch sử in) vừa là URL ảnh → phải đổi ở chỗ VẼ (url(...)) chứ không đổi hằng. */
const DA_BIET = new Set([
    'features/sticker-event/hooks/useStickerPrinterData.ts',
    'features/sticker-event/stickerprinter/stickerPreviewStyles.ts',
    'features/sticker-event/stickerprinter/stickerBackgroundHelpers.ts',
    'features/sticker-event/stickerprinter/StickerPrintControls.tsx',
]);

function liet(dir: string): string[] {
    return readdirSync(dir).flatMap((ten) => {
        const p = join(dir, ten);
        if (statSync(p).isDirectory()) return ten === 'node_modules' ? [] : liet(p);
        return /\.(ts|tsx)$/.test(ten) && !/\.test\.tsx?$/.test(ten) ? [p] : [];
    });
}

describe('file trong public/ không gọi theo đường dẫn gốc "/"', () => {
    const tenPublic = PUBLIC.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    // Chuỗi '/x…' "/x…" `/x…` với x là một mục trong public/ (vd '/scripts/…', "/icons/…", '/huong-dan-bot-line.html')
    const MAU = new RegExp(`(['"\`])/(?:${tenPublic})(?:[/'"\`?#])`);

    it('quét code app', () => {
        const vi: string[] = [];
        for (const f of [...THU_MUC_CODE.flatMap(liet), ...FILE_GOC]) {
            const dong = readFileSync(f, 'utf8').split('\n');
            dong.forEach((d, i) => {
                if (/^\s*(\/\/|\*)/.test(d)) return; // chú thích
                if (MAU.test(d) && !DA_BIET.has(f)) vi.push(`${f}:${i + 1}: ${d.trim().slice(0, 120)}`);
            });
        }
        expect(vi, 'Dùng `${import.meta.env.BASE_URL}<đường dẫn>` thay vì "/<đường dẫn>"').toEqual([]);
    });

    it('danh sách đã biết vẫn còn đúng (sửa xong thì gỡ khỏi DA_BIET)', () => {
        for (const f of DA_BIET) expect(MAU.test(readFileSync(f, 'utf8')), f).toBe(true);
    });
});

describe('userscript chạy được trên Dashboard ở github.io và tự cập nhật từ đó', () => {
    for (const ten of ['mwg-auto-thu-thap-diem-thuong.user.js', 'tnb-pmh-auto-lay-ma.user.js']) {
        const src = readFileSync(join('public/scripts', ten), 'utf8');
        const dau = src.slice(0, src.indexOf('// ==/UserScript=='));
        it(ten, () => {
            const url = `https://ltsdata1605-glitch.github.io/dashboard-ycx/scripts/${ten}`;
            expect(dau).toContain(`// @updateURL    ${url}`);
            expect(dau).toContain(`// @downloadURL  ${url}`);
            expect(dau).not.toMatch(/@(update|download)URL\s+https:\/\/dashboard\.pro\.vn/);
        });
    }
    it('script lấy điểm thưởng nạp trên trang Dashboard github.io (thiếu là Dashboard báo "chưa cài")', () => {
        const src = readFileSync('public/scripts/mwg-auto-thu-thap-diem-thuong.user.js', 'utf8');
        expect(src).toContain('// @match        https://ltsdata1605-glitch.github.io/dashboard-ycx/*');
    });
});
