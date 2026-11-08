import React, { useMemo, useCallback, useRef } from 'react';
import { Employee, BonusMetrics, RevenueRow } from '../../../types/nhanVienTypes';
import { BonusDesktopRow } from './BonusDesktopRow';
import { BonusDisplayRow } from './BonusDisplayRow';
import { getCellColor, computeTierThresholds, isUpdatedToday, getRevenueForEmployee, BonusColumnType, TierThresholds } from './bonusTableHelpers';
import { getBonusForEmployee } from '../../../utils/bonusParser';
import { shortenSupermarketName } from '../../../utils/dashboardHelpers';
import { useIndexedDBState } from '../../../hooks/useIndexedDBState';
import { extractEmployeeId } from '../../../utils/nhanVienHelpers';
import { toast } from '../../../../../components/shared/ui/toast';
import { Button } from '../../../../../components/shared/ui/Button';
import { AppIcon } from '../../../../../components/shared/ui/icon/AppIcon';
import { exportElementAsImage } from '../../../services/uiService';
import { copyBlobToClipboard } from '../../../../../components/shared/ui/imageDelivery';
import { useExportOptionsContext } from '../../../contexts/ExportOptionsContext';

interface BonusTierTableProps {
    displayList: BonusDisplayRow[];
    sortField: string;
    sortDir: 'asc' | 'desc';
    setSortField: (field: string) => void;
    setSortDir: (updater: (d: 'asc' | 'desc') => 'asc' | 'desc') => void;
    highlightedEmployees: Set<string>;
    bonusData: Record<string, BonusMetrics | null>;
    revenueMap: Map<string, RevenueRow>;
    onEmployeeClick: (emp: Employee) => void;
    f: Intl.NumberFormat;
    supermarketName: string;
    anDoanhThu?: boolean;
}

interface TierGroup {
    label: string;
    color: string;
    bgClass: string;
    borderColor: string;
    employees: BonusDisplayRow[];
    sumErp: number;
    sumTnong: number;
    sumTong: number;
    sumDkien: number;
    sumDtqd: number;
    sumHqqd: number;
}

const TIER_CONFIG = [
    { label: 'Nhóm 1', color: '#059669', bgClass: 'bg-emerald-50', borderColor: 'border-emerald-400' },
    { label: 'Nhóm 2', color: '#0284c7', bgClass: 'bg-sky-50', borderColor: 'border-sky-400' },
    { label: 'Nhóm 3', color: '#d97706', bgClass: 'bg-amber-50', borderColor: 'border-amber-400' },
];

