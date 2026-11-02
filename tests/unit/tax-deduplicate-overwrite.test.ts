import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    normalizePersonName,
    isSameTaxRecord,
    monthKeyOfRecord,
} from '../../features/tax-calculator/services/taxHistoryGrouping';
import { SavedTaxRecord } from '../../features/tax-calculator/types/tax.types';

describe('Deduplicate & Overwrite Logic — taxHistoryGrouping', () => {
    it('normalizePersonName: chuẩn hóa chữ thường, bỏ dấu tiếng Việt và khoảng trắng thừa', () => {
        expect(normalizePersonName('TRUONG HOANG PHUC')).toBe('truong hoang phuc');
        expect(normalizePersonName('  TRƯƠNG   HOÀNG   PHÚC  ')).toBe('truong hoang phuc');
        expect(normalizePersonName('Nguyễn Minh Duy')).toBe('nguyen minh duy');
        expect(normalizePersonName('NGUYEN MINH DUY')).toBe('nguyen minh duy');
        expect(normalizePersonName('')).toBe('');
        expect(normalizePersonName(undefined)).toBe('');
    });

    it('monthKeyOfRecord: chuẩn hóa các định dạng tháng thành YYYY-MM', () => {
        expect(monthKeyOfRecord({ monthYear: '09/2026', createdAt: '2026-10-25' } as SavedTaxRecord)).toBe('2026-09');
        expect(monthKeyOfRecord({ monthYear: 'Tháng 09/2026', createdAt: '2026-10-25' } as SavedTaxRecord)).toBe('2026-09');
        expect(monthKeyOfRecord({ monthYear: 'T09/2026', createdAt: '2026-10-25' } as SavedTaxRecord)).toBe('2026-09');
        expect(monthKeyOfRecord({ monthYear: 'T9/2026', createdAt: '2026-10-25' } as SavedTaxRecord)).toBe('2026-09');
        expect(monthKeyOfRecord({ monthYear: '2026-09', createdAt: '2026-10-25' } as SavedTaxRecord)).toBe('2026-09');
    });

    it('isSameTaxRecord: xác định trùng khi CÙNG TÊN và CÙNG THÁNG', () => {
        const a = { name: 'TRUONG HOANG PHUC', monthYear: 'Tháng 09/2026', createdAt: '2026-10-25T12:00:00Z' };
        const b = { name: 'Trương Hoàng Phúc', monthYear: '09/2026', createdAt: '2026-10-25T12:10:00Z' };
        expect(isSameTaxRecord(a, b)).toBe(true);
    });

    it('isSameTaxRecord: KHÔNG trùng khi khác tháng', () => {
        const a = { name: 'TRUONG HOANG PHUC', monthYear: '09/2026', createdAt: '2026-10-25T12:00:00Z' };
        const b = { name: 'TRUONG HOANG PHUC', monthYear: '08/2026', createdAt: '2026-10-25T12:10:00Z' };
        expect(isSameTaxRecord(a, b)).toBe(false);
    });

    it('isSameTaxRecord: KHÔNG trùng khi khác tên', () => {
        const a = { name: 'TRUONG HOANG PHUC', monthYear: '09/2026', createdAt: '2026-10-25T12:00:00Z' };
        const b = { name: 'Nguyễn Minh Duy', monthYear: '09/2026', createdAt: '2026-10-25T12:10:00Z' };
        expect(isSameTaxRecord(a, b)).toBe(false);
    });

    it('isSameTaxRecord: KHÔNG trùng khi không có tên nhân viên', () => {
        const a = { name: '', monthYear: '09/2026', createdAt: '2026-10-25T12:00:00Z' };
        const b = { name: '', monthYear: '09/2026', createdAt: '2026-10-25T12:10:00Z' };
        expect(isSameTaxRecord(a, b)).toBe(false);
    });
});
