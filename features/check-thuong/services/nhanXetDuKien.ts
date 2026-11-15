import { CHECK_THUONG_COLS, parseNumber, formatPercent, formatNumber } from './checkThuongCalc';
import { khoaNhomThuong } from './checkThuongSearch';

/**
 * Nhận xét theo cột % D.KIẾN (% dự kiến hoàn thành) — nút "Copy nhận xét" trên thanh lọc Check thưởng.
 * 2026-11-15 (chủ dự án): bản đầu là một dòng chữ trên thanh lọc; cùng ngày đổi thành NÚT COPY: "copy nhận xét đánh giá các tiêu chí
 * > 80% sắp đạt 100% cần tập trung bao nhiêu, các nhóm hiệu quả kém".
 *
 * Tính trên TOÀN BỘ môn của siêu thị (không theo thẻ đang lọc) — là bản đánh giá của siêu thị. Giá trị cột là PHÂN SỐ (1 = 100%).
 * Mốc: ≥ 100% đạt · 80–<100% SẮP ĐẠT (cần tập trung) · 70–<80% cần đẩy thêm · > 0 và < 70% HIỆU QUẢ KÉM · 0% chưa phát sinh.
 */
export const MOC_SAP_DAT = 0.8;
export const MOC_KEM = 0.7;

export interface MonDuKien {
    ten: string;
    pct: number;
    /** Cột D.K VƯỢT thô (âm = còn thiếu), như bảng ngành hàng hiển thị. */
    duKienVuot: number;
    khongQuy: boolean;
}

export interface PhanLoaiDuKien {
    soMon: number;
    /** TB % dự kiến của các môn đã phát sinh (> 0%); null khi chưa môn nào phát sinh. */
    trungBinh: number | null;
    dat100: number;
    /** 80% ≤ p < 100% — gần 100% nhất trước. */
    sapDat: MonDuKien[];
    /** 70% ≤ p < 80% — cao trước. */
    canDayThem: MonDuKien[];
    /** 0 < p < 70% — kém nhất trước. */
    kem: MonDuKien[];
    chuaPhatSinh: MonDuKien[];
}

export const phanLoaiDuKien = (rows: unknown[][], noFundGroups: Set<string> = new Set()): PhanLoaiDuKien => {
    const mon: MonDuKien[] = rows.map((r) => ({
        ten: String(r[CHECK_THUONG_COLS.NGANH_HANG] ?? '').trim(),
        pct: parseNumber(r[CHECK_THUONG_COLS.PERCENT_DU_KIEN]),
        duKienVuot: parseNumber(r[CHECK_THUONG_COLS.DU_KIEN_VUOT]),
        khongQuy: noFundGroups.has(khoaNhomThuong(r)),
    }));
    const coPhatSinh = mon.filter((m) => m.pct > 0);
    return {
        soMon: mon.length,
        trungBinh: coPhatSinh.length ? coPhatSinh.reduce((s, m) => s + m.pct, 0) / coPhatSinh.length : null,
        dat100: mon.filter((m) => m.pct >= 1).length,
        sapDat: mon.filter((m) => m.pct >= MOC_SAP_DAT && m.pct < 1).sort((a, b) => b.pct - a.pct),
        canDayThem: mon.filter((m) => m.pct >= MOC_KEM && m.pct < MOC_SAP_DAT).sort((a, b) => b.pct - a.pct),
        kem: mon.filter((m) => m.pct > 0 && m.pct < MOC_KEM).sort((a, b) => a.pct - b.pct),
        chuaPhatSinh: mon.filter((m) => m.pct <= 0),
    };
};

/** Bỏ tiền tố tháng "T11 - " cho gọn khi nêu tên môn trong nhận xét. */
export const tenMonGon = (ten: string): string => ten.replace(/^T\d{1,2}\s*-\s*/i, '').trim() || ten;

/** "còn 0.5%" — phần còn thiếu tới 100%, 1 chữ số thập phân như cột % D.KIẾN. Làm tròn TRƯỚC khi định dạng: 1 − 0.94 trong số thực
 *  là 0.06000000000000005 → formatPercent ra "6.0%". */
export const conThieu = (pct: number): string => {
    const p = Math.round(Math.max(0, 1 - pct) * 1000) / 10;
    return `${Number.isInteger(p) ? p : p.toFixed(1)}%`;
};

const dongMon = (m: MonDuKien, i: number, kemDuKienVuot: boolean): string => {
    const phu: string[] = [`còn ${conThieu(m.pct)}`];
    if (kemDuKienVuot && m.duKienVuot !== 0) phu.push(`D.K vượt ${formatNumber(m.duKienVuot)}`);
    if (m.khongQuy) phu.push('không quỹ');
    return `${i + 1}. ${tenMonGon(m.ten)}: ${formatPercent(m.pct)} (${phu.join(', ')})`;
};

export interface ThongTinNhanXet {
    rows: unknown[][];
    noFundGroups?: Set<string>;
    storeName?: string;
    formattedUploadTime?: string;
}

/** Văn bản nhận xét để dán vào Zalo/LINE — chữ thường, không emoji, mỗi môn một dòng. */
export const taoVanBanNhanXet = ({ rows, noFundGroups, storeName, formattedUploadTime }: ThongTinNhanXet): string => {
    const pl = phanLoaiDuKien(rows, noFundGroups);
    const dong: string[] = [];
    const dau = ['NHẬN XÉT % DỰ KIẾN', storeName].filter(Boolean).join(' — ');
    dong.push(formattedUploadTime ? `${dau} (cập nhật ${formattedUploadTime})` : dau);
    const tong = [`Đạt ≥ 100%: ${pl.dat100}/${pl.soMon} môn`];
    if (pl.trungBinh !== null) tong.push(`TB % dự kiến: ${formatPercent(pl.trungBinh)}`);
    dong.push(tong.join(' · '));

    if (pl.sapDat.length) {
        dong.push('', `SẮP ĐẠT 100% (80–99%) — ${pl.sapDat.length} môn, cần tập trung:`);
        pl.sapDat.forEach((m, i) => dong.push(dongMon(m, i, true)));
    } else {
        dong.push('', 'SẮP ĐẠT 100% (80–99%): không có môn nào.');
    }
    if (pl.canDayThem.length) {
        dong.push('', `CẦN ĐẨY THÊM (70–79%) — ${pl.canDayThem.length} môn:`);
        pl.canDayThem.forEach((m, i) => dong.push(dongMon(m, i, false)));
    }
    if (pl.kem.length) {
        dong.push('', `HIỆU QUẢ KÉM (dưới 70%) — ${pl.kem.length} môn:`);
        pl.kem.forEach((m, i) => dong.push(dongMon(m, i, false)));
    }
    if (pl.chuaPhatSinh.length) {
        dong.push('', `CHƯA PHÁT SINH DOANH SỐ (0%) — ${pl.chuaPhatSinh.length} môn: ${pl.chuaPhatSinh.map((m) => tenMonGon(m.ten)).join(', ')}`);
    }
    if (!pl.sapDat.length && !pl.canDayThem.length && !pl.kem.length && !pl.chuaPhatSinh.length && pl.soMon > 0) {
        dong.push('', `Tất cả ${pl.soMon} môn đã đạt ≥ 100%.`);
    }
    return dong.join('\n');
};
