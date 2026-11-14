import type { Page } from '@playwright/test';
import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { appPath } from './appBase';

/**
 * Đăng nhập TÀI KHOẢN THẬT bằng custom token (2026-09-28, "Cách B"): container không qua được
 * popup Google (mật khẩu/2FA), nên một script ngoài repo dùng service account test ký custom token
 * cho `FIREBASE_TEST_UID`, ghi ra file và trỏ `E2E_CUSTOM_TOKEN_FILE` tới đó. Token hết hạn sau 1 giờ.
 * (2026-10-10) Có `FIREBASE_TEST_UID` + `FIREBASE_TEST_SA_B64` trong môi trường (environment cloud đã
 * đặt sẵn) thì helper TỰ ký token mới mỗi lượt chạy — không cần file, không lo hết hạn.
 *
 * CHỈ ĐỌC: `chanGhiCloud()` chặn mọi lượt ghi Firestore từ trình duyệt (kênh WebChannel
 * `Firestore/Write`) và mọi Cloud Function trừ `resolveSession` và `listManagedUsers` (chỉ đọc) — hàm bắt buộc để vào app, nó chỉ
 * cập nhật `lastLogin`/`loginCount` như mọi lần đăng nhập bình thường.
 */
export const customTokenFile = () => process.env.E2E_CUSTOM_TOKEN_FILE || '';

/** Khoá service account test lấy từ biến môi trường của environment cloud (base64 hoặc JSON thô).
 *  `FIREBASE_TEST_SA_B64` ưu tiên; `GOOGLE_APPLICATION_CREDENTIALS_JSON` là cùng tài khoản, khoá khác. */
const khoaServiceAccount = (): { client_email: string; private_key: string } | null => {
    const tho = process.env.FIREBASE_TEST_SA_B64 || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '';
    if (!tho || !process.env.FIREBASE_TEST_UID) return null;
    try {
        const json = tho.trim().startsWith('{') ? tho : Buffer.from(tho, 'base64').toString('utf8');
        const sa = JSON.parse(json);
        return sa.client_email && sa.private_key ? sa : null;
    } catch { return null; }
};

export const hasCustomToken = () => !!khoaServiceAccount() || (!!customTokenFile() && existsSync(customTokenFile()));

/** Ký custom token MỚI (hạn 1 giờ) cho `FIREBASE_TEST_UID` — đúng định dạng `createCustomToken` của
 *  Admin SDK (JWT RS256, aud IdentityToolkit) nhưng chỉ cần `node:crypto`, không kéo firebase-admin vào
 *  test. Ký tại chỗ mỗi lần chạy nên không bao giờ dùng phải token hết hạn như file ghi sẵn. */
