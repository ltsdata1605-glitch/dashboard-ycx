import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Đọc sâu Cloud Functions 2026-10-30 — chạy THẬT requestAccess / adminUpdateUser trên Firestore/Auth giả:
 *  - AUD-035: người đã bị Từ chối / Thu hồi / Khoá gọi thẳng requestAccess KHÔNG được tự duyệt lại; xin nhiều Kho một lúc cũng không.
 *  - AUD-036: manager không sửa được tài khoản admin/manager khác cùng Kho.
 */
type Doc = Record<string, unknown>;
const users = new Map<string, Doc>();
const claims = new Map<string, Record<string, unknown>>();

const daXoa: string[] = [];
const docApi = (id: string) => ({
    id,
    get: async () => ({ exists: users.has(id), data: () => users.get(id), get: (k: string) => users.get(id)?.[k] }),
    set: async (v: Doc) => { users.set(id, { ...v }); },
    update: async (v: Doc) => {
        const cur = { ...(users.get(id) ?? {}) };
        for (const [k, val] of Object.entries(v)) if (typeof val !== 'object' || val === null) cur[k] = val;
        users.set(id, cur);
    },
});
vi.mock('../../functions/src/firebaseAdmin', () => ({
    // collection() bỏ qua tên: system_settings/approval không có → cấu hình mặc định (TỰ DUYỆT nhân viên BẬT)
    db: {
        collection: () => ({ doc: docApi }),
        getAll: async (ref: { get: () => Promise<unknown> }) => [await ref.get()],
        recursiveDelete: async (ref: { id: string }) => { daXoa.push(ref.id); users.delete(ref.id); },
    },
    stickerDb: {},
    STICKER_DB_ID: '(default)',
    auth: {
        getUser: async (uid: string) => ({ uid, customClaims: claims.get(uid) }),
        setCustomUserClaims: async (uid: string, c: Record<string, unknown>) => { claims.set(uid, { ...c }); },
    },
}));
vi.mock('../../functions/src/notifications', () => ({ notifyAdminsAndManagers: async () => {}, notifyUser: async () => {} }));

const { requestAccess, khongDuocTuDuyet } = await import('../../functions/src/session');
const { adminUpdateUser, deleteExpiredUsers } = await import('../../functions/src/admin');
const run = (fn: unknown, req: unknown) => (fn as { run: (r: unknown) => Promise<any> }).run(req);
const xin = (uid: string, departmentId = '910') =>
    run(requestAccess, { auth: { uid, token: { email: `${uid}@gmail.test` } }, data: { requestedRole: 'employee', departmentId, employeeName: '123' } });

beforeEach(() => { users.clear(); claims.clear(); daXoa.length = 0; });

describe('AUD-035 — requestAccess không vô hiệu quyết định của quản lý', () => {
    it('người mới (status new): vẫn tự duyệt như cấu hình', async () => {
        users.set('moi', { role: 'pending', status: 'new' });
        expect(await xin('moi')).toMatchObject({ autoApproved: true, status: 'approved' });
        expect(claims.get('moi')).toMatchObject({ role: 'employee', departmentId: '910' });
    });

    it.each(['rejected', 'expired', 'blocked'])('status %s: vào hàng chờ duyệt, token KHÔNG có quyền', async (status) => {
        users.set('u', { role: 'employee', status, departmentId: '910' });
        expect(await xin('u')).toMatchObject({ autoApproved: false, status: 'pending' });
        expect(users.get('u')).toMatchObject({ role: 'pending', status: 'pending' });
        expect(claims.get('u')).toMatchObject({ role: 'pending', departmentId: null });
    });

    it('xin nhiều Kho một lúc ("910,912"): không tự duyệt', async () => {
        users.set('moi2', { role: 'pending', status: 'new' });
        expect(await xin('moi2', '910,912')).toMatchObject({ autoApproved: false });
        expect(claims.get('moi2')).toMatchObject({ role: 'pending', departmentId: null });
    });

    it('hàm thuần khongDuocTuDuyet', () => {
        expect(khongDuocTuDuyet(undefined, '910')).toBe(false);
        expect(khongDuocTuDuyet({ role: 'blocked', status: 'approved' }, '910')).toBe(true);
        expect(khongDuocTuDuyet({ role: 'employee', status: 'approved' }, '910')).toBe(false);
    });
});

