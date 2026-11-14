import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * 2026-11-14 (video chủ dự án: bấm "Tiếp tục với Google" trên máy tính → chọn tài khoản → về trang pwa-login.html lại hiện
 * nút "Tiếp tục với Google" → lặp vòng mãi). Nguyên nhân: authDomain đổi sang dashboa-7e20b.firebaseapp.com nhưng trang
 * pwa-login.html lại để ở dashboa-7e20b.web.app. Trang /__/auth/handler để kết quả Google trong sessionStorage của origin
 * authDomain; pwa-login.html ở origin khác thì không đọc được → không bao giờ đăng nhập xong.
 *
 * Khoá bất biến: trang đăng nhập phụ LUÔN cùng origin với authDomain, ở cả app lẫn chính trang đó.
 */
const firebaseTs = readFileSync('services/firebase.ts', 'utf8');
const pwaLogin = readFileSync('auth-hosting/pwa-login.html', 'utf8');
const authDomain = firebaseTs.match(/authDomain:\s*"([^"]+)"/)![1];

describe('trang pwa-login.html cùng origin với authDomain', () => {
    it('app dựng URL trang đăng nhập phụ TỪ authDomain (không chép cứng tên miền khác)', () => {
        expect(firebaseTs).toMatch(/PWA_LOGIN_URL\s*=\s*`https:\/\/\$\{firebaseConfig\.authDomain\}\/pwa-login\.html`/);
        expect(firebaseTs).not.toMatch(/['"`]https:\/\/[a-z0-9.-]+\/pwa-login\.html/);
    });

    it('trang pwa-login.html dùng đúng authDomain của app', () => {
        const host = pwaLogin.match(/const AUTH_HOST = '([^']+)'/)![1];
        expect(host).toBe(authDomain);
        expect(pwaLogin).toContain('authDomain: AUTH_HOST');
    });

    it('mở nhầm ở web.app (bản app cũ còn trong bộ nhớ đệm) thì tự chuyển sang origin authDomain', () => {
        expect(authDomain).toBe('dashboa-7e20b.firebaseapp.com');
        expect(pwaLogin).toMatch(/location\.hostname === 'dashboa-7e20b\.web\.app'/);
        expect(pwaLogin).toMatch(/location\.replace\('https:\/\/' \+ AUTH_HOST \+ location\.pathname \+ location\.search \+ location\.hash\)/);
        expect(pwaLogin).toMatch(/if \(!SAI_ORIGIN\) main\(\);/);
    });

    it('đăng nhập xong được quay về app ở github.io', () => {
        expect(pwaLogin).toContain("u.hostname === 'ltsdata1605-glitch.github.io'");
    });
});
