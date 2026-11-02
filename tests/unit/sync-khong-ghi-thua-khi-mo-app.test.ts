import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Lượt ghi thừa mỗi lần mở app (2026-10-30, remaining-work P4): mốc "lần đẩy cuối" khởi đầu rỗng nên lần ẩn app đầu tiên luôn ghi lại
 * đúng nội dung cloud đang có. Nay AuthContext ghi nhận bản cloud vừa kéo về làm mốc → không đổi gì thì không ghi.
 */
const setDoc = vi.fn(async () => {});
let mayCo: Record<string, unknown> = {};
const auth = { currentUser: { uid: 'u1' } as { uid: string } | null };

vi.mock('../../services/firebase', () => ({ db: {}, auth }));
vi.mock('firebase/firestore', () => ({ doc: () => ({}), setDoc: (...a: unknown[]) => (setDoc as (...x: unknown[]) => Promise<void>)(...a) }));
vi.mock('../../services/dbService/core', () => ({ getSettingsMatching: async () => ({ ...mayCo }) }));
vi.mock('../../services/firestoreService', () => ({ isHeavySyncKey: () => false }));
vi.mock('../../utils/localDbScope', () => ({ isLightSyncKey: () => false, isLocalOnlyKey: () => false }));

describe('pushSettingsToFirebase — không ghi lại nội dung cloud đã có', () => {
    beforeEach(() => { vi.resetModules(); setDoc.mockClear(); auth.currentUser = { uid: 'u1' }; });

    it('máy giống cloud (khác thứ tự khoá) → 0 lượt ghi; đổi 1 giá trị → ghi đúng 1 lần', async () => {
        const { pushSettingsToFirebase, ghiNhanBanCloud } = await import('../../services/syncService');
        mayCo = { b: [1, 2], a: { y: 1, x: 2 } };
        ghiNhanBanCloud('u1', { a: { x: 2, y: 1 }, b: [1, 2] });
        await pushSettingsToFirebase();
        expect(setDoc).not.toHaveBeenCalled();

        mayCo = { ...mayCo, b: [1, 2, 3] };
        await pushSettingsToFirebase();
        await pushSettingsToFirebase();
        expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('mốc của tài khoản khác không chặn lượt ghi', async () => {
        const { pushSettingsToFirebase, ghiNhanBanCloud } = await import('../../services/syncService');
        mayCo = { a: 1 };
        ghiNhanBanCloud('u-khac', { a: 1 });
        await pushSettingsToFirebase();
        expect(setDoc).toHaveBeenCalledTimes(1);
    });

    it('chưa kéo cloud (mốc trống) → vẫn ghi như trước', async () => {
        const { pushSettingsToFirebase } = await import('../../services/syncService');
        mayCo = { a: 1 };
        await pushSettingsToFirebase();
        expect(setDoc).toHaveBeenCalledTimes(1);
    });
});

describe('khoaKhoCuTrongCaiDat — khoá Kho cũ AuthContext dọn khỏi cloud', () => {
    it('chỉ chọn khoDataCache_* và khoDataAppliedSnapshot::*; hồ sơ trống → []', async () => {
        const { khoaKhoCuTrongCaiDat } = await import('../../services/syncService');
        expect(khoaKhoCuTrongCaiDat({ khoDataCache_910: 1, 'khoDataAppliedSnapshot::910': 2, khoDataNote: 3, theme: 'x' }).sort())
            .toEqual(['khoDataAppliedSnapshot::910', 'khoDataCache_910']);
        expect(khoaKhoCuTrongCaiDat(undefined)).toEqual([]);
    });
});
