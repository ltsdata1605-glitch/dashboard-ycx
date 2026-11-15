import React, { useMemo } from 'react';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { formatPercent } from '../services/checkThuongCalc';
import { nhanXetDuKien, tenMonGon } from '../services/nhanXetDuKien';

/**
 * Một dòng nhận xét theo cột % D.KIẾN của nhóm đang lọc (2026-11-15, chủ dự án khoanh chỗ trống cạnh "Dạng bảng"). Đặt trong thanh
 * lọc; thiếu chỗ thì tự xuống dòng (laptop: cạnh nút "Dạng bảng"; iPhone: một dòng riêng). Rê chuột xem đủ danh sách môn sát mốc.
 */
export const CheckThuongNhanXetDuKien: React.FC<{ rows: unknown[][] }> = ({ rows }) => {
    const nx = useMemo(() => nhanXetDuKien(rows), [rows]);
    if (nx.soMon === 0) return null;

    const gan = nx.satMoc[0];
    const tieuDe = nx.satMoc.length
        ? `Sát mốc 100% (90–99%):\n${nx.satMoc.map((m) => `• ${tenMonGon(m.ten)}: ${formatPercent(m.pct)}`).join('\n')}`
        : 'Không có môn nào trong khoảng 90–99%';

    const phan: React.ReactNode[] = [];
    if (nx.trungBinh !== null) {
        phan.push(<span key="tb">TB <b className="text-slate-900 tabular-nums">{formatPercent(nx.trungBinh)}</b></span>);
    }
    if (nx.dat100 > 0) {
        phan.push(
            <span key="dat" className="text-sky-700">
                <b className="tabular-nums">{nx.dat100 === nx.soMon ? `Cả ${nx.soMon}` : nx.dat100}</b> môn ≥ 100%
            </span>
        );
    }
    if (gan) {
        phan.push(
            <span key="sat" className="text-emerald-700">
                <b className="tabular-nums">{nx.satMoc.length}</b> môn sát mốc 90–99%
                <span className="text-slate-500">, gần nhất </span>
                <b>{tenMonGon(gan.ten)} {formatPercent(gan.pct)}</b>
            </span>
        );
    }
    if (nx.thap > 0) {
        phan.push(<span key="thap" className="text-rose-600"><b className="tabular-nums">{nx.thap}</b> môn dưới 70%</span>);
    }
    if (nx.chuaPhatSinh > 0) {
        phan.push(<span key="0" className="text-slate-500"><b className="tabular-nums">{nx.chuaPhatSinh}</b> môn 0%</span>);
    }

    return (
        <p
            data-testid="check-thuong-nhan-xet-du-kien"
            title={tieuDe}
            className="order-last w-full lg:order-none lg:w-auto lg:flex-1 lg:min-w-[260px] flex items-start gap-1.5 type-footnote text-slate-600 leading-snug"
        >
            <AppIcon name="chartBar" size="xs" className="text-sky-600 shrink-0 mt-0.5" />
            <span>
                <span className="font-semibold text-slate-700">Nhận xét % D.Kiến: </span>
                {phan.map((p, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <span className="text-slate-400"> · </span>}
                        {p}
                    </React.Fragment>
                ))}
            </span>
        </p>
    );
};
