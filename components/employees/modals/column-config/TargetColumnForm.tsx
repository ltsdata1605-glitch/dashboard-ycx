import React from 'react';
import { AppIcon } from '../../../shared/ui/icon/AppIcon';
import { Input } from '../../../shared/ui/Input';
import { Button } from '../../../shared/ui/Button';
import { Tabs } from '../../../shared/ui/Tabs';

interface TargetColumnFormProps {
    metricType: 'quantity' | 'revenue' | 'revenueQD';
    setMetricType: (val: 'quantity' | 'revenue' | 'revenueQD') => void;
    targetValue: string;
    setTargetValue: (val: string) => void;
}

export const TargetColumnForm: React.FC<TargetColumnFormProps> = ({
    metricType, setMetricType,
    targetValue, setTargetValue
}) => {
    return (
        <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <AppIcon name="target" size="md" className="text-sky-500" /> Chỉ tiêu kho (Target)
                </h4>
            </div>
            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Định dạng chỉ tiêu</label>
                        <Tabs
                            variant="segment"
                            size="sm"
                            fullWidth
                            className="sm:w-auto"
                            activeId={metricType}
                            onChange={(id) => setMetricType(id as typeof metricType)}
                            items={[
                                { id: 'revenue', label: 'Tiền Tệ ($)' },
                                { id: 'quantity', label: 'Số Lượng (#)' },
                            ]}
                        />
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tổng Mục Tiêu *</label>
                        <div className="relative">
                            <Input 
                                type="text" 
                                inputMode="numeric"
                                value={targetValue} 
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/[^\d]/g, '');
                                    setTargetValue(raw ? Number(raw).toLocaleString('en-US') : '');
                                }}
                                placeholder="VD: 1,500,000,000" 
                                leftIcon={metricType === 'revenue' ? "dollar-sign" : "hash"}
                                className="h-10"
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                            <AppIcon name="info" size="sm" className="mt-0.5 text-sky-500" />
                            <span>Hệ thống phân bổ tổng điểm này theo nguyên tắc trung bình cộng cho số lượng nhân viên thực tế làm việc.</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
