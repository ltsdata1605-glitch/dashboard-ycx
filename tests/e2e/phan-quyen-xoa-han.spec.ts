import { test, expect, type Page } from '@playwright/test';

/**
 * Ba tab của màn "Phân quyền & Duyệt yêu cầu" không được gọi Cloud Function thừa.
 *
 * Đo ngày 2026-09-25 TRƯỚC khi sửa: bấm lần lượt Chờ duyệt -> Hoạt động -> Hết hạn tốn
 * **4 lượt gọi** `["pending","active","expired","active"]` — lượt `active` cuối là nhánh gộp thêm
 * của tab "Hết hạn", lấy lại đúng dữ liệu mà tab "Hoạt động" vừa lấy xong.
 * Sau khi sửa (services/managedUsersCache.ts): **3 lượt**, và bấm qua lại không tốn thêm lượt nào.
 */

const CHAM_MS = 800;
const AUTH_STUB = `
const noop = () => {};
export class GoogleAuthProvider { addScope() {} setCustomParameters() {} static credentialFromResult() { return null; } }
export function getAuth() { return { currentUser: null }; }
export function initializeAuth() { return { currentUser: null }; } // services/firebase.ts dùng initializeAuth (2026-10-21)
export const indexedDBLocalPersistence = {}; export const browserPopupRedirectResolver = {};
const fakeUser = { uid: 'u-quanly', email: 'quanly@test.local', displayName: 'Quản Lý Kho 405', photoURL: null,
  getIdTokenResult: async () => ({ claims: { role: 'manager', departmentId: '405' } }), getIdToken: async () => 'token' };
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
export const resolveSession = async () => ({ role: 'manager', status: 'approved', departmentId: '405', employeeName: '21707', expiresAt: null });
export const requestAccess = async () => {};
`;
const ADMIN_STUB = `
export const MANAGED_USERS_CHANGED_EVENT = 'ycx-managed-users-changed';
window.__goi = [];
window.__xoa = [];
const hetHan = [
  { id: 'het-1', displayName: 'Nguyễn Hết Hạn', email: 'het1@test.local', role: 'employee', status: 'expired', departmentId: '405', employeeName: '140138', expiresAt: null, loginCount: 1 },
  { id: 'het-2', displayName: 'Trần Hết Hạn', email: 'het2@test.local', role: 'employee', status: 'expired', departmentId: '405', employeeName: '58625', expiresAt: null, loginCount: 2 },
];
export const listManagedUsers = async (mode) => {
  window.__goi.push(mode);
  return mode === 'expired' ? hetHan.map(u => ({ ...u })) : [];
};
export const deleteExpiredUsers = async (uids) => {
  window.__xoa.push(uids);
  return { xoa: uids, boQua: [] };
};
export const adminUpdateUser = async () => { window.dispatchEvent(new CustomEvent(MANAGED_USERS_CHANGED_EVENT)); };
`;

async function moApp(page: Page) {
    await page.route('**/node_modules/.vite/deps/firebase_auth.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: AUTH_STUB }));
    await page.route('**/services/sessionService.ts*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: SESSION_STUB }));
    await page.route('**/services/adminUserService.ts*', r => r.fulfill({ status: 200, contentType: 'application/javascript', body: ADMIN_STUB }));
}

const xoaDaGoi = (page: Page) => page.evaluate(() => (window as unknown as { __xoa: string[][] }).__xoa.slice());

test('tab Hết hạn: chọn từng người, xoá hẳn có xác nhận; dòng đã xoá biến mất', async ({ page }) => {
    test.setTimeout(120000);
    await moApp(page);
    await page.goto('/?tab=analysis');
    await page.getByTitle('Cài đặt & Phân quyền').click();
    await page.getByRole('button', { name: /Hết hạn/i }).first().click();
    await expect(page.getByText('Nguyễn Hết Hạn')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Trần Hết Hạn')).toBeVisible();

    await page.getByRole('checkbox', { name: /Nguyễn Hết Hạn.*xoá hẳn/i }).check();
    await page.getByRole('button', { name: /Xoá hẳn \(1\)/ }).click();
    const hop = page.getByRole('dialog');
    await expect(hop.getByText(/Xoá hẳn 1 tài khoản/)).toBeVisible();
    await hop.getByRole('button', { name: 'Xoá hẳn', exact: true }).click();

    await expect.poll(() => xoaDaGoi(page), { timeout: 15000 }).toEqual([['het-1']]);
    await expect(page.getByText('Nguyễn Hết Hạn')).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByText('Trần Hết Hạn')).toBeVisible();
});
