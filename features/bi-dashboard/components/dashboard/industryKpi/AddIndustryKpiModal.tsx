import React, { useState, useMemo } from 'react';
import { AppIcon } from '../../../../../components/shared/ui/icon/AppIcon';
import { Modal } from '../../../../../components/shared/ui/Modal';
import { IndustryItemOption, IndustryKpiCardConfig } from '../../../services/industryKpiCalc';
import { Button } from '../../../../../components/shared/ui/Button';
import { Input } from '../../../../../components/shared/ui/Input';
import { Tabs } from '../../../../../components/shared/ui/Tabs';

interface AddIndustryKpiModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddCard: (card: IndustryKpiCardConfig) => void;
    onRemoveCard: (id: string) => void;
    currentCards: IndustryKpiCardConfig[];
    availableIndustries: IndustryItemOption[];
    availableSubIndustries: IndustryItemOption[];
    onResetDefault: () => void;
}

export const AddIndustryKpiModal: React.FC<AddIndustryKpiModalProps> = ({
    isOpen,
    onClose,
    onAddCard,
    onRemoveCard,
    currentCards,
    availableIndustries,
    availableSubIndustries,
    onResetDefault,
}) => {
    const [activeTab, setActiveTab] = useState<'subIndustry' | 'industry'>('subIndustry');
    const [searchTerm, setSearchTerm] = useState('');

    const currentCardMap = useMemo(() => {
        const map = new Map<string, IndustryKpiCardConfig>();
        currentCards.forEach((c) => {
            map.set(c.title.toLowerCase(), c);
            map.set(c.id, c);
        });
        return map;
    }, [currentCards]);

    const filteredItems = useMemo(() => {
        const sourceList = activeTab === 'subIndustry' ? availableSubIndustries : availableIndustries;
        if (!searchTerm.trim()) return sourceList;

        const term = searchTerm.toLowerCase().trim();
        return sourceList.filter(
            (item) =>
                item.displayName.toLowerCase().includes(term) ||
                item.rawName.toLowerCase().includes(term) ||
                (item.parentName && item.parentName.toLowerCase().includes(term))
        );
    }, [activeTab, availableIndustries, availableSubIndustries, searchTerm]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="lg"
            ariaLabel="Quản lý và thêm thẻ KPI ngành hàng"
            title={
                <span className="flex items-center gap-2">
                    <AppIcon name="add" size="md" className="text-sky-600" />
                    <span>Quản lý &amp; Thêm Thẻ KPI Ngành Hàng</span>
                </span>
            }
            footer={
                <div className="flex items-center justify-between text-xs">

                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                        Đang hiển thị: <strong className="text-slate-800 dark:text-slate-100 font-bold">{currentCards.length}</strong> thẻ KPI
                    </span>
                    <Button
                        variant="primary" data-ui="bi"
                        size="none"
                        type="button"
                        onClick={onClose}
                        className="ycx-hit px-4 py-1.5 font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white rounded-none transition-colors cursor-pointer"
                    >
                        Hoàn tất
                    </Button>
                </div>
            }
        >
            {/* Thân giữ nguyên bố cục cũ; bù lề của Modal để không đổi giao diện. */}
            <div className="modal-bleed">

                {/* Search & Tabs */}
                <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col gap-2.5">
                    {/* Search */}
                    <div className="relative">
                        {/* z-10: Input tự bọc <div relative> vẽ SAU icon nên sẽ che icon nếu không nâng lớp */}
                        <AppIcon name="search" size="md" className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-slate-400" />
                        <Input
                            aria-label="Tìm ngành hàng hoặc nhóm hàng"
                            type="text"
                            placeholder="Tìm nhanh ngành hàng hoặc nhóm hàng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-auto pl-9 pr-3 py-1.5 text-xs sm:text-sm border-slate-200 rounded-none text-slate-800 focus-visible:ring-0"
                        />
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center justify-between gap-2">
                        <Tabs
                            variant="segment"
                            size="sm"
                            activeId={activeTab}
                            onChange={(id) => setActiveTab(id as typeof activeTab)}
                            items={[
                                { id: 'subIndustry', label: `Nhóm hàng (${availableSubIndustries.length})`, icon: 'product' },
                                { id: 'industry', label: `Ngành hàng (${availableIndustries.length})`, icon: 'layers' },
                            ]}
                        />

                        {/* Reset button */}
                        <Button
                            type="button"
                            variant="link" data-ui="bi"
                            size="none"
                            onClick={onResetDefault}
                            className="gap-1 text-[11px] font-bold text-slate-500 hover:text-sky-700 dark:hover:text-sky-400"
                            title="Khôi phục 12 thẻ mặc định"
                        >
                            <AppIcon name="reset" size="xs" />
                            <span className="hidden sm:inline">Mặc định (12 thẻ)</span>
                        </Button>
                    </div>
                </div>

                {/* Items List */}
                <div className="p-3 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredItems.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                            Không tìm thấy ngành/nhóm hàng nào phù hợp.
                        </div>
                    ) : (
                        filteredItems.map((item) => {
                            const isSelected = currentCardMap.has(item.displayName.toLowerCase()) || currentCardMap.has(item.id);
                            const activeCard = currentCardMap.get(item.displayName.toLowerCase()) || currentCardMap.get(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className="py-2 px-1.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {item.displayName}
                                            </span>
                                            {item.parentName && (
                                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                                    ({item.parentName})
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {isSelected ? (
                                        <Button
                                            variant="tinted" data-ui="bi"
                                            size="xs"
                                            type="button"
                                            onClick={() => {
                                                if (activeCard) onRemoveCard(activeCard.id);
                                            }}
                                            className="gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300/80 dark:border-emerald-800/80 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 group"
                                            title="Bấm để bỏ thẻ này"
                                        >
                                            <AppIcon name="check" size="xs" className="group-hover:hidden" />
                                            <AppIcon name="close" size="xs" className="hidden group-hover:inline" />
                                            <span className="group-hover:hidden">Đã thêm</span>
                                            <span className="hidden group-hover:inline">Bỏ chọn</span>
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="tinted" data-ui="bi"
                                            size="xs"
                                            type="button"
                                            onClick={() => {
                                                onAddCard({
                                                    id: item.id,
                                                    title: item.displayName,
                                                    type: item.type,
                                                });
                                            }}
                                            className="gap-1 dark:text-sky-300 dark:bg-sky-950/60 border border-sky-300/80 dark:border-sky-800/80 dark:hover:bg-sky-900/60"
                                        >
                                            <AppIcon name="add" size="xs" />
                                            <span>Thêm</span>
                                        </Button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Modal>
    );
};
