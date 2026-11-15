import { CHECK_THUONG_COLS, parseNumber } from './checkThuongCalc';

/**
 * Nhận xét theo cột % D.KIẾN (% dự kiến hoàn thành) của nhóm ngành hàng đang xem — 2026-11-15, chủ dự án khoanh chỗ trống
 * cạnh nút "Dạng bảng": "thêm nhận xét dựa vào cột %D.kiến". Giá trị cột là PHÂN SỐ (1 = 100%), như bảng ngành hàng đọc.
 *
 * Mốc chia: ≥ 100% đạt · 90–<100% SÁT MỐC (đẩy thêm chút là qua 100%) · 70–<90% · > 0 và < 70% THẤP · 0% chưa phát sinh.
 * Trung bình chỉ tính các môn đã phát sinh (> 0%) — môn 0% kéo trung bình xuống mà không nói được gì về tiến độ.
 */
export const MOC_SAT = 0.9;
export const MOC_THAP = 0.7;

export interface MonPhanTram { ten: string; pct: number }

export interface NhanXetDuKien {
    soMon: number;
    /** Trung bình % dự kiến (phân số) của các môn > 0%; null khi không môn nào phát sinh. */
    trungBinh: number | null;
    dat100: number;
    /** 90% ≤ p < 100%, xếp gần 100% nhất trước. */
    satMoc: MonPhanTram[];
    kha: number;
    thap: number;
    chuaPhatSinh: number;
}

export const nhanXetDuKien = (rows: unknown[][]): NhanXetDuKien => {
    const mon = rows.map((r) => ({
        ten: String(r[CHECK_THUONG_COLS.NGANH_HANG] ?? '').trim(),
        pct: parseNumber(r[CHECK_THUONG_COLS.PERCENT_DU_KIEN]),
    }));
    const coPhatSinh = mon.filter((m) => m.pct > 0);
    return {
        soMon: mon.length,
        trungBinh: coPhatSinh.length ? coPhatSinh.reduce((s, m) => s + m.pct, 0) / coPhatSinh.length : null,
        dat100: mon.filter((m) => m.pct >= 1).length,
        satMoc: mon.filter((m) => m.pct >= MOC_SAT && m.pct < 1).sort((a, b) => b.pct - a.pct),
        kha: mon.filter((m) => m.pct >= MOC_THAP && m.pct < MOC_SAT).length,
        thap: mon.filter((m) => m.pct > 0 && m.pct < MOC_THAP).length,
        chuaPhatSinh: mon.filter((m) => m.pct <= 0).length,
    };
};

/** Bỏ tiền tố tháng "T11 - " cho gọn khi nêu tên môn trong câu nhận xét. */
export const tenMonGon = (ten: string): string => ten.replace(/^T\d{1,2}\s*-\s*/i, '').trim() || ten;
