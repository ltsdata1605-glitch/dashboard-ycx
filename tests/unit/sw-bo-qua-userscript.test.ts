import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

/**
 * 2026-11-14 (ảnh chủ dự án): bấm "Cài đặt Script ngay" chỉ hiện NGUYÊN VĂN file .user.js, không ra trang Cài đặt của
 * Tampermonkey. Đo bằng Playwright: trang do service worker của app điều khiển → lượt mở tab .user.js do service worker trả
 * lời (`response.fromServiceWorker() === true`) → tiện ích (bắt .user.js ở tầng mạng của trình duyệt) không thấy. Lượt kiểm
 * phiên bản (`fetch …user.js?t=…`) còn bị lưu thêm một bản vào cache mỗi lần.
 *
 * Chạy THẬT hàm xử lý `fetch` của scripts/sw-template.js trong môi trường giả: .user.js không được respondWith.
 */
function napServiceWorker() {
    const nghe: Record<string, (e: unknown) => void> = {};
    const src = readFileSync('scripts/sw-template.js', 'utf8')
        .replace("'__VERSION__'", "'test'").replace('__PRECACHE__', '[]').replace('__CORE__', '[]');
    const self = {
        location: { origin: 'https://ltsdata1605-glitch.github.io' },
        registration: { scope: 'https://ltsdata1605-glitch.github.io/dashboard-ycx/' },
        addEventListener: (ten: string, fn: (e: unknown) => void) => { nghe[ten] = fn; },
    };
    const treo = () => new Promise(() => {}); // không cần kết quả — chỉ đo có respondWith hay không
    vm.runInNewContext(src, { self, URL, Request: class {}, caches: { open: treo, match: treo }, fetch: treo, setTimeout, Promise });
    return (url: string, mode: string) => {
        let traLoi = false;
        nghe.fetch({ request: { url, method: 'GET', mode }, respondWith: () => { traLoi = true; }, waitUntil: () => {} });
        return traLoi;
    };
}

describe('service worker không trả lời file userscript', () => {
    const goi = napServiceWorker();
    const GOC = 'https://ltsdata1605-glitch.github.io/dashboard-ycx/';

    it('mở tab .user.js (nút "Cài đặt Script ngay") → để trình duyệt/Tampermonkey tự xử lý', () => {
        expect(goi(GOC + 'scripts/mwg-auto-thu-thap-diem-thuong.user.js', 'navigate')).toBe(false);
        expect(goi(GOC + 'scripts/tnb-pmh-auto-lay-ma.user.js', 'navigate')).toBe(false);
    });

    it('kiểm phiên bản (fetch …user.js?t=…) → luôn lấy mạng, không qua cache', () => {
        expect(goi(GOC + 'scripts/mwg-auto-thu-thap-diem-thuong.user.js?t=123', 'cors')).toBe(false);
    });

    it('vẫn giữ offline cho app: điều hướng trang và file tĩnh khác vẫn do service worker xử lý', () => {
        expect(goi(GOC + '?tab=thuong', 'navigate')).toBe(true);
        expect(goi(GOC + 'assets/index-abc.js', 'no-cors')).toBe(true);
        expect(goi(GOC + 'icons/apple-touch-icon-120.png', 'no-cors')).toBe(true);
    });
});
