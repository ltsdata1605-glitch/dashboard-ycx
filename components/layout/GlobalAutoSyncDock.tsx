import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '../shared/ui/toast';
import { Button } from '../shared/ui/Button';
import { AppIcon } from '../shared/ui/icon';
import AutoSyncScheduleButton from './AutoSyncScheduleButton';
import {
    claimScheduleRun, dueSchedules, logSchedule, missedSchedules, readLastTick, writeLastTick, getSchedules, loadSchedules, nextScheduleLabel, onSchedulesChanged, scheduleHasRun,
    SCHEDULE_LABELS, type ScheduleKey, type Schedules,
} from '../../services/autoSyncSchedule';
import { useAuth } from '../../contexts/AuthContext';
import { useMenuConfig } from '../../contexts/MenuConfigContext';
import { AUTO_SYNC_PARENT_MAP } from '../../constants/autoSyncCards';
import { useIndexedDBState } from '../../features/bi-dashboard/hooks/useIndexedDBState';
import { TampermonkeyInstallGuideModal } from '../../features/bi-dashboard/components/common/TampermonkeyInstallGuideModal';
import { GlobalAutoBonusManager } from '../../features/bi-dashboard/components/nhanvien/bonus/GlobalAutoBonusManager';
import { getTnbMbmCode, openTnbData } from '../../services/tnbDataService';
import TnbDataConfigModal from '../modals/TnbDataConfigModal';

