import { describe, it, expect } from 'vitest';
import { phanLoaiDuKien, taoVanBanNhanXet, tenMonGon } from './nhanXetDuKien';

// Cột: [STT, Vùng, Miền, Kênh, Siêu thị, Ngành hàng, % dự kiến, D.K vượt, …] — % dự kiến là PHÂN SỐ (1 = 100%)
const dong = (ten: string, pct: number | string, dkVuot = 0) => ['', 'V', 'M', 'DML', '910 - ĐML', ten, pct, dkVuot, 10, 1, 1, 0, 0, 0];

// Theo ảnh chủ dự án 15/11 (nhóm < 100%) + vài môn đạt / kém / 0%
const rows = [
    dong('T11 - CAMERA', 0.995, -1),
    dong('T11 - LAPTOP', 0.993, -7),
    dong('T11 - TRẢ CHẬM HOMECREDIT', 0.94, -473),
    dong('T11 - CÁP SẠC', 0.896, -7),
    dong('T11 - ĐIỆN TỬ SAMSUNG', 0.841, -94),
    dong('T11 - MÁY GIẶT', 0.793, -265),
    dong('T11 - LOA', 0.45, -50),
    dong('T11 - ĐỒNG HỒ', 0.62, -30),
    dong('T11 - SIM', 0, 0),
    dong('T11 - QUẠT GIÓ', 1.564, 49),
];

describe('phanLoaiDuKien — chia môn theo cột % D.KIẾN', () => {
    const pl = phanLoaiDuKien(rows);
    it('sắp đạt 80–99%: gần 100% nhất trước', () => {
        expect(pl.sapDat.map((m) => tenMonGon(m.ten))).toEqual(['CAMERA', 'LAPTOP', 'TRẢ CHẬM HOMECREDIT', 'CÁP SẠC', 'ĐIỆN TỬ SAMSUNG']);
    });
    it('70–79% cần đẩy thêm; dưới 70% kém (kém nhất trước); 0% riêng', () => {
        expect(pl.canDayThem.map((m) => m.ten)).toEqual(['T11 - MÁY GIẶT']);
        expect(pl.kem.map((m) => m.ten)).toEqual(['T11 - LOA', 'T11 - ĐỒNG HỒ']);
        expect(pl.chuaPhatSinh.map((m) => m.ten)).toEqual(['T11 - SIM']);
        expect(pl.dat100).toBe(1);
    });
    it('mốc biên: 80% là sắp đạt, 70% là cần đẩy, 100% là đạt', () => {
        const b = phanLoaiDuKien([dong('A', 0.8), dong('B', 0.7), dong('C', 1), dong('D', 0.6999)]);
        expect([b.sapDat.length, b.canDayThem.length, b.dat100, b.kem.length]).toEqual([1, 1, 1, 1]);
    });
    it('trung bình chỉ tính môn đã phát sinh', () => {
        const ps = [0.995, 0.993, 0.94, 0.896, 0.841, 0.793, 0.45, 0.62, 1.564];
        expect(pl.trungBinh).toBeCloseTo(ps.reduce((a, b) => a + b, 0) / ps.length, 10);
        expect(phanLoaiDuKien([dong('A', 0)]).trungBinh).toBeNull();
    });
    it('đánh dấu môn không quỹ theo khoá nhóm KÊNH|NGÀNH', () => {
        const p = phanLoaiDuKien([dong('T11 - CAMERA', 0.9)], new Set(['DML|T11 - CAMERA']));
        expect(p.sapDat[0].khongQuy).toBe(true);
    });
});