const kyCustomToken = (): string | null => {
    const sa = khoaServiceAccount();
    if (!sa) return null;
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const iat = Math.floor(Date.now() / 1000);
    const dauVao = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
        iss: sa.client_email,
        sub: sa.client_email,
        aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
        iat,
        exp: iat + 3600,
        uid: process.env.FIREBASE_TEST_UID,
    })}`;
    return `${dauVao}.${createSign('RSA-SHA256').update(dauVao).sign(sa.private_key, 'base64url')}`;
};

export const chanGhiCloud = async (page: Page) => {
    const biChan: string[] = [];
    await page.context().route(/firestore\.googleapis\.com\/.*Firestore\/Write\//, route => {
        // Ghi lại document định ghi (nằm trong thân form-urlencoded của WebChannel).
        const than = decodeURIComponent((route.request().postData() || '').replace(/\+/g, ' '));
        // Tên document nằm trong JSON lồng (dấu nháy có thể đã escape \") — không in thân request: có token.
        const docs = [...new Set([...than.matchAll(/databases\/[^/]+\/documents\/([^"\\]+)/g)].map(m => m[1]))];
        const khoa = [...new Set([...than.matchAll(/"settingsStoreBackup"\s*:\s*\{\s*"mapValue"\s*:\s*\{\s*"fields"\s*:\s*\{(.*)/g)].map(m => [...m[1].matchAll(/"([^"]+)"\s*:\s*\{\s*"(?:mapValue|stringValue|booleanValue|integerValue|arrayValue|nullValue|doubleValue)"/g)].slice(0, 12).map(x => x[1]).join('|')))];
        biChan.push(`Firestore/Write${docs.length ? ' ' + docs.join(',') : ''}${khoa.length && khoa[0] ? ' [' + khoa.join(';') + ']' : ''}`);
        return route.abort();
    });
    // Transaction (vd đẩy cấu hình nhẹ theo từng khoá — services/lightSync.ts, 2026-10-14) KHÔNG đi kênh Write ở trên mà
    // ghi qua REST `documents:commit` / `:batchWrite` → phải chặn riêng, kẻo ghi thật vào tài khoản test.
    await page.context().route(/firestore\.googleapis\.com\/v1\/.*documents:(commit|batchWrite)/, route => {
        biChan.push(`Firestore/${route.request().url().includes(':commit') ? 'commit' : 'batchWrite'}`);
        return route.abort();
    });
    await page.context().route(/cloudfunctions\.net\/|\.run\.app\//, route => {
        const ten = new URL(route.request().url()).pathname.split('/').filter(Boolean).pop() || '';
        // resolveSession: bắt buộc để vào app. listManagedUsers: chỉ đọc danh sách user cùng Kho.
        if (ten === 'resolveSession' || ten === 'listManagedUsers') return route.continue();
        biChan.push(`fn:${ten}`);
        return route.abort();
    });
    return biChan;
};

/** Mở app, đăng nhập bằng custom token qua ĐÚNG instance `auth` của app (cùng URL module Vite). */
export const dangNhapBangToken = async (page: Page) => {
    const token = kyCustomToken() || readFileSync(customTokenFile(), 'utf8').trim();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(async ({ t, duongDanApp }) => {
        // Lấy đúng URL deps đã tối ưu mà services/firebase.ts đang import, để dùng chung bản module
        // (khác `?v=` là ra bản `firebase/auth` thứ hai, không nhận instance auth của app).
        // duongDanApp có tiền tố base (`/dashboard-ycx/services/firebase.ts`) — `/services/…` trần là 404 từ aaa1d73.
        const src = await (await fetch(duongDanApp)).text();
        const depUrl = src.match(/from\s+["']([^"']*firebase_auth[^"']*)["']/)?.[1];
        if (!depUrl) throw new Error(`Không tìm thấy import firebase/auth trong ${duongDanApp}`);
        const fb = await import(/* @vite-ignore */ duongDanApp) as { auth: unknown };
        const fa = await import(/* @vite-ignore */ depUrl) as { signInWithCustomToken: (a: unknown, t: string) => Promise<unknown> };
        await fa.signInWithCustomToken(fb.auth, t);
    }, { t: token, duongDanApp: appPath('/services/firebase.ts') });
};

/** Tên các khoá trong `users/{FIREBASE_TEST_UID}.settings` trên cloud — đọc bằng CHÍNH tài khoản test (rules cho chủ hồ sơ đọc),
 *  REST chỉ đọc. Để bài test kiểm điều kiện đầu vào thật thay vì giả định (AUD-015, 2026-10-30: hồ sơ đã sạch khoá Kho cũ nên bài
 *  "app tự dọn" chờ mãi một dòng log không bao giờ có). null = không đọc được. */
export const docKhoaCaiDatCloud = async (): Promise<string[] | null> => {
    const token = kyCustomToken();
    if (!token) return null;
    const cfg = JSON.parse(readFileSync('features/sticker-event/firebase-applet-config.json', 'utf8')) as { apiKey: string; projectId: string };
    const dn = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${cfg.apiKey}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, returnSecureToken: true }),
    }).then(r => r.json()).catch(() => null) as { idToken?: string } | null;
    if (!dn?.idToken) return null;
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/(default)/documents/users/${process.env.FIREBASE_TEST_UID}?mask.fieldPaths=settings`,
        { headers: { authorization: `Bearer ${dn.idToken}` } }).catch(() => null);
    if (!r?.ok) return null;
    const doc = await r.json() as { fields?: { settings?: { mapValue?: { fields?: Record<string, unknown> } } } };
    return Object.keys(doc.fields?.settings?.mapValue?.fields || {});
};
