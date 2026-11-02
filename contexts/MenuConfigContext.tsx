import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    SystemMenuConfigDoc,
    getLocalMenuConfig,
    subscribeToSystemMenuConfig,
    saveSystemMenuConfig,
    getDefaultFeaturesMap,
    coQuyenXem,
    TAT_CA_VAI_TRO,
    type MenuRole,
} from '../services/menuConfigService';
import { useAuth } from './AuthContext';
import { toast } from '../components/shared/ui/toast';

interface MenuConfigContextType {
    features: Record<string, boolean>;
    isFeatureEnabled: (featureId: string) => boolean;
    /** Quyền xem từng chức năng theo vai trò (thiếu = mọi vai trò xem được). */
    featureRoles: Record<string, MenuRole[]> | undefined;
    /** Đặt vai trò được xem một chức năng; null = mọi vai trò. */
    setFeatureRoles: (featureId: string, roles: MenuRole[] | null) => Promise<boolean>;
    toggleFeature: (featureId: string, enabled: boolean) => Promise<boolean>;
    setAllFeatures: (enabled: boolean) => Promise<boolean>;
    resetToDefault: () => Promise<boolean>;
    lastUpdated?: string;
    updatedByName?: string;
    isLoading: boolean;
}

const MenuConfigContext = createContext<MenuConfigContextType | undefined>(undefined);

