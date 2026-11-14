import React, { useMemo, useState } from 'react';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { toast } from '../../../components/shared/ui/toast';
import { Button } from '../../../components/shared/ui/Button';
import { Input } from '../../../components/shared/ui/Input';
import { ConfirmDialog } from '../../../components/shared/ui/ConfirmDialog';
import type { SavedReport, CustomField } from '../types';
import { parseTr, AMOUNT_ITEMS, migrateAmounts, resolveTraGop } from '../catalog';
import { buildReportText, fmtTr } from '../utils/reportText';
import { groupTotal } from '../utils/aggregate';
import { copyText } from '../utils/exportImage';
import { BandHeader } from './GroupSection';

interface HistoryTabProps {
    reports: SavedReport[];
    fields: CustomField[];
    onEdit: (report: SavedReport) => void;
    onDelete: (id: string) => void;
    onClearAll: () => void;
}

const fmtTime = (iso: string, fallback: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return fallback;
    return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
};

/** Tổng các ô bảo hiểm (Tr) của một đơn, kể cả BHMR cũ đã di trú. */
const insuranceOf = (r: SavedReport) => {
    const a = migrateAmounts(r.amounts);
    return AMOUNT_ITEMS.insurance.reduce((s, item) => s + parseTr(a[item.key]), 0);
};

const TH: React.FC<{ children?: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <th className={`h-8 px-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-left whitespace-nowrap ${className}`}>
        {children}
    </th>
);

