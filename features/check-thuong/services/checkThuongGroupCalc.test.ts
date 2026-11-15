import { describe, it, expect } from 'vitest';
import {
    parseGroupSummariesFromData,
    filterAndSortGroupSummaries,
    getDistinctGroupChannels,
    calculateGroupSystemStats
} from './checkThuongGroupCalc';

describe('checkThuongGroupCalc', () => {
    // Format: [0..2, 3: KENH, 4: SIEU_THI, 5: NGANH_HANG, 6: %, 7: DU_KIEN_VUOT, 8: LAY_TOP, 9: HANG_VUOT, 10: HANG_TARGET, 11: THUONG_VUOT, 12: THUONG_TOP, 13: TONG_THUONG]
    const sampleData: any[][] = [
        ['', '', '', 'ĐML', '910 - Vĩnh Phúc', 'TIVI', '1.2', '50', '10', '2', '1', '1000000', '500000', '1500000'],
        ['', '', '', 'ĐML', '910 - Vĩnh Phúc', 'TỦ LẠNH', '0.9', '-10', '10', '15', '20', '0', '0', '0'],
        ['', '', '', 'ĐML', '123 - Hà Nội', 'TIVI', '1.1', '30', '10', '5', '4', '800000', '400000', '1200000'],
        ['', '', '', 'ĐML', '123 - Hà Nội', 'TỦ LẠNH', '1.05', '10', '10', '8', '6', '600000', '300000', '900000'],
        ['', '', '', 'ĐMM', '456 - TP.HCM', 'TIVI', '1.3', '40', '10', '1', '1', '2000000', '1000000', '3000000'],
        ['', '', '', 'ĐMM', '456 - TP.HCM', 'GIA DỤNG', '0.8', '-5', '10', '9', '8', '500000', '0', '500000'],
    ];

    it('parses groups correctly and calculates aggregated bonuses', () => {
        const groups = parseGroupSummariesFromData(sampleData);
        expect(groups.length).toBe(4); // ĐML-TIVI, ĐML-TỦ LẠNH, ĐMM-TIVI, ĐMM-GIA DỤNG

        // Sorted by totalBonus descending:
        // ĐMM - TIVI: 3.000.000
        // ĐML - TIVI: 1.500.000 + 1.200.000 = 2.700.000
        // ĐML - TỦ LẠNH: 0 + 900.000 = 900.000
        // ĐMM - GIA DỤNG: 500.000
        expect(groups[0].groupName).toBe('TIVI');
        expect(groups[0].channel).toBe('ĐMM');
        expect(groups[0].totalBonus).toBe(3000000);
        expect(groups[0].rank).toBe(1);

        expect(groups[1].groupName).toBe('TIVI');
        expect(groups[1].channel).toBe('ĐML');
        expect(groups[1].totalBonus).toBe(2700000);
        expect(groups[1].storeCount).toBe(2);
        expect(groups[1].storesWithBonusCount).toBe(2);
        expect(groups[1].topStore?.storeCode).toBe('910');
        expect(groups[1].topStore?.bonus).toBe(1500000);
    });

    it('filters by channel and re-ranks groups within that channel', () => {
        const groups = parseGroupSummariesFromData(sampleData);
        const dmlGroups = filterAndSortGroupSummaries(groups, {
            channel: 'ĐML',
            searchQuery: '',
            sortBy: 'totalBonus',
            sortOrder: 'desc'
        });

        expect(dmlGroups.length).toBe(2);
        expect(dmlGroups[0].groupName).toBe('TIVI');
        expect(dmlGroups[0].rank).toBe(1);
        expect(dmlGroups[0].totalBonus).toBe(2700000);

        expect(dmlGroups[1].groupName).toBe('TỦ LẠNH');
        expect(dmlGroups[1].rank).toBe(2);
        expect(dmlGroups[1].totalBonus).toBe(900000);
    });

    it('searches groups by name', () => {
        const groups = parseGroupSummariesFromData(sampleData);
        const filtered = filterAndSortGroupSummaries(groups, {
            channel: 'ALL',
            searchQuery: 'tủ lạnh',
            sortBy: 'totalBonus',
            sortOrder: 'desc'
        });

        expect(filtered.length).toBe(1);
        expect(filtered[0].groupName).toBe('TỦ LẠNH');
    });

    it('calculates distinct channels and group stats correctly', () => {
        const groups = parseGroupSummariesFromData(sampleData);
        const channels = getDistinctGroupChannels(groups);
        expect(channels).toEqual(['ĐML', 'ĐMM']);

        const stats = calculateGroupSystemStats(groups);
        expect(stats.totalGroups).toBe(4);
        expect(stats.totalBonus).toBe(3000000 + 2700000 + 900000 + 500000);
        expect(stats.topGroup?.groupName).toBe('TIVI');
        expect(stats.topGroup?.channel).toBe('ĐMM');
    });
});