export const BonusTierTable: React.FC<BonusTierTableProps> = ({
    displayList, sortField, sortDir, setSortField, setSortDir,
    highlightedEmployees, bonusData, revenueMap, onEmployeeClick, f, supermarketName, anDoanhThu,
}) => {
    const safeName = shortenSupermarketName(supermarketName);
    const [storedQuyDoi] = useIndexedDBState<number>(safeName ? (`targethero-${safeName}-quydoi` as any) : null, 60);
    const targetQuyDoi = storedQuyDoi ?? 60;
    const { showExportOptions } = useExportOptionsContext();
    const tierRefs = useRef<(HTMLDivElement | null)[]>([]);

    const employeeRows = useMemo(() =>
        displayList.filter(item => item.type !== 'department' && item.type !== 'total'),
        [displayList],
    );

    const tiers = useMemo<TierGroup[]>(() => {
        const sorted = [...employeeRows].sort((a, b) => {
            const tA = getBonusForEmployee(bonusData, a.originalName, a.name)?.tong || 0;
            const tB = getBonusForEmployee(bonusData, b.originalName, b.name)?.tong || 0;
            return tB - tA;
        });

        const n = sorted.length;
        if (n === 0) return [];

        const size1 = Math.ceil(n / 3);
        const size2 = Math.ceil((n - size1) / 2);
        const cuts = [size1, size1 + size2, n];

        return TIER_CONFIG.map((cfg, i) => {
            const start = i === 0 ? 0 : cuts[i - 1];
            const emps = sorted.slice(start, cuts[i]);

            const sumErp = emps.reduce((s, e) => s + (getBonusForEmployee(bonusData, e.originalName, e.name)?.erp || 0), 0);
            const sumTnong = emps.reduce((s, e) => s + (getBonusForEmployee(bonusData, e.originalName, e.name)?.tNong || 0), 0);
            const sumTong = emps.reduce((s, e) => s + (getBonusForEmployee(bonusData, e.originalName, e.name)?.tong || 0), 0);
            const sumDkien = emps.reduce((s, e) => s + (getBonusForEmployee(bonusData, e.originalName, e.name)?.dKien || 0), 0);
            const sumDtqd = emps.reduce((s, e) => s + (getRevenueForEmployee(revenueMap, e.originalName, e.name)?.dtqd || 0), 0);
            const sumDtlk = emps.reduce((s, e) => s + (getRevenueForEmployee(revenueMap, e.originalName, e.name)?.dtlk || 0), 0);
            const sumHqqd = sumDtlk > 0 ? ((sumDtqd - sumDtlk) / sumDtlk) * 100 : 0;

            return { ...cfg, employees: emps, sumErp, sumTnong, sumTong, sumDkien, sumDtqd, sumHqqd };
        });
    }, [employeeRows, bonusData, revenueMap]);

    const columnThresholds = useMemo<Record<BonusColumnType, TierThresholds>>(() => {
        const dtqdVals: number[] = [];
        const hqqdVals: number[] = [];
        const erpVals: number[] = [];
        const tnongVals: number[] = [];
        const pnongVals: number[] = [];
        const tongVals: number[] = [];
        const dkienVals: number[] = [];

        employeeRows.forEach(item => {
            const bonus = getBonusForEmployee(bonusData, item.originalName, item.name);
            const rev = getRevenueForEmployee(revenueMap, item.originalName, item.name);

            if (rev && (rev.dtqd > 0 || rev.dtlk > 0)) {
                dtqdVals.push(rev.dtqd);
                hqqdVals.push(rev.hieuQuaQD * 100);
            }
            if (bonus && (bonus.tong > 0 || bonus.dKien > 0 || bonus.erp > 0 || bonus.tNong > 0)) {
                if (bonus.erp) erpVals.push(bonus.erp);
                if (bonus.tNong) tnongVals.push(bonus.tNong);
                if (bonus.pNong) pnongVals.push(bonus.pNong);
                if (bonus.tong) tongVals.push(bonus.tong);
                if (bonus.dKien) dkienVals.push(bonus.dKien);
            }
        });

        return {
            dtqd: computeTierThresholds(dtqdVals),
            hqqd: computeTierThresholds(hqqdVals),
            erp: computeTierThresholds(erpVals),
            tnong: computeTierThresholds(tnongVals),
            pnong: computeTierThresholds(pnongVals),
            tong: computeTierThresholds(tongVals),
            dkien: computeTierThresholds(dkienVals),
        };
    }, [employeeRows, bonusData, revenueMap]);

    const getRowCellColor = useCallback((val: number, type: BonusColumnType, hasData: boolean = true) => {
        return getCellColor(val, columnThresholds[type], hasData);
    }, [columnThresholds]);

    const handleCopyGroup = useCallback(async (tier: TierGroup) => {
        const text = tier.employees.map(e => {
            const id = extractEmployeeId(e.originalName || e.name);
            return id ? `@${id}` : e.name;
        }).join('\n');

        try {
            await navigator.clipboard.writeText(text);
            toast.success(`Đã copy ${tier.employees.length} nhân viên ${tier.label}`);
        } catch {
            toast.error('Không thể copy');
        }
    }, []);

    const handleCopyTierImage = useCallback(async (tierIndex: number, tierLabel: string) => {
        const el = tierRefs.current[tierIndex];
        if (!el) return;
        try {
            const name = `${tierLabel} - ${supermarketName}.png`;
            const blob = await exportElementAsImage(el, name, {
                mode: 'blob-only',
                elementsToHide: ['.no-print'],
                isCompactTable: true,
            });
            if (blob) {
                const ok = await copyBlobToClipboard(blob);
                if (ok) toast.success(`Đã copy ảnh ${tierLabel}`);
                else toast.error('Trình duyệt không hỗ trợ copy ảnh');
            }
        } catch (err) {
            console.error('Copy tier image error', err);
            toast.error('Lỗi copy ảnh');
        }
    }, [supermarketName]);

    const handleExportTier = useCallback(async (tierIndex: number, tierLabel: string) => {
        const el = tierRefs.current[tierIndex];
        if (!el) return;
        try {
            const name = `${tierLabel} - ${supermarketName}.png`;
            const blob = await exportElementAsImage(el, name, {
                mode: 'blob-only',
                elementsToHide: ['.no-print'],
                isCompactTable: true,
            });
            if (blob) showExportOptions(blob, name);
        } catch (err) {
            console.error('Export tier error', err);
        }
    }, [supermarketName, showExportOptions]);

    const renderTierHeader = (colSpan: number) => (
        <tr>
            <th rowSpan={2} className="px-2 py-1 text-center text-[11px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 border-l-[4px] border-l-slate-300 border-r border-b border-slate-200 cursor-pointer hover:bg-slate-200 align-middle whitespace-nowrap w-[185px] min-w-[170px] max-w-[200px]" onClick={() => { setSortField('name'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Nhân viên</th>
            {!anDoanhThu && <th colSpan={2} className="px-2 py-1 text-center text-[11px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 border-l border-r border-b border-slate-200">Doanh thu</th>}
            <th colSpan={4} className="px-2 py-1 text-center text-[11px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 border-l border-r border-b border-slate-200">Thưởng</th>
            <th rowSpan={2} className="px-2 py-1 text-center text-[11px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 border-l border-b border-slate-200 cursor-pointer hover:bg-slate-200 align-middle leading-tight" onClick={() => { setSortField('dKien'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Dự Kiến</th>
        </tr>
    );

    const renderSubHeaders = () => (
        <tr>
            {!anDoanhThu && <th className="border-l border-slate-200 px-1.5 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-r border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => { setSortField('dtqd'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>DTQĐ</th>}
            {!anDoanhThu && <th className="px-1.5 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-r border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => { setSortField('hqqd'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>HQQĐ</th>}
            <th className="border-l border-slate-200 px-1.5 py-1 text-center text-[11px] font-black uppercase tracking-wider text-sky-700 bg-sky-50/60 border-r border-b border-slate-200 cursor-pointer hover:bg-sky-100/70 transition-colors" onClick={() => { setSortField('erp'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>ERP</th>
            <th className="px-1.5 py-1 text-center text-[11px] font-black uppercase tracking-wider text-amber-700 bg-amber-50/60 border-r border-b border-slate-200 cursor-pointer hover:bg-amber-100/70 transition-colors" onClick={() => { setSortField('tNong'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>T.Nóng</th>
            <th className="px-1.5 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-r border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => { setSortField('pNong'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>%T.Nóng</th>
            <th className="px-1.5 py-1 text-center text-[11px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100/90 border-r border-b border-emerald-300 cursor-pointer hover:bg-emerald-200/90 transition-colors shadow-sm" onClick={() => { setSortField('tong'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Tổng</th>
        </tr>
    );

    const colCount = anDoanhThu ? 6 : 8;

    if (tiers.length === 0) return null;

    return (
        <div className="space-y-3 py-2">
            {tiers.map((tier, tierIdx) => {
                if (tier.employees.length === 0) return null;
                return (
                    <div key={tier.label} ref={el => { tierRefs.current[tierIdx] = el; }} className="bg-white">
                        {/* Tier header bar */}
                        <div className={`flex items-center justify-between px-3 py-1.5 ${tier.bgClass} border-b-2 ${tier.borderColor}`}>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[11px] font-black" style={{ backgroundColor: tier.color }}>{tierIdx + 1}</span>
                                <span className="text-[13px] font-bold" style={{ color: tier.color }}>{tier.label}</span>
                                <span className="text-[11px] text-slate-500 tabular-nums">({tier.employees.length} người · Tổng {f.format(Math.ceil(tier.sumTong / 1000))})</span>
                            </div>
                            <div className="flex items-center gap-1 no-print">
                                <Button variant="secondary" size="xs" data-ui="bi" className="gap-1" onClick={() => handleCopyGroup(tier)} title={`Copy danh sách ${tier.label}`}>
                                    <AppIcon name="copy" size="xs" />
                                    <span className="hidden sm:inline">Copy</span>
                                </Button>
                                <Button variant="secondary" size="xs" data-ui="bi" className="gap-1" onClick={() => handleCopyTierImage(tierIdx, tier.label)} title={`Copy ảnh ${tier.label} vào clipboard`}>
                                    <AppIcon name="copyImage" size="xs" />
                                    <span className="hidden sm:inline">Copy ảnh</span>
                                </Button>
                                <Button variant="secondary" size="xs" data-ui="bi" className="gap-1" onClick={() => handleExportTier(tierIdx, tier.label)} title={`Xuất ảnh ${tier.label}`}>
                                    <AppIcon name="image" size="xs" />
                                    <span className="hidden sm:inline">Ảnh</span>
                                </Button>
                            </div>
                        </div>

                        {/* Tier table */}
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="table-pin-first w-full border-collapse compact-export-table">
                                <thead className="sticky top-0 z-10">
                                    {renderTierHeader(colCount)}
                                    {renderSubHeaders()}
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-100">
                                    {tier.employees.map((item, idx) => {
                                        const keyName = item.originalName || item.name;
                                        const isHighlighted = highlightedEmployees.has(keyName);
                                        const bonus = getBonusForEmployee(bonusData, item.originalName, item.name);
                                        const rev = getRevenueForEmployee(revenueMap, item.originalName, item.name);
                                        const dtqdVal = rev?.dtqd || 0, hqqdVal = rev ? (rev.hieuQuaQD * 100) : 0;
                                        const erpVal = bonus?.erp || 0, tnongVal = bonus?.tNong || 0, pnongVal = bonus?.pNong || 0;
                                        const tongVal = bonus?.tong || 0, dkienVal = bonus?.dKien || 0;
                                        const isStale = !isUpdatedToday(bonus?.updatedAt);

                                        return (
                                            <BonusDesktopRow
                                                key={item.originalName}
                                                item={{ ...item, rank: idx + 1 }}
                                                isHighlighted={isHighlighted}
                                                isStale={isStale}
                                                dtqdVal={dtqdVal}
                                                hqqdVal={hqqdVal}
                                                erpVal={erpVal}
                                                tnongVal={tnongVal}
                                                pnongVal={pnongVal}
                                                tongVal={tongVal}
                                                dkienVal={dkienVal}
                                                pctDkht={rev?.pctDkht}
                                                hasTarget={(rev?.calculatedTarget || 0) > 0}
                                                onEmployeeClick={onEmployeeClick}
                                                getCellColor={getRowCellColor}
                                                f={f}
                                                anDoanhThu={anDoanhThu}
                                                supermarketName={supermarketName}
                                                targetQuyDoi={targetQuyDoi}
                                            />
                                        );
                                    })}
                                    {/* Tier total row */}
                                    <tr style={{ borderLeft: `4px solid ${tier.color}` }} className={`${tier.bgClass} font-bold text-slate-700 border-t border-slate-200`}>
                                        <td className="px-2 py-1 text-[12px] uppercase tracking-wider border-r whitespace-nowrap border-slate-200">Tổng {tier.label}</td>
                                        {!anDoanhThu && <td className="px-1.5 py-1 text-[12px] text-center border-r tabular-nums font-bold border-slate-200 border-l">{tier.sumDtqd ? f.format(tier.sumDtqd) : '-'}</td>}
                                        {!anDoanhThu && <td className={`px-1.5 py-1 text-[12px] text-center border-r tabular-nums font-bold border-slate-200 ${tier.sumHqqd >= targetQuyDoi ? 'text-emerald-600' : 'text-rose-500'}`}>{tier.sumHqqd ? tier.sumHqqd.toFixed(0) + '%' : '-'}</td>}
                                        <td className="px-1.5 py-1 text-[12px] text-center border-r tabular-nums font-black border-slate-200 border-l text-sky-700">{f.format(Math.ceil(tier.sumErp / 1000))}</td>
                                        <td className="px-1.5 py-1 text-[12px] text-center border-r tabular-nums font-black border-slate-200 text-amber-600">{f.format(Math.ceil(tier.sumTnong / 1000))}</td>
                                        <td className="px-1.5 py-1 text-[12px] text-center border-r tabular-nums font-bold border-slate-200">{tier.sumTong ? Math.round(tier.sumTnong / tier.sumTong * 100) + '%' : '-'}</td>
                                        <td className="px-1.5 py-1 text-[12px] text-center border-r tabular-nums font-black border-slate-200 bg-emerald-100/90 text-emerald-800">{f.format(Math.ceil(tier.sumTong / 1000))}</td>
                                        <td className="px-1.5 py-1 text-[12px] text-center tabular-nums font-extrabold border-l border-slate-200 text-amber-600 bg-amber-50/30">{f.format(Math.ceil(tier.sumDkien / 1000))}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
