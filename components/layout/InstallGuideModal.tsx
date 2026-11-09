import React, { useState } from 'react';
import { AppIcon } from '../shared/ui/icon';
import { Button } from '../shared/ui/Button';
import { Modal } from '../shared/ui/Modal';
import { writeDismissedAt } from './installHint';

interface InstallGuideModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDismissForever?: () => void;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({
    isOpen,
    onClose,
    onDismissForever,
}) => {
    const handleDismiss = () => {
        writeDismissedAt(Date.now());
        if (onDismissForever) onDismissForever();
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            position="bottom"
            maxWidth="sm"
            title="Cài lên màn hình chính"
            footer={
                <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={handleDismiss}>
                        Để sau
                    </Button>
                    <Button className="flex-1" onClick={onClose}>
                        Đã hiểu
                    </Button>
                </div>
            }
        >
            <div className="space-y-4 py-1">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50">
                    <img src="/icons/apple-touch-icon-120.png" alt="App Icon" className="w-12 h-12 rounded-xl shrink-0 shadow-sm" />
                    <div>
                        <div className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                            Dashboard YCX
                        </div>
                        <div className="text-[12px] text-slate-500 dark:text-slate-400 leading-snug">
                            Trải nghiệm mượt mà, mở nhanh toàn màn hình chuẩn Apple Web App
                        </div>
                    </div>
                </div>

                <ol className="space-y-3 pt-1">
                    {[
                        {
                            icon: 'iosShare' as const,
                            title: 'Bước 1: Bấm Chia sẻ',
                            desc: <>Bấm nút biểu tượng <b className="text-sky-600 dark:text-sky-400">Chia sẻ</b> (ô vuông mũi tên lên) ở thanh công cụ dưới Safari.</>,
                        },
                        {
                            icon: 'iosAddToHome' as const,
                            title: 'Bước 2: Thêm vào MH chính',
                            desc: <>Cuộn danh sách tuỳ chọn xuống và chọn <b className="text-sky-600 dark:text-sky-400">Thêm vào MH chính</b> (Add to Home Screen).</>,
                        },
                        {
                            icon: 'check' as const,
                            title: 'Bước 3: Xác nhận Thêm',
                            desc: <>Bấm nút <b className="text-sky-600 dark:text-sky-400">Thêm</b> góc trên phải. Dashboard sẽ xuất hiện trên màn hình chính như một app thật.</>,
                        },
                    ].map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                            <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-600 dark:text-sky-300 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                                <AppIcon name={step.icon} size="md" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <div className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 mb-0.5">
                                    {step.title}
                                </div>
                                <div className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                                    {step.desc}
                                </div>
                            </div>
                        </li>
                    ))}
                </ol>
            </div>
        </Modal>
    );
};

export default InstallGuideModal;

