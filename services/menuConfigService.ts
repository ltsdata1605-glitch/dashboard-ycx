import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { APP_MENU_FEATURES } from '../constants/menuFeatures';

export const SHARED_CONFIGS_COLLECTION = 'shared_configs';
export const SYSTEM_MENU_CONFIG_DOC_ID = 'system_menu_config';
const LOCAL_STORAGE_KEY = 'ycx_system_menu_config_v1';

/** Vai trò được phép XEM một chức năng (2026-10-30). Quản trị hệ thống luôn xem được mọi chức năng. */
export type MenuRole = 'admin' | 'manager' | 'employee';
export const TAT_CA_VAI_TRO: MenuRole[] = ['admin', 'manager', 'employee'];

export interface SystemMenuConfigDoc {
    /** Mapping từ featureId -> boolean (true: mở, false: tắt) */
    features: Record<string, boolean>;
    /** Vai trò được xem từng chức năng. Thiếu khoá = mọi vai trò đều xem được. */
    featureRoles?: Record<string, MenuRole[]>;
    updatedAt?: string;
    updatedBy?: string;
    updatedByName?: string;
}

/** Giá trị mặc định ban đầu: toàn bộ các chức năng và tab con đều được BẬT (true) */
export function getDefaultFeaturesMap(): Record<string, boolean> {
    const map: Record<string, boolean> = {};
    for (const item of APP_MENU_FEATURES) {
        map[item.id] = item.defaultEnabled ?? true;
        if (item.subTabs) {
            for (const sub of item.subTabs) {
                map[sub.id] = sub.defaultEnabled ?? true;
            }
        }
    }
    return map;
}

// In-memory cache
let inMemoryConfig: SystemMenuConfigDoc | null = null;

/** Đọc cấu hình từ localStorage để nạp tức thì khi chưa kịp có mạng */
export function getLocalMenuConfig(): SystemMenuConfigDoc {
    if (inMemoryConfig) return inMemoryConfig;

    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.features === 'object') {
                inMemoryConfig = {
                    features: { ...getDefaultFeaturesMap(), ...parsed.features },
                    featureRoles: parsed.featureRoles,
                    updatedAt: parsed.updatedAt,
                    updatedBy: parsed.updatedBy,
                    updatedByName: parsed.updatedByName,
                };
                return inMemoryConfig;
            }
        }
    } catch (e) {
        console.warn('[MenuConfig] Lỗi đọc localStorage:', e);
    }

    inMemoryConfig = {
        features: getDefaultFeaturesMap(),
    };
    return inMemoryConfig;
}

/** Lưu cấu hình vào localStorage */
function saveLocalMenuConfig(config: SystemMenuConfigDoc) {
    try {
        inMemoryConfig = config;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
        console.warn('[MenuConfig] Lỗi ghi localStorage:', e);
    }
}

/** Đọc cấu hình một lần từ Firestore */
export async function fetchSystemMenuConfig(): Promise<SystemMenuConfigDoc> {
    try {
        const docRef = doc(db, SHARED_CONFIGS_COLLECTION, SYSTEM_MENU_CONFIG_DOC_ID);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
            const data = snap.data() as Partial<SystemMenuConfigDoc>;
            const fullConfig: SystemMenuConfigDoc = {
                features: {
                    ...getDefaultFeaturesMap(),
                    ...(data.features || {}),
                },
                featureRoles: data.featureRoles,
                updatedAt: data.updatedAt,
                updatedBy: data.updatedBy,
                updatedByName: data.updatedByName,
            };
            saveLocalMenuConfig(fullConfig);
            return fullConfig;
        }
    } catch (err) {
        console.warn('[MenuConfig] Lỗi đọc Firestore (dùng local cache):', err);
    }

    return getLocalMenuConfig();
}

/**
 * Lắng nghe thay đổi Realtime cấu hình bật/tắt menu từ Firestore.
 * Trả về unsubscribe function.
 */
export function subscribeToSystemMenuConfig(
    onUpdate: (config: SystemMenuConfigDoc) => void,
    onError?: (error: Error) => void
): () => void {
    try {
        const docRef = doc(db, SHARED_CONFIGS_COLLECTION, SYSTEM_MENU_CONFIG_DOC_ID);
        return onSnapshot(
            docRef,
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data() as Partial<SystemMenuConfigDoc>;
                    const fullConfig: SystemMenuConfigDoc = {
                        features: {
                            ...getDefaultFeaturesMap(),
                            ...(data.features || {}),
                        },
                        featureRoles: data.featureRoles,
                        updatedAt: data.updatedAt,
                        updatedBy: data.updatedBy,
                        updatedByName: data.updatedByName,
                    };
                    saveLocalMenuConfig(fullConfig);
                    onUpdate(fullConfig);
                } else {
                    const fallback = getLocalMenuConfig();
                    onUpdate(fallback);
                }
            },
            (error) => {
                console.warn('[MenuConfig] onSnapshot error:', error);
                if (onError) onError(error);
                onUpdate(getLocalMenuConfig());
            }
        );
    } catch (e) {
        console.warn('[MenuConfig] Không thể khởi tạo listener Firestore:', e);
        onUpdate(getLocalMenuConfig());
        return () => {};
    }
}

/**
 * Lưu cấu hình bật/tắt chức năng lên Firestore (Chỉ dành cho Admin).
 */
export async function saveSystemMenuConfig(
    features: Record<string, boolean>,
    updaterInfo?: { email?: string; name?: string },
    featureRoles?: Record<string, MenuRole[]>
): Promise<boolean> {
    const configToSave: SystemMenuConfigDoc = {
        features,
        // Không truyền thì giữ quyền xem hiện có (đổi bật/tắt không được làm mất phân quyền xem).
        // Firestore không nhận giá trị undefined → chỉ thêm khoá khi có dữ liệu.
        ...((featureRoles ?? inMemoryConfig?.featureRoles) ? { featureRoles: featureRoles ?? inMemoryConfig?.featureRoles } : {}),
        updatedAt: new Date().toISOString(),
        updatedBy: updaterInfo?.email || 'admin',
        updatedByName: updaterInfo?.name || 'Quản trị hệ thống',
    };

    // Lưu local trước để phản hồi tức thì
    saveLocalMenuConfig(configToSave);

    try {
        const docRef = doc(db, SHARED_CONFIGS_COLLECTION, SYSTEM_MENU_CONFIG_DOC_ID);
        await setDoc(docRef, configToSave, { merge: true });
        return true;
    } catch (err) {
        console.error('[MenuConfig] Lỗi lưu cấu hình lên Firestore:', err);
        throw err;
    }
}


/** Vai trò `role` có được xem chức năng `featureId` không (quản trị hệ thống luôn xem được). */
export function coQuyenXem(featureRoles: Record<string, MenuRole[]> | undefined, featureId: string, role: string | null | undefined): boolean {
    if (role === 'admin') return true;
    const cho = featureRoles?.[featureId];
    if (!cho) return true;
    return !!role && (cho as string[]).includes(role);
}
