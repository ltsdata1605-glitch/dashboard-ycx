import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Ba tab của màn "Phân quyền & Duyệt yêu cầu" không được gọi Cloud Function thừa.
 *
 * Đo ngày 2026-09-25 TRƯỚC khi sửa: bấm lần lượt Chờ duyệt -> Hoạt động -> Hết hạn tốn
 * **4 lượt gọi** `["pending","active","expired","active"]` — lượt `active` cuối là nhánh gộp thêm
 * của tab "Hết hạn", lấy lại đúng dữ liệu mà tab "Hoạt động" vừa lấy xong.
 * Sau khi sửa (services/managedUsersCache.ts): **3 lượt**, và bấm qua lại không tốn thêm lượt nào.
 */

const AUTH_STUB = `
const noop = () => {};
export class GoogleAuthProvider { addScope() {} setCustomParameters() {} static credentialFromResult() { return null; } }
export function getAuth() { return { currentUser: null }; }
export function initializeAuth() { return { currentUser: null }; } // services/firebase.ts dùng initializeAuth (2026-10-21)
export const indexedDBLocalPersistence = {}; export const browserPopupRedirectResolver = {};
const fakeUser = { uid: 'u-admin', email: 'admin@test.local', displayName: 'Quản trị', photoURL: null,
  getIdTokenResult: async () => ({ claims: { role: 'admin', departmentId: 'ALL (Super Admin)' } }), getIdToken: async () => 'token' };
export function onAuthStateChanged(auth, cb) { window.__authCb = cb; setTimeout(() => cb(fakeUser), 30); return noop; }
export async function signInWithPopup() { window.__authCb(fakeUser); return { user: fakeUser }; }
export async function signInWithRedirect() {}
export async function getRedirectResult() { return null; }
export async function signInWithCredential() { return { user: null }; } // đăng nhập app Màn hình chính iPhone (services/firebase.ts, 2026-10-12)
export async function signOut() { window.__authCb(null); }
export const browserLocalPersistence = {}; export const browserSessionPersistence = {};
export async function setPersistence() {}
export function getIdToken() { return Promise.resolve('token'); }
`;
const SESSION_STUB = `
export const resolveSession = async () => ({ role: 'admin', status: 'approved', departmentId: 'ALL (Super Admin)', employeeName: 'Quản trị', expiresAt: null });
export const requestAccess = async () => {};
`;
const ADMIN_STUB = `
export const MANAGED_USERS_CHANGED_EVENT = 'ycx-managed-users-changed';
export const listManagedUsers = async () => [];
export const deleteExpiredUsers = async () => ({ xoa: [], boQua: [] });
export const adminUpdateUser = async () => {};
`;
async function moApp(page: Page) {
    await page.route('**/node_modules/.vite/deps/firebase_auth.js*', (r: Route) => r.fulfill({ status: 200, contentType: 'application/javascript', body: AUTH_STUB }));
    await page.route('**/services/sessionService.ts*', (r: Route) => r.fulfill({ status: 200, contentType: 'application/javascript', body: SESSION_STUB }));
    await page.route('**/services/adminUserService.ts*', (r: Route) => r.fulfill({ status: 200, contentType: 'application/javascript', body: ADMIN_STUB }));
}

test('quản trị bấm Quản lý: nút đổi trạng thái NGAY, không chờ đồng bộ', async ({ page }) => {
    test.setTimeout(120000);
    await moApp(page);
    await page.goto('/?tab=analysis');
    await page.getByTitle('Cài đặt & Phân quyền').click();
    await page.getByRole('button', { name: /Bật\/tắt chức năng/i }).first().click();
    const quanLy = page.getByRole('button', { name: 'Quản lý', exact: true }).first();
    await expect(quanLy).toHaveAttribute('aria-pressed', 'true', { timeout: 20000 });
    await quanLy.click();
    await expect(quanLy).toHaveAttribute('aria-pressed', 'false', { timeout: 5000 });
    await quanLy.click();
    await expect(quanLy).toHaveAttribute('aria-pressed', 'true', { timeout: 5000 });
});
