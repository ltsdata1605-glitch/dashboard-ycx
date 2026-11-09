import React, { useEffect, useState } from 'react';
import { AppIcon } from '../shared/ui/icon';
import { Button } from '../shared/ui/Button';
import { isRunningStandalone, readDismissedAt, shouldShowInstallHint, writeDismissedAt } from './installHint';
import { InstallGuideModal } from './InstallGuideModal';

/** Hiện chậm 1,5 giây: để người dùng kịp thấy trang mà không phải chờ đợi quá lâu. */
const SHOW_DELAY_MS = 1500;

/**
 * Nhắc cài app lên màn hình chính — CHỈ Safari trên iPhone, khi chưa cài, không phải màn In Sticker/Phân Ca.
 * "Để sau" → 14 ngày mới nhắc lại. iOS không có API cài app (beforeinstallprompt chỉ có ở Android/Chrome) nên chỉ hướng dẫn được.
 *
 * 2026-10-10 (KE_HOACH_GIAO_DIEN_APPLE.md lỗi #10): bản cũ là thẻ to (~140px) NỔI ở đáy, đè lên nội dung ngay trên thanh tab
 * — che cả nút "Xuất hàng loạt" (test xuat-hang-loat-dien-thoai… đỏ vì bị chặn bấm). Nay là dải mảnh NẰM TRONG trang ở đầu
 * nội dung, kiểu Smart App Banner của Safari: không che gì; hướng dẫn chi tiết mở trong sheet khi bấm "Xem cách".
 */
const InstallAppHint: React.FC<{ hidden?: boolean }> = ({ hidden }) => {
    const [visible, setVisible] = useState(false);
    const [guideOpen, setGuideOpen] = useState(false);

    useEffect(() => {
        const ok = shouldShowInstallHint({
            ua: navigator.userAgent,
            isStandalone: isRunningStandalone(),
            dismissedAt: readDismissedAt(),
            now: Date.now(),
        });
        if (!ok) return;
        const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
        return () => clearTimeout(t);
    }, []);

    if (!visible || hidden) return null;

    const dismiss = () => {
        writeDismissedAt(Date.now());
        setGuideOpen(false);
        setVisible(false);
    };

    return (
        <>
            <div
                role="region"
                aria-label="Cài Dashboard lên màn hình chính"
                data-testid="install-app-hint"
                className="lg:hidden mx-3 mt-2 mb-1 flex items-center gap-3 rounded-card bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-700/80 shadow-2xs pl-2.5 pr-1 py-1.5"
            >
                <img src="/icons/apple-touch-icon-120.png" alt="" className="w-9 h-9 rounded-control shrink-0 shadow-2xs" />
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-5 truncate">Cài như ứng dụng</p>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-[18px] truncate">Mở toàn màn hình, nhanh hơn</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setGuideOpen(true)} className="shrink-0 rounded-full border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 font-semibold px-3">
                    Xem cách
                </Button>
                <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Để sau" title="Để sau — nhắc lại sau 14 ngày" className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-11 min-w-11">
                    <AppIcon name="close" size="md" />
                </Button>
            </div>

            <InstallGuideModal
                isOpen={guideOpen}
                onClose={() => setGuideOpen(false)}
                onDismissForever={dismiss}
            />
        </>
    );
};

export default InstallAppHint;
