import React, { useMemo, useState } from 'react';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { Button } from '../../../components/shared/ui/Button';
import { Input } from '../../../components/shared/ui/Input';
import { GlassSurface } from '../../../components/shared/ui/GlassSurface';
import { Modal } from '../../../components/shared/ui/Modal';
import type { ItemGroup, ReportDraft, CustomField } from '../types';
import { ITEM_GROUPS } from '../types';
import { fmtTr } from '../utils/reportText';
import { sanitizeExpressionInput, evaluateExpression, hasOperator } from '../utils/expression';
import { GroupSection, BandHeader } from './GroupSection';

interface ReportEntryTabProps {
    draft: ReportDraft;
    fields: CustomField[];
    warnings: string[];
    previewText: string;
    isSaving: boolean;
    onPatch: (patch: Partial<ReportDraft>) => void;
    onCount: (group: ItemGroup, key: string, value: number) => void;
    onAmount: (key: string, value: string) => void;
    onOther: (group: ItemGroup, patch: Partial<{ name: string; count: number }>) => void;
    onAddField: (group: ItemGroup) => void;
    onDeleteField: (field: CustomField) => void;
    onReset: () => void;
    onSubmit: () => void;
}

const TONE_ON: Record<'sky' | 'rose' | 'emerald', { btn: string; box: string; dot: string }> = {
    emerald: {
        btn: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 shadow-2xs font-semibold ring-1 ring-emerald-300/60 dark:ring-emerald-800',
        box: 'bg-emerald-600 border-emerald-600 text-white',
        dot: 'bg-emerald-500',
    },
    sky: {
        btn: 'border-sky-300 dark:border-sky-700 bg-sky-50/90 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200 shadow-2xs font-semibold ring-1 ring-sky-300/60 dark:ring-sky-800',
        box: 'bg-sky-600 border-sky-600 text-white',
        dot: 'bg-sky-500',
    },
    rose: {
        btn: 'border-rose-300 dark:border-rose-700 bg-rose-50/90 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 shadow-2xs font-semibold ring-1 ring-rose-300/60 dark:ring-rose-800',
        box: 'bg-rose-600 border-rose-600 text-white',
        dot: 'bg-rose-500',
    },
};

/**
 * Nút bật/tắt tuỳ chọn theo chuẩn Apple Interactive Pill:
 * - Vùng chạm 44px chuẩn iPhone
 * - Active state rõ nét với hiệu ứng màu sắc ngữ nghĩa
 */
