import React, { useEffect, useState } from 'react';
import { AppIcon } from '../ui/icon/AppIcon';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface ExportOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDownload: () => void;
    onShare: () => void;
    onCopy?: () => void;
    canShare: boolean;
    filename: string;
    areaId?: string;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ isOpen, onClose, onDownload, onShare, onCopy, canShare, filename, areaId }) => {
    const [mounted, setMounted] = useState(false);
    const resolvedAreaId = areaId || (
        filename.toLowerCase().includes('chi_tiet_theo_kho') || filename.toLowerCase().includes('kho') ? 'Chi Tiết Theo Kho'
        : filename.toLowerCase().includes('tong_quan') || filename.toLowerCase().includes('kpi') ? 'Tổng Quan Doanh Thu'
        : filename.toLowerCase().includes('xu_huong') ? 'Xu Hướng Doanh Thu'
        : filename.toLowerCase().includes('ban_tin') ? 'Toàn Bộ Bản Tin'
        : undefined
    );

    const [botSetting, setBotSetting] = useState<{ realtime: boolean; luyke: boolean; realtimeCommand?: string; luykeCommand?: string }>({ realtime: false, luyke: false });

    useEffect(() => {
        setMounted(true);
        if (resolvedAreaId) {
            import('../../../services/autoReportExportService').then(({ getAreaExportSetting }) => {
                setBotSetting(getAreaExportSetting(resolvedAreaId));
            });
        }
    }, [resolvedAreaId]);

    const handleToggleBot = async (type: 'realtime' | 'luyke') => {
        if (!resolvedAreaId) return;
        const { setAreaExportSetting, getAreaExportSetting } = await import('../../../services/autoReportExportService');
        const nextVal = !botSetting[type];
        await setAreaExportSetting(resolvedAreaId, { [type]: nextVal });
        setBotSetting(getAreaExportSetting(resolvedAreaId));
    };

    if (!mounted) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            position="bottom"
            hideHeader
            ariaLabel="Xuất ảnh báo cáo"
            maxWidth="md"
            noRounded
        >
            <div className="modal-bleed relative overflow-hidden flex flex-col items-center">
                {/* Glowing Accent Top */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 opacity-80" />

                {/* Handle bar (mobile) */}
                <div className="flex justify-center pt-4 pb-2 sm:hidden w-full">
                    <div className="w-12 h-1.5 rounded-full bg-slate-300/80 dark:bg-slate-600/80" />
                </div>

                {/* Header */}
                <div className="px-4 pt-4 pb-2 text-center sm:text-left flex flex-col items-center sm:items-start relative z-10 w-full">
                    <div className="w-10 h-10 rounded-popup bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-900/50 dark:to-sky-900/50 flex items-center justify-center mb-2 shadow-sm">
                        <AppIcon name="exportImage" size="lg" className="text-sky-700" />
                    </div>
                    <h3 className="type-headline font-bold text-slate-900 dark:text-white">Xuất ảnh báo cáo</h3>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate w-full text-center sm:text-left">{filename}</p>
                </div>

                {/* Options */}
                <div className="px-4 pb-4 pt-1 space-y-2 relative z-10 w-full flex-1">
                    {/* Download option */}
                    <Button
                        variant="row" size="none"
                        onClick={onDownload}
                        className="justify-between p-3 rounded-popup bg-slate-50 dark:bg-slate-800/80 hover:bg-sky-50 dark:hover:bg-sky-900/20 active:scale-[0.98] transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-control bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <AppIcon name="download" size="lg" />
                            </div>
                            <div className="text-left">
                                <p className="font-extrabold text-slate-800 dark:text-white text-[13px]">Tải về thiết bị</p>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Lưu ảnh chất lượng cao</p>
                            </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-slate-200/50 dark:bg-slate-700 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/40 flex items-center justify-center transition-colors">
                            <AppIcon name="chevronRight" size="xs" className="text-slate-400 group-hover:text-sky-700" />
                        </div>
                    </Button>

                    {/* Copy option */}
                    {onCopy && (
                        <Button
                            variant="row" size="none"
                            onClick={onCopy}
                            className="justify-between p-3 rounded-popup bg-slate-50 dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-900/20 active:scale-[0.98] transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-control bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <AppIcon name="copyImage" size="lg" />
                                </div>
                                <div className="text-left">
                                    <p className="font-extrabold text-slate-800 dark:text-white text-[13px]">Sao chép ảnh</p>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Dán trực tiếp vào chat, tài liệu</p>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-slate-200/50 dark:bg-slate-700 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 flex items-center justify-center transition-colors">
                                <AppIcon name="chevronRight" size="xs" className="text-slate-400 group-hover:text-amber-700" />
                            </div>
                        </Button>
                    )}

                    {/* Share option */}
                    {canShare && (
                        <Button
                            variant="row" size="none"
                            onClick={onShare}
                            className="justify-between p-3 rounded-popup bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 active:scale-[0.98] transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-control bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <AppIcon name="share" size="lg" />
                                </div>
                                <div className="text-left">
                                    <p className="font-extrabold text-slate-800 dark:text-white text-[13px]">Chia sẻ trực tiếp</p>
                                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Gửi qua LINE, Zalo...</p>
                                </div>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-slate-200/50 dark:bg-slate-700 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 flex items-center justify-center transition-colors">
                                <AppIcon name="chevronRight" size="xs" className="text-slate-400 group-hover:text-emerald-700" />
                            </div>
                        </Button>
                    )}

                    {/* Bot LINE Auto-Export Config Card */}
                    {resolvedAreaId && (
                        <div className="p-3 rounded-popup border border-sky-100 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-sky-800 dark:text-sky-300 font-bold text-[12px]">
                                    <AppIcon name="bot" size="xs" />
                                    <span>Tự lưu lên Bot khi Auto Sync</span>
                                </div>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">{resolvedAreaId}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="toggle"
                                    size="xs"
                                    onClick={() => handleToggleBot('realtime')}
                                    aria-pressed={!!botSetting.realtime}
                                    className="flex-1 text-center aria-pressed:bg-sky-600 aria-pressed:border-sky-600 aria-pressed:text-white aria-pressed:shadow-xs"
                                >
                                    Realtime ({botSetting.realtimeCommand || 'bcrt'}): {botSetting.realtime ? 'Bật' : 'Tắt'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="toggle"
                                    size="xs"
                                    onClick={() => handleToggleBot('luyke')}
                                    aria-pressed={!!botSetting.luyke}
                                    className="flex-1 text-center aria-pressed:bg-emerald-600 aria-pressed:border-emerald-600 aria-pressed:text-white aria-pressed:shadow-xs"
                                >
                                    Luỹ kế ({botSetting.luykeCommand || 'bclk'}): {botSetting.luyke ? 'Bật' : 'Tắt'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Cancel button */}
                    <Button
                        variant="secondary" size="md"
                        onClick={onClose}
                        className="w-full mt-1 dark:text-slate-400 dark:bg-slate-800/80 dark:hover:bg-slate-700 active:scale-[0.98]"
                    >
                        Quay lại
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ExportOptionsModal;
