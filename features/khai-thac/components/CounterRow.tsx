import React from 'react';
import { resolveIconName } from '../../../components/shared/ui/icon/legacyIconNames';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { Button } from '../../../components/shared/ui/Button';

interface CounterRowProps {
    icon: string;
    label: string;
    value: number;
    onChange: (next: number) => void;
    /** Mục tuỳ chỉnh có nút xoá. */
    onDelete?: () => void;
}

/**
 * Mục đếm số lượng chuẩn Apple Design System V2 (iOS Stepper Capsule).
 * - Bề mặt mềm mại, nhận diện rõ nét khi đã chọn (> 0)
 * - Stepper dạng con nhộng chuẩn iOS (bo tròn full, viền thanh mảnh, active haptic scale)
 * - Vùng chạm cảm ứng vô hình .ycx-hit 44px chuẩn Apple HIG
 * - Giữ nguyên data-testid và aria-label cho kiểm thử tự động
 */
export const CounterRow: React.FC<CounterRowProps> = ({ icon, label, value, onChange, onDelete }) => {
    const active = value > 0;
    const resolvedIcon = resolveIconName(icon) ?? 'help';

    return (
        <div
            className={`flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-3 h-10 lg:h-9 py-1 border-b border-slate-100/90 dark:border-slate-800/80 transition-colors duration-150 ${
                active ? 'bg-sky-50/70 dark:bg-sky-950/25' : 'bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
            }`}
        >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <span
                    className={`inline-flex shrink-0 w-6 h-6 rounded-md items-center justify-center transition-colors ${
                        active
                            ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}
                >
                    <AppIcon name={resolvedIcon} size="sm" />
                </span>
                <span
                    className={`min-w-0 truncate text-[13px] transition-colors ${
                        active
                            ? 'font-semibold text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
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

                {/* Apple iOS Stepper Capsule */}
                <div
                    className={`inline-flex items-center rounded-full p-0.5 border shadow-2xs transition-all duration-150 ${
                        active
                            ? 'bg-white dark:bg-slate-850 border-sky-300 dark:border-sky-700/80 ring-1 ring-sky-200 dark:ring-sky-900/40'
                            : 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/70'
                    }`}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onChange(Math.max(0, value - 1))}
                        disabled={value === 0}
                        aria-label={`Giảm ${label}`}
                        className="ycx-hit w-6 h-6 sm:w-6.5 sm:h-6.5 min-w-0 min-h-0 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 disabled:opacity-25 disabled:pointer-events-none transition-all duration-150"
                    >
                        <AppIcon name="minus" size="xs" />
                    </Button>

                    <span
                        className={`min-w-[20px] px-1 text-center text-[12px] sm:text-[13px] tabular-nums font-bold transition-colors ${
                            active
                                ? 'text-sky-600 dark:text-sky-400 font-extrabold'
                                : 'text-slate-400 dark:text-slate-500'
                        }`}
                        data-testid={`count-${label}`}
                    >
                        {value}
                    </span>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onChange(value + 1)}
                        aria-label={`Tăng ${label}`}
                        className={`ycx-hit w-6 h-6 sm:w-6.5 sm:h-6.5 min-w-0 min-h-0 rounded-full flex items-center justify-center active:scale-90 transition-all duration-150 ${
                            active
                                ? 'bg-sky-500 text-white hover:bg-sky-600 shadow-2xs'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        <AppIcon name="add" size="xs" />
                    </Button>
                </div>
            </div>
        </div>
    );
};
