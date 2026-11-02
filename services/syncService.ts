import { db, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getSettingsMatching } from './dbService/core';
import { isHeavySyncKey } from './firestoreService';
import { isLightSyncKey, isLocalOnlyKey } from '../utils/localDbScope';

// Đọc thẳng sessionStorage (không qua React Context) — module thuần, không phải hook. Đây là
// nguồn chân lý duy nhất cho Demo Mode (xem contexts/AuthContext.tsx isDemoMode/setDemoMode).
// BUG FIX: initSyncListeners() trước đây không hề kiểm tra Demo Mode (khác hooks/useCloudSync.ts
// đã gate rõ ràng `!user || isDemoMode`) — auth.currentUser vẫn là tài khoản THẬT khi bật Demo
// Mode (chỉ userRole/status bị che), nên sửa setting lúc xem Demo Mode vẫn bị đẩy lên Firestore
// tài khoản thật.
const isDemoModeActive = (): boolean =>
    typeof window !== 'undefined' && (sessionStorage.getItem('ycx_demo_mode') === 'true' || localStorage.getItem('ycx_demo_mode') === 'true');

// Keys that are too large or unnecessary for cloud sync
const EXCLUDED_SYNC_KEYS = new Set([
    'productConfig',
    'departmentMap',
    'localSettingsLastModified',
    'topSellerAnalysisHistory',   // Contains Employee[] arrays — can be huge
    'customTabs',                 // Large contest table configs
    'headToHeadTables',           // Large table configs
    'customCalendars',            // Calendar data
    'crossSellingConfig',         // Can grow large
    'industryAnalysisCustomTabs', // Large analysis configs
    'analysis-employees-list',    // Heavy sync key - synced separately to configs/{key}
]);

/**
 * Đường đồng bộ CŨ (users/{uid}.settings) — từ 2026-10-14 CHỈ còn lo các khoá mà đường mới KHÔNG quản:
 * khoá cấu hình nhẹ → services/lightSync.ts (mới nhất thắng theo từng khoá), khoá nặng → configs/{key}.
 * Trước đây đường này đẩy MỌI cài đặt mỗi lần ẩn app và lúc đăng nhập ghi đè NGUYÊN bộ xuống máy, không mốc thời gian
 * — máy nào ẩn app sau cùng "thắng" dù dữ liệu cũ hơn, và còn chép cả trạng thái riêng từng máy (tab đang mở, chế độ
 * xem…) sang máy khác (đo thật bằng tests/e2e/dong-bo-hai-may-du-lieu-that.spec.ts).
 */
export const laKhoaDongBoCu = (key: string): boolean =>
    !EXCLUDED_SYNC_KEYS.has(key) &&
    !key.startsWith('cached_') &&
    !key.startsWith('lastModified_') &&
    !key.startsWith('bi_') &&
    !key.startsWith('khoDataCache_') &&
    !key.startsWith('khoDataAppliedSnapshot::') &&
    !isHeavySyncKey(key) &&
    !isLightSyncKey(key) &&
    !isLocalOnlyKey(key);

/** Lọc bản `settings` tải từ Cloud: chỉ giữ khoá đường cũ còn quản (xem laKhoaDongBoCu). */
export const locCaiDatDongBoCu = (settings: Record<string, unknown>): Record<string, unknown> =>
    Object.fromEntries(Object.entries(settings).filter(([k]) => laKhoaDongBoCu(k)));

/** Khoá bản sao dữ liệu Kho của app CŨ còn sót trong users/{uid}.settings — không ai đọc nữa, AuthContext xoá khỏi cloud. */
export const khoaKhoCuTrongCaiDat = (settings: Record<string, unknown> | undefined): string[] =>
    settings ? Object.keys(settings).filter(k => k.startsWith('khoDataCache_') || k.startsWith('khoDataAppliedSnapshot::')) : [];

/**
 * Mục lục tệp bán hàng (`salesFilesRegistry`) là chỉ mục tới dữ liệu NẰM TRÊN MÁY này (IndexedDB). Kéo bản cloud của máy khác về
 * mà chép đè (mergeSettings) thì máy này mất đường vào tệp của chính nó — dữ liệu còn trong IndexedDB nhưng không hiện nữa
 * (AUD-014, 2026-10-28). Quy tắc: máy ĐÃ có mục lục giữ nguyên của mình; máy CHƯA có (mới đăng nhập) lấy bản cloud để thấy danh
 * sách tệp — tệp không có dữ liệu trên máy hiện gạch ngang "Thiếu dữ liệu gốc" như trước. Không gộp hợp: gộp làm tệp đã xoá ở
 * máy này "sống lại" khi đi vòng qua máy khác.
 */
export const boMucLucTepNeuMayDaCo = (cloud: Record<string, unknown>, mucLucMay: unknown): Record<string, unknown> => {
    if (!('salesFilesRegistry' in cloud)) return cloud;
    if (!Array.isArray(mucLucMay) || mucLucMay.length === 0) return cloud;
    const { salesFilesRegistry: _boQua, ...conLai } = cloud;
    return conLai;
};

