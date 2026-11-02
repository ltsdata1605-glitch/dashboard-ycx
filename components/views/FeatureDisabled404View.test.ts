import { describe, it, expect } from 'vitest';
import { getFeatureById, APP_MENU_FEATURES } from '../../constants/menuFeatures';

describe('FeatureDisabled404View and menuFeatures mapping', () => {
    it('getFeatureById tìm thấy đúng tính năng', () => {
        const checkThuong = getFeatureById('check-thuong');
        expect(checkThuong).toBeDefined();
        expect(checkThuong?.label).toBe('Check thưởng');
        expect(checkThuong?.group).toBe('main');

        const tax = getFeatureById('tools-tax');
        expect(tax).toBeDefined();
        expect(tax?.label).toBe('Tính thuế TNCN');
        expect(tax?.group).toBe('tools');
    });

    it('toàn bộ các feature có id hợp lệ và icon hợp lệ', () => {
        expect(APP_MENU_FEATURES.length).toBeGreaterThanOrEqual(10);
        for (const feat of APP_MENU_FEATURES) {
            expect(feat.id).toBeTruthy();
            expect(feat.label).toBeTruthy();
            expect(feat.icon).toBeTruthy();
            expect(feat.queryTab).toBeTruthy();
        }
    });

    it('không có id tính năng cốt lõi (settings, pending-approval) trong danh sách có thể tắt', () => {
        const ids = APP_MENU_FEATURES.map(f => f.id);
        expect(ids).not.toContain('settings');
        expect(ids).not.toContain('approval');
        expect(ids).not.toContain('pending-approval');
    });
});