describe('taoVanBanNhanXet — chữ copy ra Zalo/LINE', () => {
    const vb = taoVanBanNhanXet({ rows, noFundGroups: new Set(['DML|T11 - LAPTOP']), storeName: 'ĐML Hùng Vương', formattedUploadTime: '09:35 15/11/2026' });
    const dongs = vb.split('\n');

    it('đầu đoạn: tên siêu thị, giờ cập nhật, nhóm "Tất cả", tổng quan', () => {
        expect(dongs[0]).toBe('NHẬN XÉT % DỰ KIẾN — ĐML Hùng Vương (cập nhật 09:35 15/11/2026)');
        expect(dongs[1]).toBe('Nhóm: Tất cả (10 môn)');
        expect(dongs[2]).toMatch(/^Đạt ≥ 100%: 1\/10 môn · TB % dự kiến: \d+(\.\d)?%$/);
        // "Tất cả": môn đã đạt chỉ đếm, không kể tên (trọng tâm là môn chưa đạt)
        expect(vb).not.toContain('ĐÃ ĐẠT ≥ 100% —');
    });

    it('sắp đạt: còn thiếu bao nhiêu % + D.K vượt + không quỹ', () => {
        expect(vb).toContain('SẮP ĐẠT 100% (80–99%) — 5 môn, cần tập trung:');
        expect(vb).toContain('1. CAMERA: 99.5% (còn 0.5%, D.K vượt -1)');
        expect(vb).toContain('2. LAPTOP: 99.3% (còn 0.7%, D.K vượt -7, không quỹ)');
        expect(vb).toContain('3. TRẢ CHẬM HOMECREDIT: 94% (còn 6%, D.K vượt -473)');
    });

    it('nhóm hiệu quả kém + chưa phát sinh', () => {
        expect(vb).toContain('CẦN ĐẨY THÊM (70–79%) — 1 môn:\n1. MÁY GIẶT: 79.3% (còn 20.7%)');
        expect(vb).toContain('HIỆU QUẢ KÉM (dưới 70%) — 2 môn:\n1. LOA: 45% (còn 55%)\n2. ĐỒNG HỒ: 62% (còn 38%)');
        expect(vb).toContain('CHƯA PHÁT SINH DOANH SỐ (0%) — 1 môn: SIM');
    });

    it('không có emoji (dán ra ngoài hiển thị như nhau mọi máy)', () => {
        expect(vb).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    });

    it('siêu thị đạt hết: không in dòng "không có môn nào" vô nghĩa', () => {
        const t = taoVanBanNhanXet({ rows: [dong('A', 1.2), dong('B', 1.0)] });
        expect(t).not.toContain('không có môn nào');
        expect(t).toContain('Tất cả 2 môn đã đạt ≥ 100%.');
    });

    it('tenMonGon bỏ tiền tố tháng', () => {
        expect(tenMonGon('T11 - TAI NGHE')).toBe('TAI NGHE');
        expect(tenMonGon('T9-CAMERA')).toBe('CAMERA');
        expect(tenMonGon('PHỤ KIỆN')).toBe('PHỤ KIỆN');
    });
});

describe('taoVanBanNhanXet — theo NHÓM ĐANG LỌC (chủ dự án 15/11: "không nhận xét all khi chỉ chọn 1 tiêu chí")', () => {
    it('nhóm "< 100%": chỉ các môn trong nhóm, ghi tên nhóm', () => {
        const nhom = rows.filter((r) => Number(r[6]) < 1);
        const t = taoVanBanNhanXet({ rows: nhom, tenNhom: 'Chưa Đạt < 100%' });
        expect(t.split('\n')[1]).toBe('Nhóm: Chưa Đạt < 100% (9 môn)');
        expect(t).toContain('Đạt ≥ 100%: 0/9 môn');
        expect(t).not.toContain('QUẠT GIÓ');
        expect(t).toContain('SẮP ĐẠT 100% (80–99%) — 5 môn, cần tập trung:');
    });

    it('nhóm "Đạt thưởng" toàn môn đã đạt: kể tên các môn đã đạt, không có mục chưa đạt', () => {
        const t = taoVanBanNhanXet({ rows: [dong('T11 - QUẠT GIÓ', 1.564), dong('T11 - TỦ LẠNH', 1.408)], tenNhom: 'Đạt thưởng' });
        expect(t).toContain('Nhóm: Đạt thưởng (2 môn)');
        expect(t).toContain('ĐÃ ĐẠT ≥ 100% — 2 môn:\n1. QUẠT GIÓ: 156.4%\n2. TỦ LẠNH: 140.8%');
        expect(t).toContain('Cả nhóm đã đạt ≥ 100%.');
        expect(t).not.toContain('SẮP ĐẠT');
        expect(t).not.toContain('HIỆU QUẢ KÉM');
    });

    it('nhóm có cả đạt lẫn chưa đạt (vd "Đạt thưởng" nhờ xếp hạng dù < 100%)', () => {
        const t = taoVanBanNhanXet({ rows: [dong('T11 - QUẠT GIÓ', 1.2), dong('T11 - CAMERA', 0.95, -1)], tenNhom: 'Đạt thưởng' });
        expect(t).toContain('ĐÃ ĐẠT ≥ 100% — 1 môn:\n1. QUẠT GIÓ: 120%');
        expect(t).toContain('SẮP ĐẠT 100% (80–99%) — 1 môn, cần tập trung:\n1. CAMERA: 95% (còn 5%, D.K vượt -1)');
    });

    it('nhóm rỗng', () => {
        expect(taoVanBanNhanXet({ rows: [], tenNhom: 'No Sale' })).toContain('Nhóm: No Sale (0 môn)\n\nNhóm này không có môn nào.');
    });
});
