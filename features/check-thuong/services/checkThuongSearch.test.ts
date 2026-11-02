import { describe, it, expect } from 'vitest';
import { CHECK_THUONG_COLS } from './checkThuongCalc';
import { khoaNhomThuong, preProcessCompetitionData, getPotentialBonus } from './checkThuongSearch';

/**
 * Khoá nhóm thưởng "KÊNH|NGÀNH HÀNG" (2026-10-29). Giao diện từng tự ghép khoá chỉ viết hoa, không cắt khoảng trắng — ô dán từ Excel
 * thừa dấu cách khiến nhóm KHÔNG có quỹ bị coi "có quỹ" và hiện "~thưởng dự kiến" lấy từ kênh khác.
 */
const dong = (kenh: string, sieuThi: string, nganh: string, tongThuong: number, hangTarget = 0): unknown[] => {
    const r: unknown[] = new Array(14).fill('');
    r[CHECK_THUONG_COLS.KENH] = kenh;
    r[CHECK_THUONG_COLS.SIEU_THI] = sieuThi;
    r[CHECK_THUONG_COLS.NGANH_HANG] = nganh;
    r[CHECK_THUONG_COLS.HANG_PERCENT_TARGET] = hangTarget;
    r[CHECK_THUONG_COLS.TONG_THUONG] = tongThuong;
    return r;
};

describe('khoaNhomThuong — một khoá cho mọi nơi', () => {
    it('cắt khoảng trắng + viết hoa, kênh trống → N/A', () => {
        expect(khoaNhomThuong(dong(' ĐMX ', '910 - A', 'Bảo hiểm tổng  ', 0))).toBe('ĐMX|BẢO HIỂM TỔNG');
        expect(khoaNhomThuong(dong('', '910 - A', 'Sim', 0))).toBe('N/A|SIM');
    });

    it('nhóm không có quỹ ở kênh này (chỉ kênh khác có) + ô thừa dấu cách → vẫn nhận ra "không quỹ"', () => {
        const data = [
            dong('TGDĐ', '1 - X', 'Bảo hiểm tổng', 1_500_000, 3),   // kênh TGDĐ có quỹ
            dong('ĐMX ', '910 - A', 'Bảo hiểm tổng ', 0),           // kênh ĐMX không ai có thưởng, ô thừa dấu cách
        ] as unknown[][];
        const pre = preProcessCompetitionData(data as never);
        const rowDmx = data[1] as never;
        expect(pre.noFundGroups.has(khoaNhomThuong(rowDmx))).toBe(true);
        // getPotentialBonus vẫn tìm được "best" theo TÊN ngành ở kênh khác — chính vì vậy giao diện phải chặn bằng noFundGroups
        expect(getPotentialBonus(rowDmx, pre).total).toBe(1_500_000);
        // Cách ghép khoá cũ của giao diện (không cắt khoảng trắng) KHÔNG khớp → nhóm bị coi là có quỹ (lỗi đã sửa)
        const kenhCu: string = 'ĐMX ', nganhCu = 'Bảo hiểm tổng ';
        const khoaCu = `${kenhCu || 'N/A'}|${nganhCu}`.toUpperCase();
        expect(pre.noFundGroups.has(khoaCu)).toBe(false);
    });
});
