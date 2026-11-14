import React from 'react';
import { resolveIconName } from '../../../components/shared/ui/icon/legacyIconNames';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { Button } from '../../../components/shared/ui/Button';
import { Input } from '../../../components/shared/ui/Input';
import type { ItemGroup, ReportDraft, CustomField } from '../types';
import { COUNT_ITEMS, AMOUNT_ITEMS, GROUP_META, customCountFields, customRevenueFields } from '../catalog';
import { CounterRow } from './CounterRow';

interface GroupSectionProps {
    group: ItemGroup;
    draft: ReportDraft;
    fields: CustomField[];
    onCount: (group: ItemGroup, key: string, value: number) => void;
    onAmount: (key: string, value: string) => void;
    onOther: (group: ItemGroup, patch: Partial<{ name: string; count: number }>) => void;
    onAddField: (group: ItemGroup) => void;
    onDeleteField: (field: CustomField) => void;
}

const blockNonNumericKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
};

/**
 * Màu icon từng phân nhóm — 5 nhóm = đúng 5 họ semantic (CLAUDE.md mục 2: sky · amber · rose · emerald · slate; chưa tới 6 hạng mục
 * nên chưa cần indigo). Trước 2026-11-14 dùng blue/violet/teal/indigo ngoài bảng màu → lint-ratchet đỏ.
 */