/** JSON không phụ thuộc thứ tự khoá (undefined → null như lúc ghi) — để so "bản sắp đẩy" với "bản cloud vừa kéo về". */
const jsonOnDinh = (v: unknown): string => JSON.stringify(v, (_k, x) => {
    if (x === undefined) return null;
    if (x && typeof x === 'object' && !Array.isArray(x)) {
        return Object.fromEntries(Object.keys(x as Record<string, unknown>).sort().map(k => [k, (x as Record<string, unknown>)[k]]));
    }
    return x;
});

/** Nội dung đã có trên cloud theo uid (lần đẩy trước, hoặc bản vừa kéo lúc đăng nhập). Trước 2026-10-30 mốc này khởi đầu rỗng →
 *  lần ẩn app đầu tiên sau MỖI lần mở luôn ghi lại đúng nội dung cloud đang có (1 lượt ghi Firestore thừa / lần mở). */
let lanDayCuoi: { uid: string; json: string } | null = null;

/** Gọi sau khi kéo users/{uid}.settings về (AuthContext): coi bản cloud (đã lọc khoá đường cũ) là mốc đã đẩy. */
export const ghiNhanBanCloud = (uid: string, settingsCloud: Record<string, unknown>) => {
    lanDayCuoi = { uid, json: jsonOnDinh(settingsCloud) };
};

// Firestore max doc size is 1MB. We target 800KB to leave room for other document fields.
const MAX_SYNC_BYTES = 800 * 1024;

export const pushSettingsToFirebase = async () => {
    const user = auth.currentUser;
    if (!user || isDemoModeActive()) return;
    try {
        // Lọc chỉ đồng bộ các cấu hình tĩnh, dung lượng nhẹ. KHÔNG ĐỒNG BỘ data lớn.
        // PERF FIX (2026-10-07): lọc theo TÊN khoá trước khi đọc giá trị — bản cũ getAllSettings() nạp và
        // JSON.stringify cả khoDataCache_* (dữ liệu Kho hàng MB, lọt bộ lọc) rồi mới cắt vì quá 800KB:
        // đứng hình ~6s + giữ kho settings lúc mở app trên điện thoại. 2 tiền tố Kho là cache riêng máy.
        const settingsToSync = await getSettingsMatching(laKhoaDongBoCu);
        if (Object.keys(settingsToSync).length === 0) return;

        // Safety: estimate size and trim if over limit without blocking the thread
        let jsonStr = JSON.stringify(settingsToSync);
        if (jsonStr.length > MAX_SYNC_BYTES) {
            console.warn(`[Sync] Settings too large (${(jsonStr.length / 1024).toFixed(0)}KB). Trimming largest keys...`);
            // Pre-calculate size contributions
            const entries = Object.entries(settingsToSync)
                .map(([k, v]) => ({ key: k, valueStr: JSON.stringify(v) }))
                .map(item => ({ key: item.key, size: item.valueStr.length + item.key.length + 4 }))
                .sort((a, b) => b.size - a.size);
            
            let currentSize = jsonStr.length;
            for (const entry of entries) {
                if (currentSize <= MAX_SYNC_BYTES) break;
                delete settingsToSync[entry.key];
                currentSize -= entry.size;
                console.warn(`[Sync] Removed key "${entry.key}" (${(entry.size / 1024).toFixed(1)}KB) to reduce sync size`);
            }
            jsonStr = JSON.stringify(settingsToSync); // stringify only once at the end
        }

        const vanTay = jsonOnDinh(settingsToSync);
        if (lanDayCuoi && lanDayCuoi.uid === user.uid && lanDayCuoi.json === vanTay) return; // cloud đã có đúng nội dung này — khỏi ghi
        const userRef = doc(db, 'users', user.uid);
        // Lọc bỏ các giá trị undefined đệ quy thành null trước khi lưu lên Firestore
        const cleanSettings = JSON.parse(JSON.stringify(settingsToSync, (k, v) => v === undefined ? null : v));
        await setDoc(userRef, { settings: cleanSettings }, { merge: true });
        lanDayCuoi = { uid: user.uid, json: vanTay };
        console.warn(`[Sync] Đã đồng bộ ngầm cài đặt lên Firebase (${(jsonStr.length / 1024).toFixed(0)}KB)`);
    } catch (e) {
        console.error("[Sync] Lỗi push settings lên Firebase:", e);
    }
};

export const initSyncListeners = () => {
    let debounceTimer: ReturnType<typeof setTimeout>;
    
    // Khi ẩn trình duyệt (đổi qua tab khác, thu nhỏ)
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
            pushSettingsToFirebase();
        }
    };
    
    // Fallback cho refresh/close tab
    const handleBeforeUnload = () => {
        pushSettingsToFirebase();
    };

    // Khi người dùng thay đổi setting (IndexedDB trigger event) -> debounced sync
    const handleSettingChanged = (e: CustomEvent<{ key: string; source?: string }>) => {
        const key = e.detail?.key;
        if (!key || !laKhoaDongBoCu(key)) return;
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            pushSettingsToFirebase();
        }, 2000); // Tự động sync ngầm lên Firebase sau 2s khi có thay đổi
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('ycx-setting-changed', handleSettingChanged as EventListener);

    return () => {
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('ycx-setting-changed', handleSettingChanged as EventListener);
        clearTimeout(debounceTimer);
    };
};
