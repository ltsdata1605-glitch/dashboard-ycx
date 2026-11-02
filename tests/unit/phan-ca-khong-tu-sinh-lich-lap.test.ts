import { describe, it, expect } from 'vitest';
import { lichKhopSoNgay } from '../../features/phan-ca/services/scheduleService';

/**
 * Lỗi 2026-10-30: "Ca làm việc cứ nhảy tạo lịch mới liên tục". Mỗi nhân viên giữ mảng duration+1 ô (ô 0 trống), điều kiện cũ
 * `length === duration` luôn sai → hiệu ứng tự sinh lịch mỗi giây, lịch đổi liên tục.
 */
describe('Phân Ca — lịch đủ số ngày (không tự sinh lại)', () => {
    const nv = (n: number) => ({ id: `n${n}`, name: `NV ${n}`, department: 'BP', gender: 'Nam' as const, stats: { gh: 0, kho: 0, tn: 0, offDays: 0, swapCount: 0 }, schedule: [null] as never[], changeHistory: [], importIndex: n });

    it('lịch đủ ô (duration+1, ô 0 trống) được nhận là ĐỦ → không sinh lại', () => {
        const duration = 14;
        const lich = (i: number) => {
            const ds: (null | { shift: string; role: string })[] = [null];
            for (let d = 1; d <= duration; d++) ds.push({ shift: '1', role: '1' });
            return { ...nv(i), schedule: ds as never };
        };
        const staffList = [lich(1), lich(2)];
        expect((staffList[0].schedule as unknown[]).length).toBe(duration + 1);
        expect(lichKhopSoNgay(staffList, duration)).toBe(true);
    });

    it('đổi số ngày → lịch cũ không khớp → mới sinh lại', () => {
        expect(lichKhopSoNgay([{ ...nv(1), schedule: Array(15).fill(null) as never }], 20)).toBe(false);
    });

    it('chưa có nhân viên → không coi là khớp (không sinh lịch rỗng)', () => {
        expect(lichKhopSoNgay([], 30)).toBe(false);
    });
});