const GROUP_THEMES: Record<ItemGroup, { iconBg: string; iconColor: string }> = {
    products: { iconBg: 'bg-sky-100 dark:bg-sky-900/50', iconColor: 'text-sky-700 dark:text-sky-300' },
    insurance: { iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-700 dark:text-amber-300' },
    accessories: { iconBg: 'bg-rose-100 dark:bg-rose-900/50', iconColor: 'text-rose-700 dark:text-rose-300' },
    household: { iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-700 dark:text-emerald-300' },
    services: { iconBg: 'bg-slate-200 dark:bg-slate-800', iconColor: 'text-slate-700 dark:text-slate-300' },
};

/**
 * Tiêu đề nhóm chuẩn Apple Card Header:
 * - Icon nằm trong ô màu pastel bo góc mềm mại
 * - Typography viết hoa rõ nét, font chuẩn hệ thống
 * - Hỗ trợ hiển thị badge số lượng mục đang chọn
 */
export const BandHeader: React.FC<{
    icon?: string;
    title: React.ReactNode;
    right?: React.ReactNode;
    groupType?: ItemGroup;
    badgeCount?: number;
}> = ({ icon, title, right, groupType, badgeCount }) => {
    const theme = groupType ? GROUP_THEMES[groupType] : { iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' };

    return (
        <div className="px-3 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/80 transition-colors">
            <div className="flex items-center gap-2 min-w-0">
                {icon && (
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${theme.iconBg} ${theme.iconColor}`}>
                        <AppIcon name={resolveIconName(icon) ?? 'help'} size="sm" />
                    </span>
                )}
                <span className="text-[12px] font-bold uppercase tracking-wider truncate text-slate-800 dark:text-slate-200">
                    {title}
                </span>
                {badgeCount !== undefined && badgeCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 tabular-nums">
                        {badgeCount}
                    </span>
                )}
            </div>
            {right && <div className="flex items-center gap-1 shrink-0">{right}</div>}
        </div>
    );
};

/**
 * Ô nhập tiền (Tr) chuẩn Apple:
 * - Thống nhất chiều cao & phân cách giống CounterRow
 * - Ô nhập bo góc mềm mại, hiển thị rõ hậu tố Tr
 */
const AmountRow: React.FC<{
    icon: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    onDelete?: () => void;
}> = ({ icon, label, value, onChange, onDelete }) => {
    const active = parseFloat(value) > 0;
    const resolvedIcon = resolveIconName(icon) ?? 'help';

    return (
        <div
            className={`flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-3 h-10 lg:h-9 py-1 border-b border-slate-100/90 dark:border-slate-800/80 transition-colors duration-150 ${
                active ? 'bg-emerald-50/70 dark:bg-emerald-950/25' : 'bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
            }`}
        >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <span
                    className={`inline-flex shrink-0 w-6 h-6 rounded-md items-center justify-center transition-colors ${
                        active
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                >
                    <AppIcon name={resolvedIcon} size="sm" />
                </span>
                <span
                    className={`min-w-0 truncate text-[13px] transition-colors ${
                        active ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                    title={label}
                >
                    {label}
                </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
                {onDelete && (
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={onDelete}
                        title="Xoá mục này"
                        aria-label={`Xoá ${label}`}
                        className="ycx-hit flex text-slate-300 hover:text-rose-600 transition-colors mr-0.5"
                    >
                        <AppIcon name="delete" size="sm" />
                    </Button>
                )}

                <div className="relative inline-flex items-center">
                    <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.1"
                        placeholder="0"
                        fullWidth={false}
                        aria-label={label}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={blockNonNumericKeys}
                        className={`h-8 lg:h-7 w-20 sm:w-24 px-2 pr-6 text-right font-bold text-[13px] tabular-nums rounded-control transition-all ${
                            active
                                ? 'bg-white dark:bg-slate-850 border-emerald-400 text-emerald-700 dark:text-emerald-300 shadow-2xs ring-1 ring-emerald-200 dark:ring-emerald-900/40'
                                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                    />
                    <span className="absolute right-2 text-[11px] font-bold text-slate-400 pointer-events-none">
                        Tr
                    </span>
                </div>
            </div>
        </div>
    );
};

export const GroupSection: React.FC<GroupSectionProps> = ({
    group,
    draft,
    fields,
    onCount,
    onAmount,
    onOther,
    onAddField,
    onDeleteField,
}) => {
    const meta = GROUP_META[group];
    const counts = draft.counts[group] ?? {};
    const other = draft.others[group] ?? { name: '', count: 0 };
    const countFields = customCountFields(fields, group);
    const revenueFields = customRevenueFields(fields, group);

    // Tính tổng số mục đã chọn trong nhóm
    const groupCountTotal =
        COUNT_ITEMS[group].reduce((sum, item) => sum + (Number(counts[item.key]) || 0), 0) +
        countFields.reduce((sum, f) => sum + (Number(counts[f.id]) || 0), 0) +
        (Number(other.count) || 0);

    return (
        <section
            className="rounded-card border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition-all"
            data-testid={`group-${group}`}
        >
            <BandHeader
                icon={meta.icon}
                title={meta.label}
                groupType={group}
                badgeCount={groupCountTotal}
                right={
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onAddField(group)}
                        title="Thêm mục mới"
                        className="ycx-hit flex items-center gap-1 font-semibold text-xs text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 px-2.5 py-1 rounded-full transition-colors active:scale-95"
                    >
                        <AppIcon name="add" size="sm" />
                        <span>Thêm mục</span>
                    </Button>
                }
            />

            {/* Lưới 2 cột đồng đều; ô lẻ kẻ viền phải */}
            <div className="grid grid-cols-2 [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-r-slate-100 dark:[&>*:nth-child(odd)]:border-r-slate-800/80">
                {COUNT_ITEMS[group].map(item => (
                    <CounterRow
                        key={item.key}
                        icon={item.icon}
                        label={item.label}
                        value={Number(counts[item.key]) || 0}
                        onChange={v => onCount(group, item.key, v)}
                    />
                ))}
                {AMOUNT_ITEMS[group].map(item => (
                    <AmountRow
                        key={item.key}
                        icon={item.icon}
                        label={item.label}
                        value={draft.amounts[item.key] ?? ''}
                        onChange={v => onAmount(item.key, v)}
                    />
                ))}
                {countFields.map(f => (
                    <CounterRow
                        key={f.id}
                        icon={meta.icon}
                        label={f.name}
                        value={Number(counts[f.id]) || 0}
                        onChange={v => onCount(group, f.id, v)}
                        onDelete={() => onDeleteField(f)}
                    />
                ))}
                {revenueFields.map(f => (
                    <AmountRow
                        key={f.id}
                        icon="banknote"
                        label={`${f.name} (Tr)`}
                        value={draft.amounts[f.id] ?? ''}
                        onChange={v => onAmount(f.id, v)}
                        onDelete={() => onDeleteField(f)}
                    />
                ))}
            </div>

            {/* Dòng "khác": tên tự do + stepper */}
            {meta.otherPlaceholder && (
                <div className="flex items-center gap-2 px-2.5 sm:px-3 h-10 lg:h-9 py-1 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-850/50">
                    <Input
                        type="text"
                        placeholder={meta.otherPlaceholder}
                        value={other.name}
                        aria-label={meta.otherPlaceholder}
                        onChange={e => onOther(group, { name: e.target.value })}
                        className="h-7.5 lg:h-7 px-2.5 text-[13px] bg-white dark:bg-slate-900 rounded-control border-slate-200 dark:border-slate-700"
                    />

                    {/* Apple Stepper for Other */}
                    <div
                        className={`inline-flex items-center rounded-full p-0.5 border shadow-2xs shrink-0 transition-all ${
                            other.count > 0
                                ? 'bg-white dark:bg-slate-850 border-sky-300 dark:border-sky-700/80 ring-1 ring-sky-200 dark:ring-sky-900/40'
                                : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/70'
                        }`}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOther(group, { count: Math.max(0, other.count - 1) })}
                            disabled={other.count === 0}
                            aria-label="Giảm mục khác"
                            className="ycx-hit w-6 h-6 sm:w-6.5 sm:h-6.5 min-w-0 min-h-0 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 disabled:opacity-25 disabled:pointer-events-none transition-all duration-150"
                        >
                            <AppIcon name="minus" size="xs" />
                        </Button>

                        <span
                            className={`min-w-[20px] px-1 text-center text-[12px] sm:text-[13px] tabular-nums font-bold transition-colors ${
                                other.count > 0
                                    ? 'text-sky-600 dark:text-sky-400 font-extrabold'
                                    : 'text-slate-400 dark:text-slate-500'
                            }`}
                        >
                            {other.count}
                        </span>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOther(group, { count: other.count + 1 })}
                            aria-label="Tăng mục khác"
                            className={`ycx-hit w-6 h-6 sm:w-6.5 sm:h-6.5 min-w-0 min-h-0 rounded-full flex items-center justify-center active:scale-90 transition-all duration-150 ${
                                other.count > 0
                                    ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-2xs'
                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <AppIcon name="add" size="xs" />
                        </Button>
                    </div>
                </div>
            )}
        </section>
    );
};
