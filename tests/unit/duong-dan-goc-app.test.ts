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

/** Đã biết, CHỜ SỬA riêng — chỉ được GỠ khỏi danh sách, không thêm. (Nền phiếu In Sticker đã sửa 2026-11-14 → rỗng.) */
const DA_BIET = new Set<string>([]);

/** Nền phiếu In Sticker: '/frame/…' là MÃ ĐỊNH DANH (so sánh, lưu trong lịch sử in — đổi giá trị là lịch sử cũ lệch), URL vẽ đi
 *  qua `bgImageUrl()`. Chỉ miễn ĐÚNG dòng khai báo hằng `export const X_BG = '/frame/….png';` ở đúng 1 file — không miễn cả file:
 *  thêm chuỗi '/frame/…' ở dòng khác (kể cả trong file này) vẫn đỏ. Chỗ vẽ được khoá ở bài "nền phiếu vẽ qua bgImageUrl" dưới. */
const FILE_MA_NEN = 'features/sticker-event/stickerprinter/stickerBackgroundHelpers.ts';
const DONG_MA_NEN = /^export const [A-Z_]+_BG = '\/frame\/[\w.-]+\.png';$/;
const laDongMaNen = (f: string, d: string) => f === FILE_MA_NEN && DONG_MA_NEN.test(d.trim());

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
                if (MAU.test(d) && !DA_BIET.has(f) && !laDongMaNen(f, d)) vi.push(`${f}:${i + 1}: ${d.trim().slice(0, 120)}`);
            });
        }
        expect(vi, 'Dùng `${import.meta.env.BASE_URL}<đường dẫn>` thay vì "/<đường dẫn>"').toEqual([]);
    });

    it('danh sách đã biết vẫn còn đúng (sửa xong thì gỡ khỏi DA_BIET)', () => {
        for (const f of DA_BIET) expect(MAU.test(readFileSync(f, 'utf8')), f).toBe(true);
    });

    it('mã nền In Sticker: dòng được miễn đúng là khai báo hằng, và file có bgImageUrl', () => {
        const src = readFileSync(FILE_MA_NEN, 'utf8');
        const dongMa = src.split('\n').filter((d) => MAU.test(d) && !/^\s*(\/\/|\*)/.test(d));
        expect(dongMa.length).toBeGreaterThan(0);
        for (const d of dongMa) expect(DONG_MA_NEN.test(d.trim()), d).toBe(true);
        expect(src).toMatch(/export const bgImageUrl\b/);
    });

    it('nền phiếu In Sticker vẽ qua bgImageUrl (url(...) không nhận thẳng mã nền)', () => {
        // url('${bgImage}') / url(${effectiveBgImage}) … — mọi nội suy biến nền trong url( phải bắt đầu bằng bgImageUrl(
        const THO = /url\(['"]?\$\{(?!bgImageUrl\()[^}]*bg[_]?image/i;
        const vi: string[] = [];
        for (const f of liet('features/sticker-event')) {
            readFileSync(f, 'utf8').split('\n').forEach((d, i) => {
                if (THO.test(d)) vi.push(`${f}:${i + 1}: ${d.trim().slice(0, 120)}`);
            });
        }
        expect(vi, 'Bọc bằng bgImageUrl(…) — mã nền "/frame/…" không có tiền tố vite base').toEqual([]);
        // còn đúng các chỗ vẽ đã biết (bài trên không trống rỗng vì đổi tên biến)
        const coBoc = liet('features/sticker-event').filter((f) => /url\(['"]?\$\{bgImageUrl\(/.test(readFileSync(f, 'utf8')));
        expect(coBoc.sort()).toEqual([
            'features/sticker-event/stickerprinter/StickerPrintPreview.tsx',
            'features/sticker-event/stickerprinter/excelParsers.ts',
            'features/sticker-event/stickerprinter/pageHtmlUtils.ts',
            'features/sticker-event/stickerprinter/stickerPreviewStyles.ts',
        ]);
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
