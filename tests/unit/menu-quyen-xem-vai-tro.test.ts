import { describe, expect, it } from 'vitest';
import { coQuyenXem } from '../../services/menuConfigService';

/** Phân quyền XEM chức năng theo vai trò (2026-10-30): quản trị hệ thống luôn xem; thiếu khoá = ai cũng xem. */
describe('coQuyenXem — quyền xem chức năng theo vai trò', () => {
    const quyen = { 'tools-phanca': ['manager'] as const, 'reports': [] as const };
    it('chưa đặt quyền → mọi vai trò đều xem được', () => {
        expect(coQuyenXem(undefined, 'analysis', 'employee')).toBe(true);
        expect(coQuyenXem({}, 'analysis', null)).toBe(true);
    });
    it('quản trị hệ thống luôn xem được, kể cả khi bị khoá hết', () => {
        expect(coQuyenXem(quyen as never, 'reports', 'admin')).toBe(true);
    });
    it('chỉ các vai trò được chọn mới xem', () => {
        expect(coQuyenXem(quyen as never, 'tools-phanca', 'manager')).toBe(true);
        expect(coQuyenXem(quyen as never, 'tools-phanca', 'employee')).toBe(false);
    });
    it('danh sách rỗng: chỉ quản trị hệ thống xem; vai trò chưa xác định không xem', () => {
        expect(coQuyenXem(quyen as never, 'reports', 'manager')).toBe(false);
        expect(coQuyenXem(quyen as never, 'tools-phanca', null)).toBe(false);
    });
});
