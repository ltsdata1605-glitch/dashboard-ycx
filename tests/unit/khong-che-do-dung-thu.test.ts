import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 2026-11-18 (chủ dự án): "Xoá bỏ hoàn toàn chức năng dùng thử và bảo mật tuyệt đối".
 * isDemoMode, setDemoMode, __ycxVaoLoiKiemThu, 'ycx_demo_mode' — tất cả đã bị XOÁ SẠCH khỏi production code.
 * Chỉ người được cấp quyền (đăng nhập Firebase Auth + resolveSession) mới vào được app.
 */
const THU_MUC = ['components', 'features', 'contexts', 'hooks', 'services', 'utils', 'constants'];
const liet = (dir: string): string[] => readdirSync(dir).flatMap((ten) => {
    const p = join(dir, ten);
    if (statSync(p).isDirectory()) return ten === 'node_modules' ? [] : liet(p);
    return /\.tsx?$/.test(ten) && !/\.test\.tsx?$/.test(ten) ? [p] : [];
});
const FILE = [...THU_MUC.flatMap(liet), 'App.tsx', 'index.tsx'];
const laChuThich = (d: string) => /^\s*(\/\/|\*|\/\*|\{\/\*)/.test(d);

describe('Chế độ Dùng Thử đã xoá HOÀN TOÀN khỏi app', () => {
    it('không còn chữ "dùng thử" / "(Demo)" / "Tài khoản Thử nghiệm" trong code app (ngoài chú thích)', () => {
        const vi: string[] = [];
        for (const f of FILE) {
            readFileSync(f, 'utf8').split('\n').forEach((d, i) => {
                if (laChuThich(d)) return;
                if (/dùng thử|\(Demo\)|Demo Mode|Tài khoản Thử nghiệm|Kích hoạt Chế độ Dùng/i.test(d)) vi.push(`${f}:${i + 1}: ${d.trim().slice(0, 100)}`);
            });
        }
        expect(vi).toEqual([]);
    });

    it('không còn isDemoMode / setDemoMode / __ycxVaoLoiKiemThu / ycx_demo_mode trong code app (ngoài chú thích)', () => {
        const vi: string[] = [];
        for (const f of FILE) {
            readFileSync(f, 'utf8').split('\n').forEach((d, i) => {
                if (laChuThich(d)) return;
                if (/isDemoMode|setDemoMode|__ycxVaoLoiKiemThu|ycx_demo_mode|isDemoModeRaw|isDemoModeActive/.test(d)) {
                    vi.push(`${f}:${i + 1}: ${d.trim().slice(0, 120)}`);
                }
            });
        }
        expect(vi).toEqual([]);
    });

    it('AuthContext không còn interface isDemoMode/setDemoMode', () => {
        const auth = readFileSync('contexts/AuthContext.tsx', 'utf8');
        expect(auth).not.toMatch(/isDemoMode/);
        expect(auth).not.toMatch(/setDemoMode/);
        expect(auth).not.toMatch(/__ycxVaoLoiKiemThu/);
        expect(auth).not.toMatch(/ycx_demo_mode/);
    });

    it('utils/demoMode.ts đã bị xoá', () => {
        expect(() => readFileSync('utils/demoMode.ts')).toThrow();
    });

    it('màn đăng nhập không còn nút vào app không đăng nhập', () => {
        const login = readFileSync('components/views/LoginView.tsx', 'utf8');
        expect(login).not.toMatch(/setDemoMode|aria-label="Kích hoạt/);
    });

    it('App.tsx kiểm tra user trước khi hiển thị — không có đường nào bypass auth', () => {
        const app = readFileSync('App.tsx', 'utf8');
        expect(app).not.toMatch(/isDemoMode/);
        expect(app).toMatch(/if \(!user && !hasCachedSession\)/);
    });
});