export default function GlobalAutoSyncDock() {
    const { isFeatureEnabled } = useMenuConfig();
    const hien = (id: string) => {
        if (!isFeatureEnabled(id)) return false;
        const parents = AUTO_SYNC_PARENT_MAP[id];
        if (parents) return parents.some(p => isFeatureEnabled(p));
        return true;
    };
    const { user, departmentId } = useAuth();

    const [dockThuGonLuu, setIsDockCollapsed] = useIndexedDBState<boolean>('bi-dock-collapsed', false);

    // Trên mobile (< 1024px): Tắt hoàn toàn tính năng đổ dữ liệu tự động
    const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false));
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Màn hình hẹp < 1536px: mặc định thu gọn thành cột icon để không che dữ liệu
    const [manHep, setManHep] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 1536 : false));
    const [dockMoTam, setDockMoTam] = useState(false);
    const isDockCollapsed = manHep ? !dockMoTam : dockThuGonLuu;
    const moDock = () => (manHep ? setDockMoTam(true) : setIsDockCollapsed(false));
    const thuGonDock = () => (manHep ? setDockMoTam(false) : setIsDockCollapsed(true));

    const [showGuideModal, setShowGuideModal] = useState(false);
    const [bonusStatus, setBonusStatus] = useState<{ isBusy: boolean; label?: string }>({ isBusy: false });

    const [lich, setLich] = useState<Schedules>(() => getSchedules());
    useEffect(() => {
        void loadSchedules().then(() => setLich({ ...getSchedules() }));
        return onSchedulesChanged(() => setLich({ ...getSchedules() }));
    }, []);

    const [, nhipPhut] = useState(0);
    useEffect(() => { const t = setInterval(() => nhipPhut((n) => n + 1), 60_000); return () => clearInterval(t); }, []);
    const nhanHen = (k: ScheduleKey) => { const t = nextScheduleLabel(lich[k]); return t ? `⏰ Hẹn ${t}` : null; };

    // ─── TNB Data Setup (Sức Khỏe Siêu Thị) ───
    const [tnbCode, setTnbCode] = useState<string>('');
    const [isTnbModalOpen, setIsTnbModalOpen] = useState(false);
    useEffect(() => {
        void getTnbMbmCode(user, departmentId).then((c) => setTnbCode(c));
    }, [user, departmentId]);
    const handleOpenTnbData = useCallback(() => {
        if (tnbCode && tnbCode.trim()) {
            openTnbData(tnbCode);
            toast.success(`Đang mở TNB Data với mã ${tnbCode}...`, { id: 'tnb-data-launch', duration: 3000 });
        } else {
            setIsTnbModalOpen(true);
        }
    }, [tnbCode]);

    useEffect(() => {
        const handleResize = () => setManHep(window.innerWidth < 1536);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Lắng nghe trạng thái tiến trình Tự động Đổ Thưởng từ AutoBonusPanel
    useEffect(() => {
        const handleBonusStatus = (e: any) => {
            const d = e.detail;
            if (d?.isBusy) {
                let lbl = 'Đang chạy...';
                if (d.progress) lbl = `${d.progress.done}/${d.progress.total}`;
                else if (d.monthProgress) lbl = `Kỳ ${d.monthProgress.monthIndex + 1}/${d.monthProgress.monthTotal}`;
                setBonusStatus({ isBusy: true, label: lbl });
            } else {
                setBonusStatus({ isBusy: false });
            }
        };
        window.addEventListener('ycx-auto-bonus-status-changed', handleBonusStatus);
        return () => window.removeEventListener('ycx-auto-bonus-status-changed', handleBonusStatus);
    }, []);

    // ─── Handlers ───
    const handleTriggerAutoBonus = useCallback((auto?: unknown) => {
        if (isMobile) return;
        const tuDong = auto === true;
        window.dispatchEvent(new CustomEvent('ycx-trigger-auto-bonus', { detail: { auto: tuDong } }));
    }, [isMobile]);

    // ─── Hẹn giờ tự chạy (services/autoSyncSchedule.ts) ───
    const chayTheoLichRef = useRef<(k: ScheduleKey) => void>(() => {});
    chayTheoLichRef.current = (k: ScheduleKey) => {
        if (isMobile) return;
        if (k === 'bonus') handleTriggerAutoBonus(true);
    };

    useEffect(() => {
        if (isMobile) return;

        let daTai = false;
        void loadSchedules().then(() => { daTai = true; });
        const tick = () => {
            if (!daTai) return;
            const now = new Date();
            const truoc = readLastTick();
            writeLastTick(now.getTime());
            for (const lo of missedSchedules(getSchedules(), truoc, now, scheduleHasRun)) {
                if (!claimScheduleRun(lo.marker)) continue;
                const phut = Math.round((now.getTime() - truoc) / 60_000);
                logSchedule({ key: lo.key, time: lo.time, status: 'missed', note: `trang không hoạt động ${phut} phút (tab ngủ / máy ngủ / chưa mở dashboard)` });
            }
            const den = dueSchedules(getSchedules(), now, scheduleHasRun)[0];
            if (!den || !claimScheduleRun(den.marker)) return;
            logSchedule({ key: den.key, time: den.time, status: 'started', note: document.visibilityState === 'visible' ? undefined : 'tab đang nằm nền' });
            toast(`⏰ ${den.time} — tự chạy ${SCHEDULE_LABELS[den.key] || 'Đổ thưởng'}`, { duration: 6000 });
            try { chayTheoLichRef.current(den.key); } catch (e) {
                logSchedule({ key: den.key, time: den.time, status: 'error', note: e instanceof Error ? e.message : String(e) });
            }
        };
        const t0 = setTimeout(tick, 5000);
        const t = setInterval(tick, 30_000);

        let w: Worker | null = null;
        try {
            w = new Worker(new URL('../../services/scheduleHeartbeat.worker.ts', import.meta.url), { type: 'module' });
            w.onmessage = tick;
        } catch { /* ignore */ }

        const onWake = () => { if (document.visibilityState === 'visible') tick(); };
        document.addEventListener('visibilitychange', onWake);
        window.addEventListener('focus', tick);
        window.addEventListener('online', tick);
        document.addEventListener('resume', tick);
        return () => {
            clearTimeout(t0); clearInterval(t); w?.terminate();
            document.removeEventListener('visibilitychange', onWake);
            window.removeEventListener('focus', tick);
            window.removeEventListener('online', tick);
            document.removeEventListener('resume', tick);
        };
    }, [isMobile]);

    const coNutNao = ['auto-bonus', 'auto-tnb'].some(id => hien(id));

    // Trên mobile (< 1024px): Không render dock
    if (isMobile) return null;

    return (
        <>
            {coNutNao && (
                <aside
                    aria-label="Thao tác tự động Auto Sync Pro"
                    data-testid="ycx-auto-dock"
                    className={`preserve-rounded hidden lg:flex flex-col fixed right-4 xl:right-7 top-[72px] z-40 transition-all duration-300 ease-out no-print hide-on-export select-none animate-in fade-in slide-in-from-right-4 ${
                        isDockCollapsed ? 'w-auto p-1.5' : 'w-[224px] p-3 gap-2.5'
                    } rounded-card ycx-glass`}
                    data-glass="panel" data-glass-tone="strong"
                >
                    {isDockCollapsed ? (
                        <div className="preserve-rounded flex flex-col items-center gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={moDock}
                                title="Mở rộng bảng Auto Sync"
                                aria-label="Mở rộng khung Auto Sync"
                                className="preserve-rounded text-slate-500 hover:text-slate-800 dark:hover:text-white dark:hover:bg-slate-800"
                            >
                                <AppIcon name="chevronLeft" size="md" />
                            </Button>
                            {hien('auto-bonus') && (
                                <Button
                                    type="button"
                                    variant="card"
                                    size="none"
                                    onClick={handleTriggerAutoBonus}
                                    title={bonusStatus.isBusy ? `Tự động Đổ Thưởng (${bonusStatus.label || 'Đang chạy'})` : 'Tự động Đổ Thưởng'}
                                    className={`preserve-rounded relative p-2.5 rounded-popup bg-gradient-to-br from-sky-600 via-sky-600 to-sky-700 text-white shadow-md hover:scale-110 active:scale-95 ${
                                        bonusStatus.isBusy ? 'ring-2 ring-sky-400 animate-pulse' : ''
                                    }`}
                                >
                                    <AppIcon name="gift" size="md" className="text-sky-100" />
                                    {lich['bonus']?.enabled && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" aria-label="Có hẹn giờ" />}
                                </Button>
                            )}
                            {hien('auto-tnb') && (
                                <Button
                                    type="button"
                                    variant="card"
                                    size="none"
                                    onClick={handleOpenTnbData}
                                    title={tnbCode ? `Tự động TNB Data (Mã: ${tnbCode})` : 'Tự động TNB Data (Sức Khỏe Siêu Thị)'}
                                    aria-label="Tự động TNB Data"
                                    className="preserve-rounded relative p-2.5 rounded-popup bg-gradient-to-br from-sky-700 via-sky-800 to-slate-900 text-white shadow-md hover:scale-110 active:scale-95"
                                >
                                    <AppIcon name="database" size="md" className="text-sky-100" />
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60 dark:border-slate-800/80">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[12px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                                        AUTO SYNC
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={thuGonDock}
                                    title="Thu gọn thành cột icon"
                                    aria-label="Thu gọn dock"
                                    className="preserve-rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                    <AppIcon name="chevronRight" size="xs" />
                                </Button>
                            </div>

                            {hien('auto-bonus') && (
                                <div className="relative">
                                    <Button
                                        type="button"
                                        variant="row"
                                        size="none"
                                        onClick={handleTriggerAutoBonus}
                                        title="Tự động thu thập điểm và đổ thưởng nhân viên từ HRM qua Tampermonkey"
                                        className="preserve-rounded group relative overflow-hidden gap-2 pl-2.5 pr-8 py-1.5 rounded-popup font-bold text-white bg-gradient-to-r from-sky-600 via-sky-600 to-sky-600 hover:from-sky-500 hover:from-sky-500 active:from-sky-700 active:to-sky-700 border border-sky-300/40 dark:border-sky-400/30 shadow-[0_4px_14px_rgba(147,51,234,0.28),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:shadow-[0_6px_18px_rgba(147,51,234,0.4),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
                                    >
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 pointer-events-none" />
                                        <div className={`preserve-rounded relative w-7 h-7 rounded-md bg-black/15 flex items-center justify-center shrink-0 border border-white/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform duration-200 ${
                                            bonusStatus.isBusy ? 'animate-pulse' : ''
                                        }`}>
                                            <AppIcon name="gift" size="sm" className="text-sky-100 drop-shadow-[0_0_6px_rgba(216,180,254,0.9)]" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[12px] font-bold text-white tracking-tight leading-tight drop-shadow-sm truncate">
                                                Đổ Thưởng
                                            </span>
                                            <span className="text-[11px] font-semibold text-sky-100/90 leading-none mt-0.5 truncate">
                                                {bonusStatus.isBusy ? (bonusStatus.label || 'Đang xử lý...') : (nhanHen('bonus') || 'Nhân viên')}
                                            </span>
                                        </div>
                                    </Button>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <AutoSyncScheduleButton scheduleKey="bonus" tone="dark" compact />
                                    </div>
                                </div>
                            )}

                            {hien('auto-tnb') && (
                                <div className="relative">
                                    <Button
                                        type="button"
                                        variant="row"
                                        size="none"
                                        onClick={handleOpenTnbData}
                                        title="Tự động tra cứu dữ liệu Sức Khỏe Siêu Thị trên admintnb.com/data bằng mã bảo mật"
                                        aria-label="Tự động TNB Data"
                                        className="preserve-rounded group relative overflow-hidden gap-2 pl-2.5 pr-8 py-1.5 rounded-popup font-bold text-white bg-gradient-to-r from-sky-700 via-sky-800 to-slate-900 hover:from-sky-600 hover:to-slate-800 active:from-sky-800 active:to-slate-900 border border-sky-400/40 shadow-[0_4px_14px_rgba(3,105,161,0.28),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:shadow-[0_6px_18px_rgba(3,105,161,0.4),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:-translate-y-0.5 active:translate-y-0.5 active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
                                    >
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 pointer-events-none" />
                                        <div className="preserve-rounded relative w-7 h-7 rounded-md bg-black/15 flex items-center justify-center shrink-0 border border-white/25 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)] group-hover:scale-105 transition-transform duration-200">
                                            <AppIcon name="database" size="sm" className="text-sky-100 drop-shadow-[0_0_6px_rgba(186,230,253,0.9)]" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[12px] font-bold text-white tracking-tight leading-tight drop-shadow-sm truncate">
                                                TNB Data
                                            </span>
                                            <span className="text-[11px] font-semibold text-sky-100/90 leading-none mt-0.5 truncate">
                                                {tnbCode ? `Mã: ${tnbCode}` : 'Sức khỏe ST'}
                                            </span>
                                        </div>
                                    </Button>
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsTnbModalOpen(true);
                                            }}
                                            title="Cài đặt / Đổi mã bảo mật TNB"
                                            aria-label="Cài đặt mã bảo mật TNB"
                                            className="text-sky-200 hover:text-white hover:bg-white/15 active:scale-95"
                                        >
                                            <AppIcon name="settings" size="xs" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="button"
                                variant="link"
                                size="none"
                                onClick={() => setShowGuideModal(true)}
                                title="Bấm để xem hướng dẫn cài đặt hoặc kiểm tra kết nối"
                                className="preserve-rounded flex items-center justify-center gap-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] font-bold uppercase tracking-tight text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer w-full text-center"
                            >
                                <AppIcon name="sparkles" size="xs" className="text-amber-500/80" />
                                <span>HƯỚNG DẪN CÀI ĐẶT</span>
                            </Button>
                        </>
                    )}
                </aside>
            )}

            <GlobalAutoBonusManager />
            <TampermonkeyInstallGuideModal
                isOpen={showGuideModal}
                onClose={() => setShowGuideModal(false)}
            />
            <TnbDataConfigModal
                isOpen={isTnbModalOpen}
                onClose={() => setIsTnbModalOpen(false)}
                onSaved={(newCode) => setTnbCode(newCode)}
                initialCode={tnbCode}
            />
        </>
    );
}
