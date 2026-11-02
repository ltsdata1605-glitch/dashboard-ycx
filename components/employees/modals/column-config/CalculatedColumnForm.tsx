import React from 'react';
import { AppIcon } from '../../../shared/ui/icon/AppIcon';
import { Select } from '../../../shared/ui/Select';
import { Button } from '../../../shared/ui/Button';
import { Tabs } from '../../../shared/ui/Tabs';

interface CalculatedColumnFormProps {
    operation: '+' | '-' | '/' | '*';
    setOperation: (val: '+' | '-' | '/' | '*') => void;
    operand1: string;
    setOperand1: (val: string) => void;
    operand2: string;
    setOperand2: (val: string) => void;
    displayAs: 'number' | 'percentage';
    setDisplayAs: (val: 'number' | 'percentage') => void;
    decimalPlaces?: 0 | 1 | 2;
    setDecimalPlaces: (val: 0 | 1 | 2) => void;
    // Chỉ cần 3 field này (xem JSX bên dưới) — dùng shape hẹp thay vì ColumnConfig đầy đủ để
    // HeadToHeadConfigModal (chỉ có id/columnName) cũng truyền được mà không cần ép any.
    availableOperands: { id: string; columnName: string; mainHeader?: string }[];
}

export const CalculatedColumnForm: React.FC<CalculatedColumnFormProps> = ({
    operation, setOperation,
    operand1, setOperand1,
    operand2, setOperand2,
    displayAs, setDisplayAs,
    decimalPlaces = 0, setDecimalPlaces,
    availableOperands
}) => {
    return (
        <div className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <AppIcon name="total" size="md" className="text-sky-500" /> Thuật toán ghép cột
                </h4>
            </div>
            <div className="space-y-5">
                <div className="flex flex-row items-center gap-2 sm:gap-3 w-full">
                    <div className="flex-1 w-full relative">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nguồn dữ liệu 1</label>
                        <Select value={operand1} onChange={e => setOperand1(e.target.value)} className="h-9">
                            <option value="">– Chọn –</option>
                            {availableOperands.map(c => <option key={c.id} value={c.id}>{c.mainHeader ? `[${c.mainHeader}] ${c.columnName}` : c.columnName}</option>)}
                        </Select>
                    </div>
                    <div className="flex-shrink-0 relative w-8 sm:w-10 h-8 sm:h-10 mt-6 flex items-center justify-center">
                        <select value={operation} onChange={e => setOperation(e.target.value as '+' | '-' | '/' | '*')} className="absolute inset-0 z-10 opacity-0 cursor-pointer w-full h-full">
                            <option value="+">+</option>
                            <option value="-">-</option>
                            <option value="*">*</option>
                            <option value="/">/</option>
                        </select>
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium text-[17px] pointer-events-none transition-colors leading-7">
                            {operation === '*' ? '×' : operation === '/' ? '÷' : operation}
                        </div>
                    </div>
                    <div className="flex-1 w-full relative">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 opacity-0">Nguồn 2</label>
                        <Select value={operand2} onChange={e => setOperand2(e.target.value)} className="h-9">
                            <option value="">– Chọn –</option>
                            {availableOperands.map(c => <option key={c.id} value={c.id}>{c.mainHeader ? `[${c.mainHeader}] ${c.columnName}` : c.columnName}</option>)}
                        </Select>
                    </div>
                </div>
                <div className="pt-2 flex flex-wrap justify-end gap-4">
                    <div className="w-full sm:w-[220px]">
                        <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Làm tròn số</label>
                        <Tabs
                            variant="segment"
                            size="sm"
                            fullWidth
                            activeId={String(decimalPlaces)}
                            onChange={(id) => setDecimalPlaces(Number(id) as typeof decimalPlaces)}
                            items={[
                                { id: '0', label: 'Bỏ số lẻ' },
                                { id: '1', label: '1 chữ số' },
                                { id: '2', label: '2 chữ số' },
                            ]}
                        />
                    </div>
                    {operation === '/' && (
                        <div className="w-full sm:w-[140px]">
                            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Định dạng</label>
                            <Tabs
                                variant="segment"
                                size="sm"
                                fullWidth
                                activeId={displayAs}
                                onChange={(id) => setDisplayAs(id as typeof displayAs)}
                                items={[
                                    { id: 'number', label: 'Số' },
                                    { id: 'percentage', label: '%' },
                                ]}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
