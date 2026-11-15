import {
    CheckThuongGroupSummary,
    CheckThuongGroupStoreItem,
    GroupLeaderboardFilterState
} from '../types';
import {
    CHECK_THUONG_COLS,
    parseNumber,
    isAchieved100,
    extractStoreCodeAndName
} from './checkThuongCalc';

export interface CheckThuongGroupStats {
    totalGroups: number;
    totalBonus: number;
    topGroup: CheckThuongGroupSummary | null;
    avgBonusPerGroup: number;
    totalStoresWithBonus: number;
}

/**
 * Tổng hợp danh sách nhóm thi đua từ raw competitionData.
 * Gom theo từng cặp (Kênh, Nhóm ngành hàng thi đua).
 */
export const parseGroupSummariesFromData = (data: any[][]): CheckThuongGroupSummary[] => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Map theo key: `${channel}___${groupName}`
    const map = new Map<string, {
        channel: string;
        groupName: string;
        totalBonus: number;
        thuongVuot: number;
        thuongTop: number;
        storesMap: Map<string, CheckThuongGroupStoreItem>;
        achieved100Count: number;
        sumPercent: number;
    }>();

    for (const row of data) {
        if (!row || row.length === 0) continue;
        const rawStore = String(row[CHECK_THUONG_COLS.SIEU_THI] || '').trim();
        const groupName = String(row[CHECK_THUONG_COLS.NGANH_HANG] || '').trim();
        if (!rawStore || !groupName) continue;

        const channel = String(row[CHECK_THUONG_COLS.KENH] || '').trim() || 'Khác';
        const key = `${channel.toUpperCase()}___${groupName.toUpperCase()}`;

        if (!map.has(key)) {
            map.set(key, {
                channel,
                groupName,
                totalBonus: 0,
                thuongVuot: 0,
                thuongTop: 0,
                storesMap: new Map(),
                achieved100Count: 0,
                sumPercent: 0,
            });
        }

        const entry = map.get(key)!;
        const tongThuong = parseNumber(row[CHECK_THUONG_COLS.TONG_THUONG]);
        const vuot = parseNumber(row[CHECK_THUONG_COLS.THUONG_VUOT_UU]);
        const top = parseNumber(row[CHECK_THUONG_COLS.THUONG_TOP_PERCENT]);
        const pct = parseNumber(row[CHECK_THUONG_COLS.PERCENT_DU_KIEN]);
        const is100 = isAchieved100(row[CHECK_THUONG_COLS.PERCENT_DU_KIEN]);
        const hangVuot = parseNumber(row[CHECK_THUONG_COLS.HANG_VUOT_UU]);
        const hangTarget = parseNumber(row[CHECK_THUONG_COLS.HANG_PERCENT_TARGET]);

        entry.totalBonus += tongThuong;
        entry.thuongVuot += vuot;
        entry.thuongTop += top;
        entry.sumPercent += pct;
        if (is100) {
            entry.achieved100Count++;
        }

        const { storeCode, storeName } = extractStoreCodeAndName(rawStore);
        if (!entry.storesMap.has(rawStore)) {
            entry.storesMap.set(rawStore, {
                storeCode,
                storeName,
                rawStore,
                channel,
                bonus: tongThuong,
                percent: pct,
                thuongVuot: vuot,
                thuongTop: top,
                hangVuot,
                hangTarget,
            });
        } else {
            const existing = entry.storesMap.get(rawStore)!;
            existing.bonus += tongThuong;
            existing.thuongVuot += vuot;
            existing.thuongTop += top;
        }
    }

    const summaries: CheckThuongGroupSummary[] = [];

    for (const [, item] of map.entries()) {
        const storeCount = item.storesMap.size;
        const stores = Array.from(item.storesMap.values()).sort((a, b) => b.bonus - a.bonus);
        const storesWithBonusCount = stores.filter(s => s.bonus > 0).length;
        const storesWithBonusPercent = storeCount > 0 ? Math.round((storesWithBonusCount / storeCount) * 1000) / 10 : 0;
        const achieved100Percent = storeCount > 0 ? Math.round((item.achieved100Count / storeCount) * 1000) / 10 : 0;
        const avgPercent = storeCount > 0 ? Math.round((item.sumPercent / storeCount) * 1000) / 10 : 0;

        const topStore = stores.length > 0 && stores[0].bonus > 0 ? {
            storeCode: stores[0].storeCode,
            storeName: stores[0].storeName,
            rawStore: stores[0].rawStore,
            bonus: stores[0].bonus,
        } : null;

        summaries.push({
            rank: 0,
            channel: item.channel,
            groupName: item.groupName,
            totalBonus: Math.round(item.totalBonus),
            thuongVuot: Math.round(item.thuongVuot),
            thuongTop: Math.round(item.thuongTop),
            storeCount,
            storesWithBonusCount,
            storesWithBonusPercent,
            achieved100Count: item.achieved100Count,
            achieved100Percent,
            avgPercent,
            topStore,
            stores,
        });
    }

    // Sắp xếp mặc định giảm dần theo tổng thưởng
    summaries.sort((a, b) => b.totalBonus - a.totalBonus);

    // Gán thứ hạng mặc định
    summaries.forEach((g, idx) => {
        g.rank = idx + 1;
    });

    return summaries;
};

