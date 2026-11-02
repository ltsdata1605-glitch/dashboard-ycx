import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/firebase', () => ({ db: {}, auth: { currentUser: null } }));
import { boMucLucTepNeuMayDaCo, laKhoaDongBoCu } from '../../services/syncService';

/**
 * AUD-014 (2026-10-28): lúc đăng nhập, `users/{uid}.settings.salesFilesRegistry` (mục lục tệp của MÁY ĐẨY SAU CÙNG) từng được
 * mergeSettings chép ĐÈ lên mục lục của máy này → mất đường vào tệp chỉ nạp ở máy này. Máy đã có mục lục giữ nguyên của mình.
 */
const tep = (id: string) => ({ id, filename: `${id}.xlsx`, rowCount: 1, savedAt: 1, fileLastModified: 1, isActive: false });

describe('mục lục tệp bán hàng không bị bản cloud của máy khác đè', () => {
    it('máy đã có mục lục → bỏ khoá salesFilesRegistry của cloud, giữ khoá đường cũ khác', () => {
        const cloud = { salesFilesRegistry: [tep('a1')], 'last-updates-list': ['x'] };
        expect(boMucLucTepNeuMayDaCo(cloud, [tep('b1')])).toEqual({ 'last-updates-list': ['x'] });
    });
    it('máy mới (chưa có / rỗng) → lấy mục lục cloud như trước', () => {
        const cloud = { salesFilesRegistry: [tep('a1')] };
        expect(boMucLucTepNeuMayDaCo(cloud, null)).toBe(cloud);
        expect(boMucLucTepNeuMayDaCo(cloud, [])).toBe(cloud);
    });
    it('cloud không có mục lục → không đổi', () => {
        const cloud = { 'last-updates-list': [] };
        expect(boMucLucTepNeuMayDaCo(cloud, [tep('b1')])).toBe(cloud);
    });
    it('salesFilesRegistry vẫn đi đường cũ (bảng tệp hiện danh sách của máy khác ở máy mới)', () => {
        expect(laKhoaDongBoCu('salesFilesRegistry')).toBe(true);
    });
});
