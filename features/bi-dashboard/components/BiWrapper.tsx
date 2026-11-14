import React, { useState, useEffect, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useActiveTab } from '../../../contexts/LayoutContext';
import ErrorBoundary from '../../../components/shared/ui/ErrorBoundary';
import { lazyWithRetry } from '../../../utils/lazyWithRetry';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import '../biDensity.css';

// Tải lười NhanVien (Bonus) an toàn với lazyWithRetry
const NhanVien = lazyWithRetry(() => import('./NhanVien'), 'BiNhanVien');

const TabSpinner = () => (
    <div className="flex items-center justify-center min-h-[30vh]">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-400 animate-pulse">Đang tải module...</p>
        </div>
    </div>
);

const BiWrapper = React.memo(function BiWrapper({ isActive }: { isActive?: boolean }) {
    const { activeTab } = useActiveTab();
    const isThuongTab = activeTab === 'thuong';
    const isTabActive = isActive !== undefined ? isActive : isThuongTab;
    const [mounted, setMounted] = useState(false);

    const [bonusPeriodLabel, setBonusPeriodLabel] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('ycx_latest_bonus_period_label');
        }
        return null;
    });

    useEffect(() => {
        const handleLabel = (e: Event) => {
            const l = (e as CustomEvent).detail?.label;
            if (l) {
                setBonusPeriodLabel(l);
                try { localStorage.setItem('ycx_latest_bonus_period_label', l); } catch {}
            }
        };
        window.addEventListener('ycx-auto-bonus-period-label-changed', handleLabel);
        return () => window.removeEventListener('ycx-auto-bonus-period-label-changed', handleLabel);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTimestamp = bonusPeriodLabel || 'ĐẾN NGÀY HÔM QUA';

    return (
        <div data-density="compact" className="flex flex-col w-full min-h-dvh bi-report-module">
            {/* Portal timestamp into mobile top bar subtitle */}
            {mounted && isTabActive && document.getElementById('mobile-topbar-subtitle') && createPortal(
                <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-full">
                    <span className="inline-flex items-center gap-1 text-left shrink-0">
                        <AppIcon name="clock" size="xs" className="text-sky-500" />
                        <span>{currentTimestamp}</span>
                    </span>
                </div>,
                document.getElementById('mobile-topbar-subtitle')!
            )}

            {/* Portal timestamp into desktop header subtitle */}
            {mounted && isTabActive && document.getElementById('desktop-header-subtitle') && createPortal(
                <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5 text-left text-slate-500 dark:text-slate-400">
                        <AppIcon name="clock" size="xs" className="text-sky-500" />
                        <span>Cập nhật: {currentTimestamp}</span>
                    </span>
                </div>,
                document.getElementById('desktop-header-subtitle')!
            )}

            <main className="p-0 sm:px-4 sm:pb-4 lg:px-8 lg:pb-8 space-y-6 mx-auto w-full flex-grow max-w-[960px]">
                <ErrorBoundary name="Hiệu suất thưởng">
                    <Suspense fallback={<TabSpinner />}>
                        <div className="block relative">
                            <NhanVien isActive={isTabActive} isThuongTab={true} />
                        </div>
                    </Suspense>
                </ErrorBoundary>
            </main>
        </div>
    );
});

export default BiWrapper;
