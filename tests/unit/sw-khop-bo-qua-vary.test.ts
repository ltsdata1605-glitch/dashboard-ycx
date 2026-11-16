import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/**
 * 2026-11-16: tests/e2e/offline-app-shell.spec.ts đỏ — mất mạng tải lại trang chỉ còn màn chờ. Đo: Chromium gửi kèm
 * `origin` cho mọi yêu cầu `crossorigin` (script module, CSS, phông — Vite gắn `crossorigin` cho tất cả), bản lưu do service
 * worker tự tải (`cache.add(url)`) không có header nào, máy chủ trả `Vary: Origin` → `cache.match` coi là KHÁC NHAU → trượt
 * cache ở mọi file /assets/ → offline hỏng. Bài e2e cần bản build nên không chạy trên CI; bài này chạy THẬT hàm xử lý `fetch`
 * của scripts/sw-template.js với một Cache giả làm đúng luật Vary của trình duyệt (khớp header theo Vary trừ khi `ignoreVary`).
 */
const GOC = 'https://ltsdata1605-glitch.github.io/report/';

type YeuCau = { url: string; method: string; mode: string; headers: { get: (k: string) => string | null } };
type PhanHoi = { vary: string; body: string };

const yeuCau = (url: string, mode: string, headers: Record<string, string> = {}): YeuCau => ({
    url, method: 'GET', mode, headers: { get: (k) => headers[k.toLowerCase()] ?? null },
});

/** Cache giả: luật khớp như Cache API — cùng URL, và mọi header trong Vary của phản hồi phải bằng nhau, trừ khi ignoreVary. */
function taoCache(muc: Array<{ url: string; res: PhanHoi }>) {
    const header = (r: string | YeuCau, k: string) => (typeof r === 'string' ? null : r.headers.get(k));
    return {
        match: async (r: string | YeuCau, opts?: { ignoreVary?: boolean }) => {
            const url = typeof r === 'string' ? r : r.url;
            const m = muc.find((x) => x.url === url);
            if (!m) return undefined;
            if (!opts?.ignoreVary) {
                const truong = m.res.vary.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
                // Bản lưu do service worker tự tải (`cache.add(url)`) không mang header nào.
                if (truong.some((k) => header(r, k) !== null)) return undefined;
            }
            return m.res;
        },
        put: async () => {},
        add: async () => {},
        keys: async () => [],
    };
}

function napServiceWorker(cache: ReturnType<typeof taoCache>) {
    const nghe: Record<string, (e: unknown) => void> = {};
    const src = readFileSync('scripts/sw-template.js', 'utf8')
        .replace("'__VERSION__'", "'test'").replace('__PRECACHE__', '[]').replace('__CORE__', '[]');
    const goiMang: string[] = [];
    const self = {
        location: { origin: new URL(GOC).origin },
        registration: { scope: GOC },
        addEventListener: (ten: string, fn: (e: unknown) => void) => { nghe[ten] = fn; },
    };
    // Mất mạng: mọi lượt fetch hỏng ngay. Không hẹn giờ thật (nhánh điều hướng chờ mạng tối đa 4 s).
    const fetch = (r: YeuCau) => { goiMang.push(r.url); return Promise.reject(new TypeError('Failed to fetch')); };
    vm.runInNewContext(src, {
        self, URL, Request: class {}, fetch, setTimeout: () => 0, Promise,
        caches: { open: async () => cache, match: cache.match, keys: async () => [], delete: async () => true },
    });
    const goi = async (req: YeuCau): Promise<unknown> => {
        let traLoi: Promise<unknown> | null = null;
        nghe.fetch({ request: req, respondWith: (p: Promise<unknown>) => { traLoi = p; }, waitUntil: () => {} });
        if (!traLoi) throw new Error('service worker không trả lời yêu cầu này');
        return traLoi;
    };
    return { goi, goiMang };
}

describe('service worker: tra cache bỏ qua Vary (mất mạng vẫn mở được app khi máy chủ gửi Vary: Origin)', () => {
    const JS = `${GOC}assets/index-abc.js`;
    const CSS = `${GOC}assets/index-abc.css`;
    const PHONG = `${GOC}fonts/UTM%20AvoBold.ttf`;
    const cache = taoCache([
        { url: GOC, res: { vary: 'Origin', body: 'app-shell' } },
        { url: JS, res: { vary: 'Origin', body: 'js' } },
        { url: CSS, res: { vary: 'Origin', body: 'css' } },
        { url: PHONG, res: { vary: 'Origin', body: 'font' } },
    ]);
    // Header Chromium gửi cho <script type="module" crossorigin> / <link rel="stylesheet" crossorigin> cùng origin (đo 16/11).
    const ORIGIN = { origin: new URL(GOC).origin };

    it('Cache giả làm đúng luật Vary: tra KHÔNG ignoreVary với header origin thì trượt (đúng lỗi đã gặp)', async () => {
        expect(await cache.match(yeuCau(JS, 'cors', ORIGIN))).toBeUndefined();
        expect(await cache.match(yeuCau(JS, 'cors', ORIGIN), { ignoreVary: true })).toBeTruthy();
    });

    it('script module / CSS / phông có header origin → trả bản lưu, không gọi mạng', async () => {
        const { goi, goiMang } = napServiceWorker(cache);
        expect(await goi(yeuCau(JS, 'cors', ORIGIN))).toMatchObject({ body: 'js' });
        expect(await goi(yeuCau(CSS, 'cors', ORIGIN))).toMatchObject({ body: 'css' });
        expect(await goi(yeuCau(PHONG, 'cors', ORIGIN))).toMatchObject({ body: 'font' });
        expect(goiMang).toEqual([]);
    });

    it('điều hướng (tải lại / đường dẫn SPA khác) lúc mất mạng → app shell đã lưu', async () => {
        const { goi } = napServiceWorker(cache);
        expect(await goi(yeuCau(GOC, 'navigate'))).toMatchObject({ body: 'app-shell' });
        expect(await goi(yeuCau(`${GOC}?tab=tools-line-bot`, 'navigate'))).toMatchObject({ body: 'app-shell' });
    });
});
