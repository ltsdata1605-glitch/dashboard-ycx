import { describe, it, expect } from 'vitest';
import { nhanXetDuKien, tenMonGon } from './nhanXetDuKien';

// Cột: [STT, Vùng, Miền, Kênh, Siêu thị, Ngành hàng, % dự kiến, …] — % dự kiến là PHÂN SỐ (1 = 100%)
const dong = (ten: string, pct: number | string) => ['', 'V', 'M', 'DML', '910 - ĐML', ten, pct, 0, 10, 1, 1, 0, 0, 0];

describe('nhanXetDuKien — nhận xét theo cột % D.KIẾN', () => {
    // Đúng các dòng đầu nhóm "< 100%" trong ảnh chủ dự án 15/11
    const rows = [
        dong('T11 - TAI NGHE', 0.993),
        dong('T11 - BẢO HIỂM TỔNG', 0.985),
        dong('T11 - CAMERA', 0.977),
        dong('T11 - CÁP SẠC', 0.895),
        dong('T11 - ĐIỆN THOẠI VIVO', 0.797),
        dong('T11 - LOA', 0.5),
        dong('T11 - SIM', 0),
        dong('T11 - QUẠT GIÓ', 1.564),
    ];
    const nx = nhanXetDuKien(rows);

    it('đếm đúng từng mốc', () => {
        expect(nx.soMon).toBe(8);
        expect(nx.dat100).toBe(1);
        expect(nx.satMoc.map((m) => m.ten)).toEqual(['T11 - TAI NGHE', 'T11 - BẢO HIỂM TỔNG', 'T11 - CAMERA']);
        expect(nx.kha).toBe(2); // 89.5%, 79.7%
        expect(nx.thap).toBe(1); // 50%
        expect(nx.chuaPhatSinh).toBe(1);
    });

    it('trung bình chỉ tính môn đã phát sinh (> 0%)', () => {
        const coPs = [0.993, 0.985, 0.977, 0.895, 0.797, 0.5, 1.564];
        expect(nx.trungBinh).toBeCloseTo(coPs.reduce((a, b) => a + b, 0) / coPs.length, 10);
    });

    it('mốc biên: 100% là đạt, 90% là sát mốc, 70% là khá', () => {
        const b = nhanXetDuKien([dong('A', 1), dong('B', 0.9), dong('C', 0.7), dong('D', 0.6999)]);
        expect([b.dat100, b.satMoc.length, b.kha, b.thap]).toEqual([1, 1, 1, 1]);
    });

    it('đọc được ô dạng chuỗi như parseNumber của bảng', () => {
        expect(nhanXetDuKien([dong('A', '0.95')]).satMoc).toHaveLength(1);
    });

    it('nhóm rỗng / toàn 0%', () => {
        expect(nhanXetDuKien([]).trungBinh).toBeNull();
        const z = nhanXetDuKien([dong('A', 0), dong('B', '')]);
        expect(z.trungBinh).toBeNull();
        expect(z.chuaPhatSinh).toBe(2);
    });

    it('tenMonGon bỏ tiền tố tháng', () => {
        expect(tenMonGon('T11 - TAI NGHE')).toBe('TAI NGHE');
        expect(tenMonGon('T9-CAMERA')).toBe('CAMERA');
        expect(tenMonGon('PHỤ KIỆN')).toBe('PHỤ KIỆN');
    });
});
