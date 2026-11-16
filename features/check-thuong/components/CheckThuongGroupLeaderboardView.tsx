import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { Button } from '../../../components/shared/ui/Button';
import { toast } from '../../../components/shared/ui/toast';
import {
    CheckThuongGroupSummary,
    GroupLeaderboardFilterState,
    GroupLeaderboardSortField
} from '../types';
import {
    parseGroupSummariesFromData,
    filterAndSortGroupSummaries,
    getDistinctGroupChannels,
    calculateGroupSystemStats
} from '../services/checkThuongGroupCalc';
import { exportGroupLeaderboardToImage } from '../services/checkThuongImageExport';
import { formatBonusMoney } from '../services/checkThuongCalc';
import { getGlobalFont } from '../../../services/dbService';

interface CheckThuongGroupLeaderboardViewProps {
    competitionData: any[][];
    uploadTime?: string;
    fileName?: string;
    onSelectStore: (storeCode: string) => void;
    onSwitchToStoreLeaderboard: () => void;
    onSwitchToSearch: () => void;
}

export const CheckThuongGroupLeaderboardView: React.FC<CheckThuongGroupLeaderboardViewProps> = ({
    competitionData,
    uploadTime,
    fileName,
    onSelectStore,
    onSwitchToStoreLeaderboard,
    onSwitchToSearch
}) => {
    // 1. TẤT CẢ CÁC NHÓM THI ĐUA TỪ DỮ LIỆU
    const allGroups = useMemo(() => {
        return parseGroupSummariesFromData(competitionData);
    }, [competitionData]);

    // 2. DANH SÁCH CÁC KÊNH DUY NHẤT
    const channels = useMemo(() => {
        return getDistinctGroupChannels(allGroups);
    }, [allGroups]);

    // Mặc định ưu tiên chọn kênh 'ĐML' nếu có, ngược lại chọn kênh đầu tiên hoặc 'ALL'
    const defaultChannel = useMemo(() => {
        const foundDml = channels.find(c => c.toUpperCase() === 'ĐML' || c.toUpperCase() === 'DML');
        if (foundDml) return foundDml;
        return channels.length > 0 ? channels[0] : 'ALL';
    }, [channels]);

    const [filters, setFilters] = useState<GroupLeaderboardFilterState>({
        channel: defaultChannel,
        searchQuery: '',
        sortBy: 'totalBonus',
        sortOrder: 'desc',
    });

    // Cập nhật kênh mặc định khi channels thay đổi (ví dụ khi mới nạp file)
    useEffect(() => {
        if (channels.length > 0 && filters.channel === 'ALL' && defaultChannel !== 'ALL') {
            setFilters(prev => ({ ...prev, channel: defaultChannel }));
        }
    }, [channels, defaultChannel]);

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const [activeFont, setActiveFont] = useState<string>('UTM Avo');

    useEffect(() => {
        getGlobalFont().then(font => {
            if (font) setActiveFont(font);
        }).catch(() => { /* fallback */ });

        const observer = new MutationObserver(() => {
            const parentStyle = document.getElementById('dynamic-font-style');
            if (parentStyle) {
                const match = parentStyle.innerHTML.match(/font-family:\s*'([^']+)'/);
                if (match && match[1]) {
                    setActiveFont(match[1]);
                }
            }
        });
        observer.observe(document.head, { childList: true, subtree: true, characterData: true });
        return () => observer.disconnect();
    }, []);

    // 3. DANH SÁCH NHÓM THEO BỘ LỌC
    const filteredGroups = useMemo(() => {
        return filterAndSortGroupSummaries(allGroups, filters);
    }, [allGroups, filters]);

    // 4. THỐNG KÊ TỔNG QUAN THEO KÊNH ĐANG CHỌN
    const channelStats = useMemo(() => {
        const groupsInChannel = filters.channel && filters.channel !== 'ALL'
            ? allGroups.filter(g => g.channel.toUpperCase() === filters.channel.toUpperCase())
            : allGroups;
        return calculateGroupSystemStats(groupsInChannel);
    }, [allGroups, filters.channel]);

    const toggleExpand = useCallback((key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const handleSort = useCallback((field: GroupLeaderboardSortField) => {
        setFilters(prev => {
            if (prev.sortBy === field) {
                return {
                    ...prev,
                    sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                };
            }
            const defaultOrder = (field === 'rank' || field === 'groupName' || field === 'channel') ? 'asc' : 'desc';
            return {
                ...prev,
                sortBy: field,
                sortOrder: defaultOrder
            };
        });
    }, []);

    const handleExportImage = useCallback(async () => {
        if (filteredGroups.length === 0) {
            toast.error('Không có dữ liệu nhóm thi đua để xuất ảnh!');
            return;
        }

        setIsExporting(true);
        const toastId = 'xuat-anh-top-nhom';
        try {
            const ketQua = await exportGroupLeaderboardToImage({
                groups: filteredGroups,
                limit: filteredGroups.length,
                channel: filters.channel,
                fileName,
                fontName: activeFont
            });
            if (ketQua === 'shared' || ketQua === 'downloaded') {
                toast.success(`Đã xuất ảnh ${filteredGroups.length} nhóm thi đua thành công!`, {
                    id: toastId,
                    icon: <AppIcon name="exportImage" size="md" className="text-sky-600" />
                });
            } else {
                toast.dismiss(toastId);
            }
        } catch (err: any) {
            console.error('Export Group Image Error:', err);
            toast.error(err?.message || 'Xuất ảnh thất bại, vui lòng thử lại!', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    }, [filteredGroups, filters.channel, fileName, activeFont]);

    if (!competitionData || competitionData.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="p-4 rounded-card bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 mb-3">
                    <AppIcon name="alert" size="state" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
                    Chưa có dữ liệu Check Thưởng
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
                    Vui lòng tải file Excel báo cáo thi đua tại tab Tra Cứu để xem Bảng xếp hạng Top nhóm thi đua.
                </p>
                <Button variant="primary" size="sm" type="button" onClick={onSwitchToSearch} className="px-4">
                    Chuyển sang Tra Cứu để Tải File
                </Button>
            </div>
        );
    }

    const renderRankBadge = (rank: number) => {
        if (rank === 1) {
            return (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-black text-xs border border-amber-300 dark:border-amber-700 shadow-2xs">
                    #1
                </span>
            );
        }
        if (rank === 2) {
            return (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs border border-slate-300 dark:border-slate-700">
                    #2
                </span>
            );
        }
        if (rank === 3) {
            return (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-400 font-extrabold text-xs border border-amber-200 dark:border-amber-800">
                    #3
                </span>
            );
        }
        return (
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                #{rank}
            </span>
        );
    };

    const getChannelBadge = (channel: string) => {
        const ch = (channel || '').toUpperCase().trim();
        if (ch.includes('DML')) {
            return 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300 dark:border-sky-800';
        }
        if (ch.includes('DMM')) {
            return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
        }
        if (ch.includes('TGDD') || ch.includes('TGD') || ch.includes('TZ')) {
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800';
        }
        if (ch.includes('DMS') || ch.includes('DMX')) {
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
        }
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    };

    return (
        <div
            className="w-full bg-slate-50/50 dark:bg-slate-950/50"
            style={{ fontFamily: `'${activeFont}', 'UTM Avo', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` }}
        >
            <div className="max-w-[960px] mx-auto w-full px-3 sm:px-4 lg:px-8 pt-2 pb-6 lg:pb-10">
                {/* 1. TIÊU ĐỀ & NÚT CHUYỂN ĐỔI CHẾ ĐỘ VIEW */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-popup bg-gradient-to-tr from-indigo-500 via-indigo-400 to-indigo-300 text-slate-950 shadow-xs shadow-indigo-500/20 shrink-0">
                            <AppIcon name="layers" size="lg" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-[17px] font-black text-slate-900 dark:text-slate-100 tracking-tight sm:leading-7">
                                    Top Thưởng Theo Nhóm Thi Đua Theo Kênh
                                </h2>
                                <span className="px-1.5 py-0.2 text-[11px] font-black uppercase tracking-wider rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
                                    Nhóm
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {fileName ? `Dữ liệu từ: ${fileName}` : 'Xếp hạng các nhóm ngành hàng từ thưởng cao nhất đến thấp nhất'}
                            </p>
                        </div>
                    </div>

                    {/* NÚT CHUYỂN ĐỔI NHANH GIỮA 2 CHẾ ĐỘ: THEO SIÊU THỊ / THEO NHÓM */}
                    <div className="flex items-center p-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/70 dark:border-slate-700/70 shadow-2xs shrink-0 self-stretch sm:self-auto justify-center">
                        <Button
                            variant="ghost"
                            size="none"
                            onClick={onSwitchToStoreLeaderboard}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
                            title="Chuyển sang Bảng xếp hạng theo siêu thị"
                        >
                            <AppIcon name="trophy" size="xs" />
                            <span>Theo Siêu Thị</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="none"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs transition-all"
                            title="Đang xem Bảng xếp hạng theo nhóm thi đua"
                        >
                            <AppIcon name="layers" size="xs" />
                            <span>Theo Nhóm Thi Đua</span>
                        </Button>
                    </div>
                </div>

                {/* 2. BỘ CHỌN KÊNH NHANH (QUICK CHANNEL SELECTOR) */}
                <div className="mb-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <AppIcon name="filter" size="xs" />
                        <span>Chọn kênh bán để xem top nhóm:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {channels.map((ch) => {
                            const isSelected = filters.channel.toUpperCase() === ch.toUpperCase();
                            const chTotalBonus = allGroups
                                .filter(g => g.channel.toUpperCase() === ch.toUpperCase())
                                .reduce((s, g) => s + g.totalBonus, 0);
                            const bonusShort = formatBonusMoney(chTotalBonus).full;

                            return (
                                <Button
                                    variant="cell"
                                    size="none"
                                    key={ch}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => setFilters(prev => ({ ...prev, channel: ch }))}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs transition-all active:scale-95 ${
                                        isSelected
                                            ? 'bg-sky-600 text-white font-bold shadow-xs ring-2 ring-sky-400/40'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    <span className="font-extrabold">{ch}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                        isSelected ? 'bg-sky-700/80 text-sky-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold'
                                    }`}>
                                        {bonusShort}
                                    </span>
                                </Button>
                            );
                        })}

                        {/* Nút Xem tất cả kênh */}
                        <Button
                            variant="cell"
                            size="none"
                            type="button"
                            aria-pressed={filters.channel === 'ALL'}
                            onClick={() => setFilters(prev => ({ ...prev, channel: 'ALL' }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all active:scale-95 ${
                                filters.channel === 'ALL'
                                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <span>Tất cả kênh</span>
                        </Button>
                    </div>
                </div>

                {/* 3. CỤM THẺ TỔNG HỢP KPI THEO KÊNH */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-4">
                    {/* Thẻ 1: Tổng tiền thưởng kênh */}
                    <div className="p-3 sm:p-3.5 rounded-card bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                        <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            <span>TỔNG THƯỞNG KÊNH</span>
                            <AppIcon name="coins" size="xs" className="text-sky-500" />
                        </div>
                        <div className="text-lg sm:text-xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
                            {formatBonusMoney(channelStats.totalBonus).full}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                            {filters.channel === 'ALL' ? 'Toàn bộ hệ thống' : `Kênh: ${filters.channel}`}
                        </div>
                    </div>

                    {/* Thẻ 2: Nhóm Quán quân #1 */}
                    <div className="p-3 sm:p-3.5 rounded-card bg-white dark:bg-slate-800/90 border border-amber-200/80 dark:border-amber-900/60 shadow-2xs">
                        <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mb-1">
                            <span>QUÁN QUÂN #1</span>
                            <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                TOP 1
                            </span>
                        </div>
                        <div className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate" title={channelStats.topGroup?.groupName || ''}>
                            {channelStats.topGroup ? channelStats.topGroup.groupName : '---'}
                        </div>
                        <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                            {channelStats.topGroup ? formatBonusMoney(channelStats.topGroup.totalBonus).full : '0 Tr'}
                        </div>
                    </div>

                    {/* Thẻ 3: Số nhóm thi đua */}
                    <div className="p-3 sm:p-3.5 rounded-card bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                        <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            <span>SỐ NHÓM THI ĐUA</span>
                            <AppIcon name="layers" size="xs" className="text-indigo-500" />
                        </div>
                        <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                            {channelStats.totalGroups} <span className="text-xs font-normal text-slate-500">nhóm</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Bình quân: {formatBonusMoney(channelStats.avgBonusPerGroup).full}/nhóm
                        </div>
                    </div>

                    {/* Thẻ 4: Lượt kho có thưởng */}
                    <div className="p-3 sm:p-3.5 rounded-card bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                        <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                            <span>LƯỢT KHO CÓ THƯỞNG</span>
                            <AppIcon name="store" size="xs" className="text-emerald-500" />
                        </div>
                        <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                            {channelStats.totalStoresWithBonus.toLocaleString('vi-VN')}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Tổng các lượt kho đạt thưởng
                        </div>
                    </div>
                </div>

                {/* 4. BỘ LỌC TÌM KIẾM & NÚT XUẤT ẢNH */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3 p-2.5 rounded-card bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                    {/* Ô tìm kiếm */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Tìm kiếm nhóm thi đua (vd: Tivi, Tủ lạnh, Gia dụng...)"
                            value={filters.searchQuery}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                            className="w-full h-9 pl-9 pr-8 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 dark:focus:border-sky-400 transition-colors"
                        />
                        <div className="absolute left-3 top-2.5 text-slate-400">
                            <AppIcon name="search" size="xs" />
                        </div>
                        {filters.searchQuery && (
                            <Button
                                variant="cell"
                                size="none"
                                type="button"
                                aria-label="Xoá ô tìm kiếm"
                                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                <AppIcon name="close" size="xs" />
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                            Hiển thị: <strong className="text-slate-800 dark:text-slate-200">{filteredGroups.length}</strong> nhóm
                        </span>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleExportImage}
                            disabled={isExporting || filteredGroups.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 font-bold"
                            title="Xuất ảnh bảng xếp hạng nhóm thi đua theo kênh"
                        >
                            <AppIcon name={isExporting ? 'loading' : 'exportImage'} size="sm" spin={isExporting} />
                            <span>{isExporting ? 'Đang xuất…' : 'Xuất ảnh'}</span>
                        </Button>
                    </div>
                </div>

                {/* 5. BẢNG XẾP HẠNG NHÓM THI ĐUA */}
                <div className="rounded-card bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200/90 dark:border-slate-700/90 bg-slate-50/90 dark:bg-slate-900/70 text-[11px] font-black uppercase text-slate-600 dark:text-slate-300">
                                    <th
                                        className="py-2.5 px-3 text-center cursor-pointer select-none hover:text-sky-600 w-14"
                                        onClick={() => handleSort('rank')}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            <span>Hạng</span>
                                            {filters.sortBy === 'rank' && (
                                                <AppIcon name={filters.sortOrder === 'asc' ? 'arrowUp' : 'arrowDown'} size="xs" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="py-2.5 px-3 cursor-pointer select-none hover:text-sky-600 min-w-[160px]"
                                        onClick={() => handleSort('groupName')}
                                    >
                                        <div className="flex items-center gap-1">
                                            <span>Nhóm Thi Đua</span>
                                            {filters.sortBy === 'groupName' && (
                                                <AppIcon name={filters.sortOrder === 'asc' ? 'arrowUp' : 'arrowDown'} size="xs" />
                                            )}
                                        </div>
                                    </th>
                                    {filters.channel === 'ALL' && (
                                        <th
                                            className="py-2.5 px-2 text-center cursor-pointer select-none hover:text-sky-600 w-20"
                                            onClick={() => handleSort('channel')}
                                        >
                                            <span>Kênh</span>
                                        </th>
                                    )}
                                    <th
                                        className="py-2.5 px-3 text-right cursor-pointer select-none hover:text-sky-600 min-w-[110px]"
                                        onClick={() => handleSort('totalBonus')}
                                    >
                                        <div className="flex items-center justify-end gap-1 text-sky-600 dark:text-sky-400">
                                            <span>Tổng Thưởng</span>
                                            {filters.sortBy === 'totalBonus' && (
                                                <AppIcon name={filters.sortOrder === 'asc' ? 'arrowUp' : 'arrowDown'} size="xs" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="py-2.5 px-2 text-center cursor-pointer select-none hover:text-sky-600 min-w-[90px]"
                                        onClick={() => handleSort('storesWithBonusCount')}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            <span>Có Thưởng</span>
                                            {filters.sortBy === 'storesWithBonusCount' && (
                                                <AppIcon name={filters.sortOrder === 'asc' ? 'arrowUp' : 'arrowDown'} size="xs" />
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="py-2.5 px-2 text-center cursor-pointer select-none hover:text-sky-600 min-w-[80px]"
                                        onClick={() => handleSort('achieved100Count')}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            <span>Đạt 100%</span>
                                            {filters.sortBy === 'achieved100Count' && (
                                                <AppIcon name={filters.sortOrder === 'asc' ? 'arrowUp' : 'arrowDown'} size="xs" />
                                            )}
                                        </div>
                                    </th>
                                    <th className="py-2.5 px-3 min-w-[180px]">
                                        <span>Kho Thưởng Cao Nhất</span>
                                    </th>
                                    <th className="py-2.5 px-2 text-center w-16">
                                        <span>Chi tiết</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredGroups.length === 0 ? (
                                    <tr>
                                        <td colSpan={filters.channel === 'ALL' ? 8 : 7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                                            Không tìm thấy nhóm thi đua nào phù hợp với bộ lọc.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredGroups.map((group) => {
                                        const groupKey = `${group.channel}___${group.groupName}`;
                                        const isExpanded = expandedGroups.has(groupKey);

                                        return (
                                            <React.Fragment key={groupKey}>
                                                <tr
                                                    onClick={() => toggleExpand(groupKey)}
                                                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                                >
                                                    <td className="py-2.5 px-3 text-center">
                                                        {renderRankBadge(group.rank)}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-[13px]">
                                                            {group.groupName}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                            <span>Thưởng vượt: {formatBonusMoney(group.thuongVuot).full}</span>
                                                            <span>•</span>
                                                            <span>Thưởng Top: {formatBonusMoney(group.thuongTop).full}</span>
                                                        </div>
                                                    </td>
                                                    {filters.channel === 'ALL' && (
                                                        <td className="py-2.5 px-2 text-center">
                                                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black border ${getChannelBadge(group.channel)}`}>
                                                                {group.channel}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="py-2.5 px-3 text-right">
                                                        <div className="font-black text-sky-600 dark:text-sky-400 text-xs sm:text-sm">
                                                            {formatBonusMoney(group.totalBonus).full}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">
                                                            {group.storesWithBonusCount} <span className="text-[10px] text-slate-400">/{group.storeCount}</span>
                                                        </div>
                                                        <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {group.storesWithBonusPercent}%
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <div className="font-bold text-slate-800 dark:text-slate-200">
                                                            {group.achieved100Count}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                            ({group.achieved100Percent}%)
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                                                        {group.topStore ? (
                                                            <Button
                                                                variant="link"
                                                                size="none"
                                                                onClick={() => onSelectStore(group.topStore!.storeCode)}
                                                                className="text-left group flex flex-col items-start"
                                                                title={`Xem chi tiết siêu thị ${group.topStore.rawStore}`}
                                                            >
                                                                <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 truncate max-w-[170px]">
                                                                    {group.topStore.storeCode} - {group.topStore.storeName}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                                                    {formatBonusMoney(group.topStore.bonus).full}
                                                                </span>
                                                            </Button>
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-xs"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleExpand(groupKey);
                                                            }}
                                                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                                            title={isExpanded ? 'Thu gọn danh sách siêu thị' : 'Xem danh sách siêu thị trong nhóm này'}
                                                        >
                                                            <AppIcon name={isExpanded ? 'chevronUp' : 'chevronDown'} size="xs" />
                                                        </Button>
                                                    </td>
                                                </tr>

                                                {/* DANH SÁCH CÁC SIÊU THỊ TRONG NHÓM KHI MỞ RỘNG */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan={filters.channel === 'ALL' ? 8 : 7} className="p-0 bg-slate-50/70 dark:bg-slate-900/50">
                                                            <div className="p-3 border-t border-b border-slate-200/80 dark:border-slate-700/80">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                                                        <AppIcon name="store" size="xs" className="text-sky-500" />
                                                                        <span>
                                                                            Danh sách các siêu thị thuộc nhóm: <strong className="text-indigo-600 dark:text-indigo-400">{group.groupName}</strong> ({group.stores.length} kho)
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[10px] text-slate-400">
                                                                        Sắp xếp theo tiền thưởng từ cao đến thấp
                                                                    </span>
                                                                </div>

                                                                <div className="max-h-60 overflow-y-auto rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800">
                                                                    <table className="w-full text-[11px]">
                                                                        <thead>
                                                                            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/50 text-slate-500">
                                                                                <th className="py-1.5 px-2 text-center w-10">#</th>
                                                                                <th className="py-1.5 px-2 text-left">Mã Kho - Tên Siêu Thị</th>
                                                                                <th className="py-1.5 px-2 text-right">Tiền Thưởng</th>
                                                                                <th className="py-1.5 px-2 text-right">Thưởng Vượt</th>
                                                                                <th className="py-1.5 px-2 text-right">Thưởng Top</th>
                                                                                <th className="py-1.5 px-2 text-center">% Dự Kiến</th>
                                                                                <th className="py-1.5 px-2 text-center w-14">Thao tác</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                                            {group.stores.map((st, sIdx) => (
                                                                                <tr key={st.rawStore} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                                                                                    <td className="py-1 px-2 text-center text-slate-400 font-semibold">{sIdx + 1}</td>
                                                                                    <td className="py-1 px-2 font-medium text-slate-800 dark:text-slate-200">
                                                                                        {st.storeCode} - {st.storeName}
                                                                                    </td>
                                                                                    <td className={`py-1 px-2 text-right font-black ${st.bonus > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`}>
                                                                                        {formatBonusMoney(st.bonus).full}
                                                                                    </td>
                                                                                    <td className="py-1 px-2 text-right text-slate-500">
                                                                                        {st.thuongVuot > 0 ? formatBonusMoney(st.thuongVuot).full : '-'}
                                                                                    </td>
                                                                                    <td className="py-1 px-2 text-right text-slate-500">
                                                                                        {st.thuongTop > 0 ? formatBonusMoney(st.thuongTop).full : '-'}
                                                                                    </td>
                                                                                    <td className="py-1 px-2 text-center font-semibold text-slate-600 dark:text-slate-300">
                                                                                        {st.percent ? `${Math.round(st.percent * 100)}%` : '0%'}
                                                                                    </td>
                                                                                    <td className="py-1 px-2 text-center">
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon-xs"
                                                                                            onClick={() => onSelectStore(st.storeCode)}
                                                                                            title="Xem phân tích siêu thị này"
                                                                                            className="text-sky-600 hover:text-sky-700"
                                                                                        >
                                                                                            <AppIcon name="search" size="xs" />
                                                                                        </Button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default CheckThuongGroupLeaderboardView;