const ToggleButton: React.FC<{
    on: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    tone: 'sky' | 'rose' | 'emerald';
}> = ({ on, onClick, icon, label, tone }) => (
    <Button
        variant="secondary"
        size="sm"
        onClick={onClick}
        aria-pressed={on}
        className={`ycx-hit h-11 lg:h-9.5 gap-2 rounded-popup transition-all duration-150 active:scale-95 ${
            on
                ? TONE_ON[tone].btn
                : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300'
        }`}
    >
        <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center border rounded-md transition-colors ${
                on ? TONE_ON[tone].box : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
            }`}
        >
            {on && <AppIcon name="check" size="xs" />}
        </span>
        <span className="shrink-0">{icon}</span>
        <span className="font-semibold text-[13px]">{label}</span>
    </Button>
);

export const ReportEntryTab: React.FC<ReportEntryTabProps> = ({
    draft,
    fields,
    warnings,
    previewText,
    isSaving,
    onPatch,
    onCount,
    onAmount,
    onOther,
    onAddField,
    onDeleteField,
    onReset,
    onSubmit,
}) => {
    const [showMobilePreview, setShowMobilePreview] = useState(false);

    // Ô doanh thu nhận phép tính: hiện kết quả tạm khi đang gõ, rời ô (blur/Enter) thì thay bằng số đã tính.
    const isExpression = hasOperator(draft.revenueTotal);
    const evaluated = isExpression ? evaluateExpression(draft.revenueTotal) : null;
    const commitRevenue = () => {
        if (isExpression && evaluated !== null) onPatch({ revenueTotal: fmtTr(Math.max(0, evaluated)) });
    };

    // Tính tổng số lượng món đã chọn để hiển thị trên thanh tóm tắt iPhone
    const totalItemCount = useMemo(() => {
        let count = 0;
        Object.values(draft.counts).forEach(groupCounts => {
            Object.values(groupCounts).forEach(v => {
                count += Number(v) || 0;
            });
        });
        Object.values(draft.others).forEach(o => {
            count += Number(o?.count) || 0;
        });
        return count;
    }, [draft.counts, draft.others]);

    const evaluatedRevenue = useMemo(() => {
        if (!draft.revenueTotal) return 0;
        if (hasOperator(draft.revenueTotal)) {
            return Math.max(0, evaluateExpression(draft.revenueTotal) ?? 0);
        }
        return Math.max(0, parseFloat(draft.revenueTotal) || 0);
    }, [draft.revenueTotal]);

    // Nút hành động chuẩn Apple
    const renderActions = (where: 'desktop' | 'mobile') => (
        <div className="grid grid-cols-2 gap-2.5">
            <Button
                variant="secondary"
                onClick={onReset}
                leftIcon={<AppIcon name="reset" size="md" />}
                className="h-11 lg:h-10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full font-bold active:scale-95"
            >
                Làm mới
            </Button>
            <Button
                variant="primary"
                onClick={onSubmit}
                isLoading={isSaving}
                leftIcon={<AppIcon name="copy" size="md" />}
                className="h-11 lg:h-10 bg-sky-600 hover:bg-sky-500 text-white rounded-full font-bold shadow-md shadow-sky-600/25 active:scale-95"
                data-testid={`btn-submit-report-${where}`}
            >
                Báo cáo
            </Button>
        </div>
    );

    return (
        <div className="lg:grid lg:grid-cols-12 lg:gap-4 space-y-3.5 lg:space-y-0 pb-20 lg:pb-0">
            {/* Cột trái: Form nhập liệu */}
            <div className="lg:col-span-8 space-y-3.5">
                {warnings.length > 0 && (
                    <div
                        className="rounded-card border border-amber-300 dark:border-amber-700 bg-amber-50/90 dark:bg-amber-950/40 p-3 flex gap-2.5 items-start shadow-2xs"
                        role="alert"
                    >
                        <span className="w-6 h-6 rounded-md bg-amber-200/80 dark:bg-amber-800 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                            <AppIcon name="warning" size="sm" />
                        </span>
                        <div className="text-[13px] text-amber-900 dark:text-amber-200">
                            <span className="font-extrabold uppercase text-[11px] tracking-wider block mb-0.5">
                                Cảnh báo 3 ngày liên tiếp không khai thác
                            </span>
                            {warnings.join(' · ')}
                        </div>
                    </div>
                )}

                {/* Khối Doanh thu đơn hàng */}
                <section
                    className="rounded-card border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition-all"
                    data-testid="revenue-block"
                >
                    <BandHeader icon="banknote" title="Doanh thu đơn hàng (Tr)" />

                    <div className="p-3 sm:p-3.5 space-y-2">
                        <label
                            htmlFor="kt-revenue"
                            className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                        >
                            Tổng doanh thu thực
                        </label>

                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 min-w-0">
                                <Input
                                    id="kt-revenue"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="VD: 8.5 hoặc 5+3+4"
                                    autoComplete="off"
                                    value={draft.revenueTotal}
                                    onChange={e => onPatch({ revenueTotal: sanitizeExpressionInput(e.target.value) })}
                                    onBlur={commitRevenue}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') commitRevenue();
                                    }}
                                    className="h-11 text-[16px] tabular-nums font-bold rounded-popup border-slate-200/90 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 pr-10 shadow-2xs"
                                />
                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">
                                    Tr
                                </span>
                            </div>

                            {isExpression && (
                                <span
                                    className={`shrink-0 inline-flex items-center h-11 px-3 rounded-popup text-[15px] font-black tabular-nums border ${
                                        evaluated !== null
                                            ? 'bg-sky-50 dark:bg-sky-950/50 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 shadow-2xs'
                                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                                    }`}
                                    data-testid="revenue-eval"
                                >
                                    = {evaluated !== null ? `${fmtTr(evaluated)} Tr` : '…'}
                                </span>
                            )}
                        </div>

                        <p className="text-[12px] text-slate-500 dark:text-slate-400">
                            Gõ được phép tính (VD <span className="tabular-nums font-semibold">5+3+4</span>) — rời ô là tự tính ra tổng.
                        </p>
                    </div>

                    {/* 3 Toggles: Trả góp, Mở Ví, Chiến giá */}
                    <div className="grid grid-cols-3 gap-2 p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-850/40">
                        <ToggleButton
                            on={draft.traGop}
                            onClick={() => onPatch({ traGop: !draft.traGop })}
                            icon={<AppIcon name="card" size="md" />}
                            label="Trả góp"
                            tone="emerald"
                        />
                        <ToggleButton
                            on={draft.moVi}
                            onClick={() => onPatch({ moVi: !draft.moVi })}
                            icon={<AppIcon name="wallet" size="md" />}
                            label="Mở Ví"
                            tone="sky"
                        />
                        <ToggleButton
                            on={draft.priceWar}
                            onClick={() => onPatch({ priceWar: !draft.priceWar })}
                            icon={<AppIcon name="compete" size="md" />}
                            label="Chiến giá"
                            tone="rose"
                        />
                    </div>
                </section>

                {/* Các danh mục sản phẩm (GroupSection) */}
                {ITEM_GROUPS.map(group => (
                    <GroupSection
                        key={group}
                        group={group}
                        draft={draft}
                        fields={fields}
                        onCount={onCount}
                        onAmount={onAmount}
                        onOther={onOther}
                        onAddField={onAddField}
                        onDeleteField={onDeleteField}
                    />
                ))}

                {/* Ghi chú */}
                <section className="rounded-card border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                    <BandHeader icon="info" title="Ghi chú" />
                    <div className="p-3">
                        <textarea
                            rows={3}
                            placeholder="Nhập ghi chú thêm cho đơn hàng…"
                            value={draft.notes}
                            onChange={e => onPatch({ notes: e.target.value })}
                            aria-label="Ghi chú"
                            className="w-full resize-none rounded-popup border border-slate-200/90 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-2.5 text-[13px] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        />
                    </div>
                </section>

                {/* Khối xem trước inline cho Mobile khi cuộn xuống */}
                <div className="lg:hidden space-y-3.5 pt-1">
                    <section className="rounded-card border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                        <BandHeader
                            icon="file-text"
                            title="Xem trước báo cáo"
                            right={
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                                    {previewText.length} ký tự
                                </span>
                            }
                        />
                        <div className="p-3">
                            <pre
                                className="p-3 rounded-popup bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200"
                                data-testid="preview-mobile"
                            >
                                {previewText}
                            </pre>
                        </div>
                    </section>
                    {renderActions('mobile')}
                </div>
            </div>

            {/* Cột phải (Desktop): Sticky Preview Card */}
            <aside className="hidden lg:block lg:col-span-4">
                <div className="lg:sticky lg:top-[calc(var(--app-header-h)+12px)] space-y-3.5">
                    <section className="rounded-card border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                        <BandHeader
                            icon="file-text"
                            title="Xem trước báo cáo"
                            right={
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                                    {previewText.length} ký tự
                                </span>
                            }
                        />
                        <div className="p-3.5">
                            <pre
                                className="p-3.5 rounded-popup bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 min-h-[140px]"
                                data-testid="preview"
                            >
                                {previewText}
                            </pre>
                        </div>
                    </section>

                    {renderActions('desktop')}

                    <div className="rounded-popup p-3 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/40 text-[12px] text-slate-600 dark:text-slate-300 leading-snug flex items-start gap-2">
                        <span className="text-sky-600 dark:text-sky-400 mt-0.5 shrink-0">
                            <AppIcon name="help" size="sm" />
                        </span>
                        <div>
                            Bấm <b className="text-sky-700 dark:text-sky-400">Báo cáo</b>: tự động sao chép văn bản vào bộ nhớ tạm để dán lên nhóm Zalo/Line, ghi vào Nhật ký và làm sạch form cho đơn kế tiếp.
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── THANH THAO TÁC DÍNH ĐÁY (iPhone) — kính dùng chung GlassSurface (token --glass-*, có đường lùi giảm trong suốt),
                 KHÔNG tự viết lớp làm mờ nền rời của Tailwind (khối tiết kiệm pin tắt nó trên điện thoại — DESIGN_SYSTEM.md mục 8). Tràn mép nên bỏ bo góc
                 và viền 3 cạnh, chỉ giữ viền trên. ── */}
            <GlassSurface
                shape="panel"
                tone="strong"
                className="lg:hidden fixed bottom-0 inset-x-0 z-40 rounded-none border-x-0 border-b-0 px-3.5 py-2 pb-[calc(10px+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-2.5"
            >
                {/* Tóm tắt nhanh & xem trước drawer toggle */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowMobilePreview(prev => !prev)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowMobilePreview(prev => !prev); }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 text-left min-w-0 flex-1 transition-all active:scale-95 cursor-pointer"
                    aria-label="Xem trước tóm tắt báo cáo"
                >
                    <span className="w-6 h-6 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                        <AppIcon name="report" size="xs" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                            {evaluatedRevenue > 0 ? `${fmtTr(evaluatedRevenue)} Tr` : '0 Tr'}
                            <span className="text-[11px] font-normal text-slate-500 ml-1">({totalItemCount} món)</span>
                        </div>
                        <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium leading-none">
                            {showMobilePreview ? 'Đóng xem trước' : 'Chạm để xem trước'}
                        </div>
                    </div>
                </div>

                {/* Các nút bấm thao tác Mobile */}
                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={onReset}
                        title="Làm mới form"
                        aria-label="Làm mới"
                        className="ycx-hit w-10 h-10 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/90 dark:border-slate-700 shadow-2xs active:scale-90"
                    >
                        <AppIcon name="reset" size="md" />
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onSubmit}
                        isLoading={isSaving}
                        leftIcon={<AppIcon name="copy" size="sm" />}
                        className="ycx-hit h-10 px-4 rounded-full font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25 active:scale-95 text-xs sm:text-[13px]"
                    >
                        Báo cáo
                    </Button>
                </div>
            </GlassSurface>

            {/* Xem trước nhanh trên iPhone — sheet dùng chung (Modal position="bottom": kéo để đóng, né bàn phím, chừa thanh Home). */}
            <Modal
                isOpen={showMobilePreview}
                onClose={() => setShowMobilePreview(false)}
                title="Xem trước văn bản Zalo/Line"
                position="bottom"
                footer={
                    <div className="grid grid-cols-2 gap-2.5">
                        <Button
                            variant="secondary"
                            onClick={() => setShowMobilePreview(false)}
                            className="h-10 rounded-full font-bold"
                        >
                            Đóng
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => {
                                setShowMobilePreview(false);
                                onSubmit();
                            }}
                            isLoading={isSaving}
                            leftIcon={<AppIcon name="copy" size="sm" />}
                            className="h-10 rounded-full font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25"
                        >
                            Báo cáo ngay
                        </Button>
                    </div>
                }
            >
                <pre className="p-3 rounded-popup bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
                    {previewText}
                </pre>
            </Modal>
        </div>
    );
};
