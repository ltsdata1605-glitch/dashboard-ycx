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

    it('getDefaultFeaturesMap trả về toàn bộ tính năng với giá trị mặc định là true', () => {
        const defaults = getDefaultFeaturesMap();
        expect(Object.keys(defaults).length).toBe(APP_MENU_FEATURES.length);
        for (const feat of APP_MENU_FEATURES) {
            expect(defaults[feat.id]).toBe(true);
        }
    });

    it('getLocalMenuConfig trả về cấu hình mặc định khi localStorage trống', () => {
        const config = getLocalMenuConfig();
        expect(config.features['analysis']).toBe(true);
        expect(config.features['employees']).toBe(true);
        expect(config.features['check-thuong']).toBe(true);
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
        expect(stored.features['analysis']).toBe(true);
        expect(stored.updatedBy).toBe('admin@example.com');
        expect(stored.updatedByName).toBe('Super Admin');
    });
});