/**
 * Lọc và sắp xếp danh sách nhóm thi đua theo bộ lọc (Kênh, Tìm kiếm, Tiêu chí sắp xếp).
 */
export const filterAndSortGroupSummaries = (
    groups: CheckThuongGroupSummary[],
    filters: GroupLeaderboardFilterState
): CheckThuongGroupSummary[] => {
    let result = groups.slice();

    // 1. Lọc theo Kênh
    if (filters.channel && filters.channel !== 'ALL') {
        result = result.filter(g => g.channel.toUpperCase() === filters.channel.toUpperCase());
    }

    // 2. Tìm kiếm theo tên nhóm hoặc tên kênh
    if (filters.searchQuery && filters.searchQuery.trim()) {
        const q = filters.searchQuery.trim().toLowerCase();
        result = result.filter(g =>
            g.groupName.toLowerCase().includes(q) ||
            g.channel.toLowerCase().includes(q)
        );
    }

    // 3. Sắp xếp
    result.sort((a, b) => {
        let cmp = 0;
        switch (filters.sortBy) {
            case 'totalBonus':
                cmp = a.totalBonus - b.totalBonus;
                break;
            case 'groupName':
                cmp = a.groupName.localeCompare(b.groupName, 'vi', { sensitivity: 'base' });
                break;
            case 'channel':
                cmp = a.channel.localeCompare(b.channel, 'vi', { sensitivity: 'base' });
                break;
            case 'storesWithBonusCount':
                cmp = a.storesWithBonusCount - b.storesWithBonusCount;
                break;
            case 'achieved100Count':
                cmp = a.achieved100Count - b.achieved100Count;
                break;
            case 'avgPercent':
                cmp = a.avgPercent - b.avgPercent;
                break;
            case 'rank':
            default:
                cmp = a.rank - b.rank;
                break;
        }

        if (cmp === 0 && filters.sortBy !== 'rank') {
            cmp = a.rank - b.rank;
        }

        return filters.sortOrder === 'asc' ? cmp : -cmp;
    });

    // Khi đang lọc theo một kênh cụ thể và sắp xếp theo thưởng giảm dần, đánh lại thứ hạng 1..N theo kênh đó
    if (filters.channel && filters.channel !== 'ALL' && filters.sortBy === 'totalBonus' && filters.sortOrder === 'desc') {
        return result.map((g, idx) => ({ ...g, rank: idx + 1 }));
    }

    return result;
};

/**
 * Lấy danh sách các kênh duy nhất từ các nhóm.
 */
export const getDistinctGroupChannels = (groups: CheckThuongGroupSummary[]): string[] => {
    const set = new Set<string>();
    groups.forEach(g => {
        if (g.channel && g.channel.trim()) {
            set.add(g.channel.trim());
        }
    });
    return Array.from(set).sort();
};

/**
 * Tính toán thống kê tổng quan cho nhóm thi đua.
 */
export const calculateGroupSystemStats = (groups: CheckThuongGroupSummary[]): CheckThuongGroupStats => {
    if (!groups || groups.length === 0) {
        return {
            totalGroups: 0,
            totalBonus: 0,
            topGroup: null,
            avgBonusPerGroup: 0,
            totalStoresWithBonus: 0,
        };
    }

    let sumBonus = 0;
    let sumStoresWithBonus = 0;

    for (const g of groups) {
        sumBonus += g.totalBonus;
        sumStoresWithBonus += g.storesWithBonusCount;
    }

    // groups đang được sắp xếp thưởng cao nhất ở đầu
    const topGroup = groups[0] || null;
    const avgBonusPerGroup = groups.length > 0 ? Math.round(sumBonus / groups.length) : 0;

    return {
        totalGroups: groups.length,
        totalBonus: sumBonus,
        topGroup,
        avgBonusPerGroup,
        totalStoresWithBonus: sumStoresWithBonus,
    };
};