export const HistoryTab: React.FC<HistoryTabProps> = ({ reports, fields, onEdit, onDelete, onClearAll }) => {
    const [dateFilter, setDateFilter] = useState('');
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<SavedReport | null>(null);
    const [confirmClear, setConfirmClear] = useState(false);

    const rows = useMemo(() => {
        const q = search.trim().toLowerCase();
        return reports
            .filter(r => !dateFilter || r.date === dateFilter)
            .filter(r => !q || r.staffName.toLowerCase().includes(q) || String(parseTr(r.revenueTotal)).includes(q) || r.notes.toLowerCase().includes(q))
            .sort((a, b) => (b.savedAt || b.date).localeCompare(a.savedAt || a.date));
    }, [reports, dateFilter, search]);

    const copyReport = async (r: SavedReport) => {
        const ok = await copyText(buildReportText(r, fields));
        if (ok) toast.success('Đã copy văn bản báo cáo'); else toast.error('Không copy được, thử lại');
    };

    const totalTr = rows.reduce((s, r) => s + parseTr(r.revenueTotal), 0);

    return (
        <div className="space-y-3.5">
            <section className="rounded-card border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                <BandHeader
                    icon="history"
                    title={<>Nhật ký đơn hàng <span className="tabular-nums font-bold text-sky-600 dark:text-sky-400">({reports.length})</span></>}
                    right={
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Input
                                type="date"
                                value={dateFilter}
                                onChange={e => setDateFilter(e.target.value)}
                                aria-label="Lọc theo ngày"
                                fullWidth={false}
                                className="h-7 px-2 text-[12px] w-[130px] rounded-control bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700"
                            />
                            <Input
                                placeholder="Tìm NV, doanh thu, ghi chú…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                aria-label="Tìm trong nhật ký"
                                fullWidth={false}
                                className="h-7 px-2 text-[12px] w-48 sm:w-56 hidden sm:block rounded-control bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700"
                            />
                            {(dateFilter || search) && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="ycx-hit h-7 px-2.5 text-[11px] rounded-full"
                                    onClick={() => { setDateFilter(''); setSearch(''); }}
                                >
                                    Xoá lọc
                                </Button>
                            )}
                        </div>
                    }
                />

                {reports.length === 0 ? (
                    <div className="relative group m-3">
                        <div className="relative bg-slate-50/60 dark:bg-slate-850/60 rounded-popup border border-slate-200/80 dark:border-slate-700/80 px-4 py-12 text-center">
                            <span className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-2">
                                <AppIcon name="history" size="md" />
                            </span>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400">
                                Chưa có đơn hàng nào được ghi nhận. Bấm <b className="text-sky-600 dark:text-sky-400">Báo cáo</b> ở tab Nhập báo cáo.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-[13px] tabular-nums border-collapse" data-testid="history-table">
                                <thead className="sticky top-0 z-10">
                                    <tr>
                                        <TH className="w-8" />
                                        <TH>Thời gian</TH>
                                        <TH>Nhân viên</TH>
                                        <TH className="text-right">Doanh thu</TH>
                                        <TH className="text-right">SP</TH>
                                        <TH className="text-right">ƯT</TH>
                                        <TH className="text-right">PK</TH>
                                        <TH className="text-right">GD</TH>
                                        <TH className="text-right">Vas</TH>
                                        <TH className="text-right">BH (Tr)</TH>
                                        <TH className="text-center">Góp / Ví / Chiến</TH>
                                        <TH className="text-right">Thao tác</TH>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {rows.map(r => {
                                        const total = parseTr(r.revenueTotal);
                                        const traGop = resolveTraGop(r);
                                        const open = expanded === r.id;
                                        return (
                                            <React.Fragment key={r.id}>
                                                <tr
                                                    className={`h-9 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer border-l-[3px] transition-colors ${
                                                        traGop ? 'border-l-emerald-600' : 'border-l-slate-200 dark:border-l-slate-700'
                                                    }`}
                                                    onClick={() => setExpanded(open ? null : r.id)}
                                                    data-testid="history-row"
                                                >
                                                    <td className="px-2 text-slate-400">
                                                        {open ? <AppIcon name="chevronDown" size="sm" /> : <AppIcon name="chevronRight" size="sm" />}
                                                    </td>
                                                    <td className="px-2.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                                                        {fmtTime(r.savedAt, r.date)}
                                                    </td>
                                                    <td className="px-2.5 truncate max-w-[160px] font-semibold text-slate-800 dark:text-slate-200">
                                                        {r.staffName || '—'}
                                                    </td>
                                                    <td className="px-2.5 text-right font-bold text-slate-900 dark:text-white">
                                                        {total > 0 ? `${fmtTr(total)} Tr` : '—'}
                                                    </td>
                                                    <td className="px-2.5 text-right">{groupTotal(r, 'products') || '—'}</td>
                                                    <td className="px-2.5 text-right">{groupTotal(r, 'insurance') || '—'}</td>
                                                    <td className="px-2.5 text-right">{groupTotal(r, 'accessories') || '—'}</td>
                                                    <td className="px-2.5 text-right">{groupTotal(r, 'household') || '—'}</td>
                                                    <td className="px-2.5 text-right">{groupTotal(r, 'services') || '—'}</td>
                                                    <td className="px-2.5 text-right">{insuranceOf(r) > 0 ? fmtTr(insuranceOf(r)) : '—'}</td>
                                                    <td className="px-2.5 text-center text-[12px]">
                                                        <span className={traGop ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-slate-300 dark:text-slate-600'}>Góp</span>
                                                        <span className="text-slate-300 dark:text-slate-600"> · </span>
                                                        <span className={r.moVi ? 'text-sky-700 dark:text-sky-400 font-semibold' : 'text-slate-300 dark:text-slate-600'}>Ví</span>
                                                        <span className="text-slate-300 dark:text-slate-600"> · </span>
                                                        <span className={r.priceWar ? 'text-rose-700 dark:text-rose-400 font-semibold' : 'text-slate-300 dark:text-slate-600'}>Chiến</span>
                                                    </td>
                                                    <td className="px-2.5 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon-xs" onClick={() => copyReport(r)} title="Sao chép văn bản" aria-label="Sao chép" className="ycx-hit h-7 w-7 text-slate-400 hover:text-sky-600">
                                                            <AppIcon name="copy" size="sm" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon-xs" onClick={() => onEdit(r)} title="Sửa lại" aria-label="Sửa lại" className="ycx-hit h-7 w-7 text-slate-400 hover:text-sky-600">
                                                            <AppIcon name="edit" size="sm" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon-xs" onClick={() => setPendingDelete(r)} title="Xoá" aria-label="Xoá" className="ycx-hit h-7 w-7 text-slate-400 hover:text-rose-600">
                                                            <AppIcon name="delete" size="sm" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                                {open && (
                                                    <tr className="bg-slate-50/60 dark:bg-slate-850/50">
                                                        <td colSpan={12} className="px-4 py-3">
                                                            <pre className="p-3 rounded-popup bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200" data-testid="history-text">
                                                                {buildReportText(r, fields)}
                                                            </pre>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Thanh tổng kết dưới bảng */}
                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-[12px]">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">
                                Hiển thị <b className="text-slate-800 dark:text-slate-200">{rows.length}</b> / {reports.length} đơn
                            </span>
                            <span className="font-bold text-sky-700 dark:text-sky-400 text-[13px]">
                                Tổng doanh thu: {fmtTr(totalTr)} Tr
                            </span>
                        </div>
                    </>
                )}
            </section>

            {reports.length > 0 && (
                <div className="flex justify-end pt-1">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setConfirmClear(true)}
                        leftIcon={<AppIcon name="delete" size="sm" />}
                        className="ycx-hit h-8 px-3 rounded-full text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold"
                    >
                        Xoá toàn bộ nhật ký
                    </Button>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!pendingDelete}
                title="Xoá đơn hàng này?"
                message={`Xoá đơn lúc ${pendingDelete ? fmtTime(pendingDelete.savedAt, pendingDelete.date) : ''} (${pendingDelete?.staffName})? Không hoàn tác được.`}
                confirmText="Xoá"
                cancelText="Giữ lại"
                variant="danger"
                onConfirm={() => { if (pendingDelete) { onDelete(pendingDelete.id); setPendingDelete(null); } }}
                onClose={() => setPendingDelete(null)}
            />

            <ConfirmDialog
                isOpen={confirmClear}
                title="Xoá toàn bộ dữ liệu?"
                message="Toàn bộ đơn hàng trong Nhật ký, danh sách Khách hàng và các mục tuỳ chỉnh trên máy này sẽ bị xoá vĩnh viễn."
                confirmText="Xoá tất cả"
                cancelText="Huỷ"
                variant="danger"
                onConfirm={() => { onClearAll(); setConfirmClear(false); }}
                onClose={() => setConfirmClear(false)}
            />
        </div>
    );
};
