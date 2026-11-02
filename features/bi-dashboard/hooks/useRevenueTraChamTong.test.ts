import { describe, it, expect, vi } from 'vitest';
import { RevenueRow } from '../types/nhanVienTypes';

vi.mock('react', async () => {
    const actual = await vi.importActual<typeof import('react')>('react');
    return { ...actual, useMemo: (fn: () => unknown) => fn(), useCallback: (fn: () => unknown) => fn() };
});

import { useRevenueData } from './useRevenueData';

/**
 * % trả chậm dòng bộ phận / TỔNG CỘNG ở tab Doanh thu (2026-10-29). Trước đó = TRUNG BÌNH CỘNG % của từng nhân viên; tab Trả chậm
 * lại tính Σ DT trả chậm / Σ DT siêu thị → cùng một chỉ tiêu, 2 tab ra 2 số. Ví dụ dưới: A bán 100 tr trả chậm 10% (10 tr), B bán
 * 10 tr trả chậm 90% (9 tr) → đúng = 19 / 110 = 17,27%; trung bình cộng cũ = 50%.
 */
const BP = 'BP All In One - ĐMX';
const nv = (originalName: string, name: string, dtlk: number): RevenueRow => ({
    type: 'employee', name, originalName, department: BP, dtlk, dtqd: dtlk, hieuQuaQD: 0, soLuong: 0,
});
const rows: RevenueRow[] = [
    { type: 'department', name: BP, dtlk: 110, dtqd: 110, hieuQuaQD: 0 },
    nv('1001 - Nguyễn Văn A', 'Nguyễn Văn A', 100),
    nv('1002 - Trần Thị B', 'Trần Thị B', 10),
];
const pct = new Map([['1001 - Nguyễn Văn A', 10], ['1002 - Trần Thị B', 90]]);
const base = new Map([['1001 - Nguyễn Văn A', 100_000_000], ['1002 - Trần Thị B', 10_000_000]]);
const useDanhSach = (baseMap?: Map<string, number>, viewMode: 'group' | 'list' = 'group') => useRevenueData({
    rows, departmentNames: [BP], sortConfig: { key: 'dtqd', direction: 'desc' }, prevMonthRows: [],
    departmentWeights: { [BP]: 100 }, deptEmployeeCounts: { [BP]: 2 }, supermarketTarget: 0,
    employeeInstallmentMap: pct, employeeInstallmentBaseMap: baseMap, viewMode, exportDeptFilter: null, isActive: true,
}).displayList;

describe('useRevenueData — % trả chậm dòng tổng có trọng số (khớp tab Trả chậm)', () => {
    it('chế độ nhóm: dòng bộ phận và TỔNG CỘNG = Σ DT trả chậm / Σ DT siêu thị', () => {
        const list = useDanhSach(base);
        expect(list.filter(r => r.type === 'employee').map(r => r.calculatedInstallment).sort()).toEqual([10, 90]);
        const bp = list.find(r => r.type === 'department')!;
        const tong = list.find(r => r.type === 'total')!;
        expect(bp.calculatedInstallment).toBeCloseTo(1900 / 110, 6);
        expect(tong.calculatedInstallment).toBeCloseTo(1900 / 110, 6);
    });

    it('chế độ danh sách: TỔNG CỘNG cũng có trọng số', () => {
        const tong = useDanhSach(base, 'list').find(r => r.type === 'total')!;
        expect(tong.calculatedInstallment).toBeCloseTo(1900 / 110, 6);
    });

    it('không có DT siêu thị (dữ liệu cũ) → lùi về trung bình cộng như trước', () => {
        expect(useDanhSach(undefined).find(r => r.type === 'total')!.calculatedInstallment).toBe(50);
    });
});