export const MenuConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, employeeName, isDemoMode, userRole } = useAuth();
    const [config, setConfig] = useState<SystemMenuConfigDoc>(() => getLocalMenuConfig());
    const [isLoading, setIsLoading] = useState(true);

    // Chỉ lắng nghe cấu hình Firestore KHI ĐÃ ĐĂNG NHẬP (2026-10-30): quyền đọc shared_configs cần đăng nhập, và một kết nối
    // lắng nghe mở sẵn trước khi đăng nhập làm trang không bao giờ "rảnh" mạng (Playwright networkidle đợi mãi). Chưa đăng nhập thì
    // dùng cấu hình trên máy; đăng nhập xong effect chạy lại và nạp cấu hình chung.
    const uid = user?.uid ?? null;
    useEffect(() => {
        if (!uid) {
            setIsLoading(false);
            return;
        }
        let isMounted = true;

        const unsubscribe = subscribeToSystemMenuConfig(
            (updatedConfig) => {
                if (isMounted) {
                    setConfig(updatedConfig);
                    setIsLoading(false);
                }
            },
            (err) => {
                console.warn('[MenuConfigContext] Lỗi listener:', err);
                if (isMounted) setIsLoading(false);
            }
        );

        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [uid]);

    const isFeatureEnabled = useCallback(
        (featureId: string): boolean => {
            // Bật/tắt toàn cục, rồi quyền xem theo vai trò (quản trị hệ thống luôn xem được)
            const bat = config.features[featureId] === undefined ? true : Boolean(config.features[featureId]);
            return bat && coQuyenXem(config.featureRoles, featureId, userRole);
        },
        [config.features, config.featureRoles, userRole]
    );

    const setFeatureRoles = useCallback(
        async (featureId: string, roles: MenuRole[] | null): Promise<boolean> => {
            if (isDemoMode) {
                toast.success('(Demo) Đã đổi quyền xem chức năng!');
                return true;
            }
            const truoc = config.featureRoles;
            const next: Record<string, MenuRole[]> = { ...(truoc || {}) };
            // Quản lý + Nhân viên đều được chọn = không giới hạn (quản trị hệ thống luôn xem được nên không đưa vào nút)
            const khongGioiHan = roles === null || ['manager', 'employee'].every(r => roles.includes(r as MenuRole));
            if (khongGioiHan) delete next[featureId];
            else next[featureId] = roles as MenuRole[];
            // Cập nhật ngay trên màn hình (như bật/tắt chức năng), không chờ lượt đồng bộ Firestore
            setConfig((prev) => ({ ...prev, featureRoles: next }));
            try {
                await saveSystemMenuConfig(config.features, {
                    email: user?.email || undefined,
                    name: employeeName || user?.displayName || undefined,
                }, next);
                toast.success('Đã cập nhật quyền xem chức năng');
                return true;
            } catch (err) {
                console.error('[MenuConfig] Lỗi đổi quyền xem:', err);
                setConfig((prev) => ({ ...prev, featureRoles: truoc }));
                toast.error('Không thể cập nhật quyền xem.');
                return false;
            }
        },
        [config.features, config.featureRoles, isDemoMode, user, employeeName]
    );

    const toggleFeature = useCallback(
        async (featureId: string, enabled: boolean): Promise<boolean> => {
            const nextFeatures = {
                ...config.features,
                [featureId]: enabled,
            };

            // Cập nhật UI ngay lập tức
            setConfig((prev) => ({
                ...prev,
                features: nextFeatures,
                updatedAt: new Date().toISOString(),
                updatedByName: employeeName || user?.displayName || 'Quản trị hệ thống',
            }));

            if (isDemoMode) {
                toast.success(`(Demo) Đã ${enabled ? 'MỞ' : 'TẮT'} tính năng thành công!`);
                return true;
            }

            try {
                await saveSystemMenuConfig(nextFeatures, {
                    email: user?.email || undefined,
                    name: employeeName || user?.displayName || undefined,
                });
                toast.success(`Đã ${enabled ? 'MỞ' : 'TẮT'} tính năng thành công!`, { duration: 2000 });
                return true;
            } catch (err) {
                console.error('[MenuConfig] Lỗi cập nhật:', err);
                toast.error('Không thể lưu cài đặt lên máy chủ. Vui lòng kiểm tra quyền truy cập.');
                // Rollback
                setConfig((prev) => ({
                    ...prev,
                    features: { ...prev.features, [featureId]: !enabled },
                }));
                return false;
            }
        },
        [config.features, isDemoMode, user, employeeName]
    );

    const setAllFeatures = useCallback(
        async (enabled: boolean): Promise<boolean> => {
            const allKeys = Object.keys(getDefaultFeaturesMap());
            const nextFeatures: Record<string, boolean> = {};
            for (const key of allKeys) {
                nextFeatures[key] = enabled;
            }

            setConfig((prev) => ({
                ...prev,
                features: nextFeatures,
                updatedAt: new Date().toISOString(),
                updatedByName: employeeName || user?.displayName || 'Quản trị hệ thống',
            }));

            if (isDemoMode) {
                toast.success(`(Demo) Đã ${enabled ? 'BẬT' : 'TẮT'} tất cả tính năng!`);
                return true;
            }

            try {
                await saveSystemMenuConfig(nextFeatures, {
                    email: user?.email || undefined,
                    name: employeeName || user?.displayName || undefined,
                });
                toast.success(`Đã ${enabled ? 'BẬT' : 'TẮT'} tất cả tính năng!`);
                return true;
            } catch (err) {
                console.error('[MenuConfig] Lỗi bật tất cả:', err);
                toast.error('Không thể cập nhật cấu hình.');
                return false;
            }
        },
        [isDemoMode, user, employeeName]
    );

    const resetToDefault = useCallback(async (): Promise<boolean> => {
        const defaults = getDefaultFeaturesMap();
        setConfig({
            features: defaults,
            updatedAt: new Date().toISOString(),
            updatedByName: employeeName || user?.displayName || 'Quản trị hệ thống',
        });

        if (isDemoMode) {
            toast.success('(Demo) Đã khôi phục cài đặt mặc định!');
            return true;
        }

        try {
            await saveSystemMenuConfig(defaults, {
                email: user?.email || undefined,
                name: employeeName || user?.displayName || undefined,
            });
            toast.success('Đã khôi phục tất cả chức năng về trạng thái mặc định!');
            return true;
        } catch (err) {
            console.error('[MenuConfig] Lỗi reset:', err);
            toast.error('Không thể khôi phục mặc định.');
            return false;
        }
    }, [isDemoMode, user, employeeName]);

    const value = useMemo(
        () => ({
            features: config.features,
            isFeatureEnabled,
            featureRoles: config.featureRoles,
            setFeatureRoles,
            toggleFeature,
            setAllFeatures,
            resetToDefault,
            lastUpdated: config.updatedAt,
            updatedByName: config.updatedByName,
            isLoading,
        }),
        [config, isFeatureEnabled, setFeatureRoles, toggleFeature, setAllFeatures, resetToDefault, isLoading]
    );

    return <MenuConfigContext.Provider value={value}>{children}</MenuConfigContext.Provider>;
};

export const useMenuConfig = (): MenuConfigContextType => {
    const context = useContext(MenuConfigContext);
    if (!context) {
        throw new Error('useMenuConfig must be used within a MenuConfigProvider');
    }
    return context;
};

