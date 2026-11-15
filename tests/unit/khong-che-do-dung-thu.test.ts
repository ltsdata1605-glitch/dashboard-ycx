import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 2026-11-15 (chủ dự án): "Xoá bỏ chế độ dùng thử". Bản người dùng không còn nút/chữ "dùng thử" nào; trước đó bản build vẫn lộ băng
 * "Đang ở chế độ dùng thử" + nút "Thoát chế độ dùng thử" ở Cài đặt khi mở app bằng phiên đã lưu mà chưa nhận lại tài khoản, tên
 * "Tài khoản Thử nghiệm" ở sheet Khác, toast "(Demo)". Bộ test vào app qua LỐI VÀO KIỂM THỬ chỉ có trên dev server
 * (`import.meta.env.DEV` — Vite thay bằng false khi build nên nhánh biến mất khỏi bản người dùng).
 * Đã đo trên bản build (vite preview): đặt cờ cũ 'ycx_demo_mode' vẫn chỉ thấy màn đăng nhập, không có `__ycxVaoLoiKiemThu`.
 */
const THU_MUC = ['components', 'features', 'contexts', 'hooks', 'services', 'utils', 'constants'];
const liet = (dir: string): string[] => readdirSync(dir).flatMap((ten) => {
    const p = join(dir, ten);
    if (statSync(p).isDirectory()) return ten === 'node_modules' ? [] : liet(p);
    return /\.tsx?$/.test(ten) && !/\.test\.tsx?$/.test(ten) ? [p] : [];
});
const FILE = [...THU_MUC.flatMap(liet), 'App.tsx', 'index.tsx'];
const laChuThich = (d: string) => /^\s*(\/\/|\*|\/\*|\{\/\*)/.test(d);

describe('Chế độ Dùng Thử đã xoá khỏi app', () => {
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

    it('lối vào kiểm thử chỉ có trên dev server (AuthContext, syncService)', () => {
        const auth = readFileSync('contexts/AuthContext.tsx', 'utf8');
        expect(auth).toMatch(/const isDemoMode = import\.meta\.env\.DEV && isDemoModeRaw;/);
        expect(auth).toMatch(/if \(!import\.meta\.env\.DEV\) return;[\s\S]{0,400}__ycxVaoLoiKiemThu = /);
        expect(readFileSync('services/syncService.ts', 'utf8')).toMatch(/const isDemoModeActive = \(\): boolean =>\s*import\.meta\.env\.DEV &&/);
        expect(() => readFileSync('utils/demoMode.ts')).toThrow(); // bỏ hẳn tiện ích cũ
    });

    it('màn đăng nhập không còn nút vào app không đăng nhập', () => {
        const login = readFileSync('components/views/LoginView.tsx', 'utf8');
        expect(login).not.toMatch(/setDemoMode|aria-label="Kích hoạt/);
    });

    it('nhánh riêng của lối kiểm thử (dữ liệu giả, toast) luôn kèm import.meta.env.DEV — bản build tự bỏ', () => {
        const vi = FILE.flatMap((f) => readFileSync(f, 'utf8').split('\n')
            .map((d, i) => ({ d, i }))
            .filter(({ d }) => /\bif \(isDemoMode\)/.test(d))
            .map(({ d, i }) => `${f}:${i + 1}: ${d.trim()}`));
        expect(vi).toEqual([]);
    });
});