describe('AUD-036 — manager chỉ quản lý nhân viên / người chờ duyệt', () => {
    const mgr = { auth: { uid: 'mgr', token: { role: 'manager', departmentId: '910' } } };

    it.each(['admin', 'manager'])('manager sửa %s cùng Kho: bị từ chối, hồ sơ giữ nguyên', async (role) => {
        users.set('t', { role, status: 'approved', departmentId: '910' });
        await expect(run(adminUpdateUser, { ...mgr, data: { targetUid: 't', status: 'expired' } })).rejects.toMatchObject({ code: 'permission-denied' });
        await expect(run(adminUpdateUser, { ...mgr, data: { targetUid: 't', role: 'employee' } })).rejects.toMatchObject({ code: 'permission-denied' });
        expect(users.get('t')).toMatchObject({ role, status: 'approved' });
    });

    it('manager vẫn duyệt / thu hồi nhân viên cùng Kho; admin vẫn sửa được manager', async () => {
        users.set('nv', { role: 'pending', status: 'pending', departmentId: '910' });
        await run(adminUpdateUser, { ...mgr, data: { targetUid: 'nv', role: 'employee', status: 'approved' } });
        expect(claims.get('nv')).toMatchObject({ role: 'employee', departmentId: '910' });
        await run(adminUpdateUser, { ...mgr, data: { targetUid: 'nv', status: 'expired' } });
        expect(claims.get('nv')).toMatchObject({ role: 'pending' });

        users.set('m2', { role: 'manager', status: 'approved', departmentId: '910' });
        await run(adminUpdateUser, { auth: { uid: 'ad', token: { role: 'admin' } }, data: { targetUid: 'm2', status: 'expired' } });
        expect(users.get('m2')).toMatchObject({ status: 'expired' });
    });
});

describe('Xoá hẳn tài khoản đã hết hạn (deleteExpiredUsers)', () => {
    const admin = { auth: { uid: 'ad', token: { role: 'admin' } } };
    const mgr = { auth: { uid: 'mgr', token: { role: 'manager', departmentId: '910' } } };

    it('admin xoá được người hết hạn: hồ sơ mất, claims về pending; người đang hoạt động bị bỏ qua', async () => {
        users.set('het', { role: 'employee', status: 'expired', departmentId: '910' });
        users.set('dang', { role: 'employee', status: 'approved', departmentId: '910' });
        claims.set('het', { role: 'employee', departmentId: '910' });
        const kq = await run(deleteExpiredUsers, { ...admin, data: { uids: ['het', 'dang'] } });
        expect(kq.xoa).toEqual(['het']);
        expect(kq.boQua.map((b: { uid: string }) => b.uid)).toEqual(['dang']);
        expect(daXoa).toEqual(['het']);
        expect(users.has('het')).toBe(false);
        expect(claims.get('het')).toMatchObject({ role: 'pending', departmentId: null });
    });

    it('manager chỉ xoá nhân viên hết hạn trong Kho của mình', async () => {
        users.set('cung', { role: 'employee', status: 'expired', departmentId: '910' });
        users.set('khac', { role: 'employee', status: 'expired', departmentId: '555' });
        const kq = await run(deleteExpiredUsers, { ...mgr, data: { uids: ['cung', 'khac'] } });
        expect(kq.xoa).toEqual(['cung']);
        expect(kq.boQua).toEqual([{ uid: 'khac', lyDo: 'Ngoài Kho của bạn' }]);
    });

    it('không tự xoá chính mình; trên 50 tài khoản một lượt: từ chối', async () => {
        await expect(run(deleteExpiredUsers, { ...admin, data: { uids: ['ad'] } })).resolves.toMatchObject({ xoa: [] });
        const nhieu = Array.from({ length: 51 }, (_, i) => `u${i}`);
        await expect(run(deleteExpiredUsers, { ...admin, data: { uids: nhieu } })).rejects.toMatchObject({ code: 'invalid-argument' });
    });

    it('admin xoá được cả Quản lý hết hạn; quản lý không xoá được Quản lý; chủ hệ thống luôn được bảo vệ', async () => {
        users.set('ql', { role: 'manager', status: 'expired', departmentId: '910' });
        users.set('chu', { role: 'admin', status: 'expired', departmentId: '910', email: 'lts.truongson@gmail.com' });
        const kqMgr = await run(deleteExpiredUsers, { ...mgr, data: { uids: ['ql'] } });
        expect(kqMgr.boQua).toEqual([{ uid: 'ql', lyDo: 'Chỉ Quản trị hệ thống được xoá Admin/Quản lý' }]);
        const kqAdmin = await run(deleteExpiredUsers, { ...admin, data: { uids: ['ql', 'chu'] } });
        expect(kqAdmin.xoa).toEqual(['ql']);
        expect(kqAdmin.boQua).toEqual([{ uid: 'chu', lyDo: 'Không xoá tài khoản chủ hệ thống' }]);
    });

    it('xoá được hồ sơ đang chờ duyệt (nút Xoá hẳn ở tab Chờ duyệt)', async () => {
        users.set('cho', { role: 'pending', status: 'pending', departmentId: '910' });
        const kq = await run(deleteExpiredUsers, { ...admin, data: { uids: ['cho'] } });
        expect(kq.xoa).toEqual(['cho']);
    });

    it('nhân viên thường không được gọi', async () => {
        await expect(run(deleteExpiredUsers, { auth: { uid: 'x', token: { role: 'employee' } }, data: { uids: ['a'] } }))
            .rejects.toMatchObject({ code: 'permission-denied' });
    });
});
