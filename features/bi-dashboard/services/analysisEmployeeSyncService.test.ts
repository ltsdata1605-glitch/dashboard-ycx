import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/firebase', () => ({ db: {}, auth: { currentUser: null } }));
vi.mock('../../../services/dbService', () => ({ getSetting: vi.fn(), saveSetting: vi.fn(), saveSettingFromCloud: vi.fn() }));

import { cungDanhSachNhanVien, type AnalysisEmployeeItem } from './analysisEmployeeSyncService';

const nv = (id: string, department = 'Tư Vấn', maKho?: string): AnalysisEmployeeItem =>
    ({ id, name: `${id} - A`, originalName: `${id} - A`, department, maKho });

describe('cungDanhSachNhanVien', () => {
    it('khác thứ tự vẫn là cùng danh sách (departmentMap từ Firestore có khoá đã sắp xếp)', () => {
        expect(cungDanhSachNhanVien([nv('2'), nv('1')], [nv('1'), nv('2')])).toBe(true);
    });
    it('khác bộ phận / mã kho / số lượng là khác', () => {
        expect(cungDanhSachNhanVien([nv('1')], [nv('1', 'Thu Ngân')])).toBe(false);
        expect(cungDanhSachNhanVien([nv('1', 'Tư Vấn', '910')], [nv('1')])).toBe(false);
        expect(cungDanhSachNhanVien([nv('1')], [nv('1'), nv('2')])).toBe(false);
    });
    it('trường thiếu và rỗng coi như nhau', () => {
        expect(cungDanhSachNhanVien([{ ...nv('1'), supermarket: '' }], [nv('1')])).toBe(true);
    });
});

describe('cungDanhSachNhanVien — bỏ qua siêu thị từng nhân viên', () => {
    it('danh sách từ departmentMap (không siêu thị) khớp bản Phân tích đã gắn siêu thị', () => {
        const coSieuThi = [{ ...nv('1'), supermarket: 'Tân Hiệp' }];
        expect(cungDanhSachNhanVien(coSieuThi, [nv('1')])).toBe(false);
        expect(cungDanhSachNhanVien(coSieuThi, [nv('1')], true)).toBe(true);
    });
});
