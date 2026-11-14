import React, { useMemo, useRef } from 'react';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { Button } from '../../../components/shared/ui/Button';
import { Tabs } from '../../../components/shared/ui/Tabs';
import { KpiCard } from '../../../components/shared/ui/KpiCard';
import type { SavedReport, CustomField, DashboardRange, ItemGroup } from '../types';
import { GROUP_META, AMOUNT_ITEMS, customRevenueFields } from '../catalog';
import { summarize, isInRange, type RankedItem } from '../utils/aggregate';
import { fmtTr } from '../utils/reportText';
import { BandHeader } from './GroupSection';
import { shareElementAsImage } from '../utils/exportImage';

interface DashboardTabProps {
    reports: SavedReport[];
    fields: CustomField[];
    staffName: string;
    range: DashboardRange;
    onRangeChange: (r: DashboardRange) => void;
}

const RANGE_ITEMS = [
    { id: 'today', label: 'Hôm nay' },
    { id: 'week', label: 'Tuần này' },
    { id: 'month', label: 'Tháng này' },
];
const RANGE_LABEL: Record<DashboardRange, string> = { today: 'hôm nay', week: 'tuần này', month: 'tháng này' };
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** Bảng xếp hạng một nhóm: tên · thanh tỉ lệ · số. */
const RankingTable: React.FC<{ group: ItemGroup; items: RankedItem[]; otherCount: number }> = ({ group, items, otherCount }) => {
    const max = Math.max(1, ...items.map(i => i.count));
    const total = items.reduce((s, i) => s + i.count, 0) + otherCount;
    return (
        <section className="rounded-card border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            <BandHeader
                icon={GROUP_META[group].icon}
                title={GROUP_META[group].label}
                groupType={group}
                right={
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                        Tổng <b className="text-slate-900 dark:text-white font-extrabold">{total}</b>
                    </span>
                }
            />
            <table className="w-full text-[13px] tabular-nums">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {items.map(i => (
                        <tr key={i.key} className={`h-8 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors ${i.count > 0 ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                            <td className="px-3 py-0 w-[42%] truncate">{i.label}</td>
                            <td className="px-2 py-0">
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full w-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${i.count > 0 ? 'bg-sky-500' : ''}`}
                                        style={{ width: `${(i.count / max) * 100}%` }}
                                    />
                                </div>
                            </td>
                            <td className="px-3 py-0 w-12 text-right font-bold text-slate-900 dark:text-white">{i.count}</td>
                        </tr>
                    ))}
                    {otherCount > 0 && (
                        <tr className="h-8 text-slate-700 dark:text-slate-300 font-medium">
                            <td className="px-3 py-0">Khác</td>
                            <td className="px-2 py-0" />
                            <td className="px-3 py-0 text-right font-bold">{otherCount}</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </section>
    );
};

export const DashboardTab: React.FC<DashboardTabProps> = ({ reports, fields, staffName, range, onRangeChange }) => {
    const captureRef = useRef<HTMLDivElement>(null);
    const filtered = useMemo(() => reports.filter(r => isInRange(r.date, range)), [reports, range]);
    const s = useMemo(() => summarize(filtered, fields), [filtered, fields]);
    const svcRevenueFields = customRevenueFields(fields, 'services');
    const accRevenueFields = customRevenueFields(fields, 'accessories');
    const insRevenueFields = customRevenueFields(fields, 'insurance');

    return (
        <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2.5 flex-wrap">
                <Tabs items={RANGE_ITEMS} activeId={range} onChange={id => onRangeChange(id as DashboardRange)} variant="chips" size="sm" />
                <Button
                    variant="secondary"
                    size="sm"
                    className="ycx-hit h-9 px-3 rounded-full font-semibold shadow-2xs hover:border-sky-300"
                    leftIcon={<AppIcon name="share" size="sm" />}
                    onClick={() => shareElementAsImage(captureRef.current, `bieu-do-${new Date().toISOString().slice(0, 10)}.png`, 'Báo cáo doanh số cá nhân')}
                >
                    Xuất ảnh
                </Button>
            </div>

            <div ref={captureRef} className="space-y-3.5 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-card border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Doanh số cá nhân · {RANGE_LABEL[range]}
                        </span>
                        {staffName && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50">
                                {staffName}
                            </span>
                        )}
                    </div>
                    <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                        {new Date().toLocaleDateString('vi-VN')} · <b className="text-slate-700 dark:text-slate-300">{s.orders}</b> đơn
                    </span>
                </div>

                {filtered.length === 0 ? (
                    <div className="relative group my-2">
                        <div className="relative bg-slate-50/60 dark:bg-slate-850/60 rounded-popup border border-slate-200/80 dark:border-slate-700/80 px-4 py-12 text-center">
                            <span className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-2">
                                <AppIcon name="chartBar" size="md" />
                            </span>
                            <p className="text-[13px] text-slate-500 dark:text-slate-400">
                                Chưa có đơn hàng nào {RANGE_LABEL[range]}. Bấm <b className="text-sky-600 dark:text-sky-400">Báo cáo</b> ở tab Nhập báo cáo để ghi nhận.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3" data-testid="kpi-strip">
                            <KpiCard icon="banknote" iconColor="sky" title="Tổng doanh số" trendLabel="Số đơn" trendValue={<span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/40 tabular-nums shrink-0">{s.orders}</span>}>
                                <div className="flex items-baseline justify-center gap-1 w-full overflow-hidden">
                                    <span className="text-[20px] sm:text-[26px] lg:text-[28px] font-black leading-none tracking-tight tabular-nums text-slate-900 dark:text-white">{fmtTr(s.revenueTotal)}</span>
                                    <span className="text-[12px] sm:text-[14px] font-extrabold text-slate-400 dark:text-slate-500">Tr</span>
                                </div>
                            </KpiCard>
                            <KpiCard icon="credit-card" iconColor="emerald" title="Trả góp" trendLabel="Tỉ lệ" trendValue={<span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40 tabular-nums shrink-0">{pct(s.traGopCount, s.orders)}%</span>}>
                                <div className="flex items-baseline justify-center gap-1 w-full overflow-hidden">
                                    <span className="text-[20px] sm:text-[26px] lg:text-[28px] font-black leading-none tracking-tight tabular-nums text-emerald-700 dark:text-emerald-400">{s.traGopCount}</span>
                                    <span className="text-[12px] sm:text-[14px] font-extrabold text-slate-400 dark:text-slate-500">đơn</span>
                                </div>
                            </KpiCard>
                            <KpiCard icon="wallet" iconColor="sky" title="Mở Ví" trendLabel="Tỉ lệ" trendValue={<span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/40 tabular-nums shrink-0">{pct(s.moViCount, s.orders)}%</span>}>
                                <div className="flex items-baseline justify-center gap-1 w-full overflow-hidden">
                                    <span className="text-[20px] sm:text-[26px] lg:text-[28px] font-black leading-none tracking-tight tabular-nums text-sky-700 dark:text-sky-400">{s.moViCount}</span>
                                    <span className="text-[12px] sm:text-[14px] font-extrabold text-slate-400 dark:text-slate-500">đơn</span>
                                </div>
                            </KpiCard>
                            <KpiCard icon="swords" iconColor="rose" title="Chiến giá" trendLabel="Bảo hiểm" trendValue={<span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/40 tabular-nums shrink-0">{fmtTr(s.insuranceTr)} Tr</span>}>
                                <div className="flex items-baseline justify-center gap-1 w-full overflow-hidden">
                                    <span className="text-[20px] sm:text-[26px] lg:text-[28px] font-black leading-none tracking-tight tabular-nums text-rose-700 dark:text-rose-400">{s.priceWarCount}</span>
                                    <span className="text-[12px] sm:text-[14px] font-extrabold text-slate-400 dark:text-slate-500">đơn</span>
                                </div>
                            </KpiCard>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <RankingTable group="products" items={s.ranking.products} otherCount={s.otherCounts.products} />
                            <section className="rounded-card border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                                <BandHeader
                                    icon={GROUP_META.insurance.icon}
                                    title={GROUP_META.insurance.label}
                                    groupType="insurance"
                                    right={
                                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                                            Bảo hiểm <b className="text-slate-900 dark:text-white font-extrabold">{fmtTr(s.insuranceTr)} Tr</b>
                                        </span>
                                    }
                                />
                                <table className="w-full text-[13px] tabular-nums">
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                        {s.ranking.insurance.map(i => (
                                            <tr key={i.key} className={`h-8 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors ${i.count > 0 ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                                                <td className="px-3">{i.label}</td>
                                                <td className="px-3 text-right font-bold">{i.count}</td>
                                            </tr>
                                        ))}
                                        {AMOUNT_ITEMS.insurance.map(item => (
                                            <tr key={item.key} className={`h-8 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors ${(s.amounts[item.key] ?? 0) > 0 ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                                                <td className="px-3">{item.label.replace(' (Tr)', '')}</td>
                                                <td className="px-3 text-right font-bold">{fmtTr(s.amounts[item.key] ?? 0)} Tr</td>
                                            </tr>
                                        ))}
                                        {insRevenueFields.map(f => (
                                            <tr key={f.id} className="h-8 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                                                <td className="px-3 text-slate-600 dark:text-slate-400">{f.name}</td>
                                                <td className="px-3 text-right font-bold">{fmtTr(s.customRevenue[f.id] ?? 0)} Tr</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>
                            <RankingTable group="accessories" items={s.ranking.accessories} otherCount={s.otherCounts.accessories} />
                            <RankingTable group="household" items={s.ranking.household} otherCount={s.otherCounts.household} />
                            <RankingTable group="services" items={s.ranking.services} otherCount={s.otherCounts.services} />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
