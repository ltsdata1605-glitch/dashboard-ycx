import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simple mock for localStorage in Node environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
    getItem: vi.fn((key: string) => mockStorage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
    }),
    clear: vi.fn(() => {
        for (const k in mockStorage) delete mockStorage[k];
    }),
};

// Mock window.localStorage for test
(globalThis as unknown as { localStorage: typeof localStorageMock }).localStorage = localStorageMock;

vi.mock('firebase/firestore', () => ({
    doc: vi.fn(),
    getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
    setDoc: vi.fn().mockResolvedValue(undefined),
    onSnapshot: vi.fn(),
}));

vi.mock('./firebase', () => ({
    db: {},
}));

import {
    getDefaultFeaturesMap,
    getLocalMenuConfig,
    saveSystemMenuConfig,
} from './menuConfigService';
import { APP_MENU_FEATURES } from '../constants/menuFeatures';

describe('menuConfigService', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    it('getDefaultFeaturesMap trả về toàn bộ tính năng VÀ tab con với giá trị mặc định là true', () => {
        // Tab con (vd In Sticker › Giá Sốc) bật/tắt riêng được từ 5f82fa4 → map gồm cả id tab con, không chỉ tính năng.
        const defaults = getDefaultFeaturesMap();
        const ids = APP_MENU_FEATURES.flatMap(f => [f.id, ...(f.subTabs ?? []).map(s => s.id)]);
        expect(Object.keys(defaults).sort()).toEqual([...ids].sort());
        for (const id of ids) {
            expect(defaults[id]).toBe(true);
        }
    });

    it('getLocalMenuConfig trả về cấu hình mặc định khi localStorage trống', () => {
        const config = getLocalMenuConfig();
        // 'analysis' (Phân tích YCX) và 'employees' (Report BI) đã bỏ khỏi app ở eb1fa51.
        expect(config.features['check-thuong']).toBe(true);
        expect(config.features['thuong']).toBe(true);
        expect(config.features['tools-print-sticker:gia_soc']).toBe(true);
        expect(config.features['analysis']).toBeUndefined();
    });

    it('saveSystemMenuConfig lưu thành công vào localStorage cache và gọi Firestore', async () => {
        const customFeatures = getDefaultFeaturesMap();
        customFeatures['check-thuong'] = false;
        customFeatures['tools-tax'] = false;

        // Lưu
        await saveSystemMenuConfig(customFeatures, {
            email: 'admin@example.com',
            name: 'Super Admin',
        });

        // Đọc lại từ localStorage
        const stored = JSON.parse(mockStorage['ycx_system_menu_config_v1'] || '{}');
        expect(stored.features['check-thuong']).toBe(false);
        expect(stored.features['tools-tax']).toBe(false);
        expect(stored.features['thuong']).toBe(true);
        expect(stored.updatedBy).toBe('admin@example.com');
        expect(stored.updatedByName).toBe('Super Admin');
    });
});
