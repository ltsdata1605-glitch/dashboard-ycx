import { describe, it, expect } from 'vitest';
import { chonNgayDuLieu } from './useNgayDuLieu';
import { getMonthProgress, calculateRunRate } from '../services/metricService';

/**
 * Thi đua (Tổng hợp/So sánh/Cá nhân) tính tiến độ tháng theo NGÀY CỦA DỮ LIỆU như tab Doanh thu (2026-10-29). Trước đó đọc đồng hồ:
 * xem báo cáo thi đua tháng 9 vào ngày 15/10 → %DKHT = thực hiện ÷ 14 ngày × 31 (phóng ~2 lần) thay vì giữ nguyên số tháng 9.
 */
describe('chonNgayDuLieu', () => {
    it('ưu tiên báo cáo thi đua → luỹ kế → danh sách', () => {
        expect(chonNgayDuLieu('Cập nhật lúc: 08:00:00 30/9/2026', '15/10/2026', null)).toMatchObject({ day: 30, month: 9, year: 2026 });
        expect(chonNgayDuLieu('không có ngày', 'Cập nhật lúc: 07:00:00 14/10/2026', null)).toMatchObject({ day: 14, month: 10 });
        expect(chonNgayDuLieu('', '', '')).toBeNull();
    });

    it('xem thi đua tháng trước vào giữa tháng sau: dự kiến = thực hiện (không phóng theo số ngày tháng mới)', () => {
        const homNay = new Date(2026, 9, 15); // 15/10/2026
        const ngay = chonNgayDuLieu('Cập nhật lúc: 08:00:00 30/9/2026', null, null);
        const theoDuLieu = getMonthProgress(homNay, ngay);
        expect(calculateRunRate(300, theoDuLieu.daysPassed, theoDuLieu.daysInMonth)).toBe(300);
        const theoDongHo = getMonthProgress(homNay, null);
        expect(calculateRunRate(300, theoDongHo.daysPassed, theoDongHo.daysInMonth)).toBeGreaterThan(600); // bản cũ: ×31/14
    });
});
