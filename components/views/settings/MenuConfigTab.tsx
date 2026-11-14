import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useMenuConfig } from '../../../contexts/MenuConfigContext';
import { TAT_CA_VAI_TRO, type MenuRole } from '../../../services/menuConfigService';
import { APP_MENU_FEATURES, AppMenuFeature } from '../../../constants/menuFeatures';
import { AppIcon } from '../../shared/ui/icon/AppIcon';
import { Button } from '../../shared/ui/Button';
import { Switch } from '../../shared/ui/Switch';
import { Tabs } from '../../shared/ui/Tabs';
import { Input } from '../../shared/ui/Input';
import { cn } from '../../shared/ui/utils';

export const MenuConfigTab: React.FC = () => {
    const { userRole } = useAuth();
    const isAdmin = userRole === 'admin';
    const {
        features,
        isFeatureEnabled,
        featureRoles,
        setFeatureRoles,
        toggleFeature,
        setAllFeatures,
        resetToDefault,
        lastUpdated,
        updatedByName,
        isLoading,
    } = useMenuConfig();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<'all' | 'main' | 'tools' | 'disabled'>('all');
    const [togglingId, setTogglingId] = useState<string | null>(null);

    // Vai trò được chọn để XEM chức năng. Quản trị hệ thống luôn xem được nên không có nút riêng.
    const VAI_TRO_CHON: { id: MenuRole; label: string }[] = [
        { id: 'manager', label: 'Quản lý' },
        { id: 'employee', label: 'Nhân viên' },
    ];
    const doiVaiTro = (featureId: string, role: MenuRole) => {
        const hienTai = featureRoles?.[featureId] ?? TAT_CA_VAI_TRO;
        const moi = hienTai.includes(role) ? hienTai.filter(r => r !== role) : [...hienTai, role];
        void setFeatureRoles(featureId, moi);
    };

    // Tính toán số liệu thống kê
    const stats = useMemo(() => {
        let enabledCount = 0;
        let disabledCount = 0;
        for (const feat of APP_MENU_FEATURES) {
            if (isFeatureEnabled(feat.id)) {
                enabledCount++;
            } else {
                disabledCount++;
            }
        }
        return {
            total: APP_MENU_FEATURES.length,
            enabled: enabledCount,
            disabled: disabledCount,
        };
    }, [isFeatureEnabled]);

    // Lọc danh sách tính năng
    const filteredFeatures = useMemo(() => {
        return APP_MENU_FEATURES.filter((feat) => {
            // Lọc theo từ khoá
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const matchName = feat.label.toLowerCase().includes(q) || feat.shortLabel.toLowerCase().includes(q);
                const matchDesc = feat.description.toLowerCase().includes(q);
                const matchId = feat.id.toLowerCase().includes(q);
                if (!matchName && !matchDesc && !matchId) return false;
            }

            // Lọc theo danh mục
            if (filterCategory === 'main' && feat.group !== 'main') return false;
            if (filterCategory === 'tools' && feat.group !== 'tools') return false;
            if (filterCategory === 'disabled' && isFeatureEnabled(feat.id)) return false;

            return true;
        });
    }, [searchQuery, filterCategory, isFeatureEnabled]);

    const handleToggle = async (id: string, nextValue: boolean) => {
        try {
            setTogglingId(id);
            await toggleFeature(id, nextValue);
        } finally {
            setTogglingId(null);
        }
    };

    if (!isAdmin) {
        return (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-card border border-slate-200 dark:border-slate-800">
                <AppIcon name="security" size="xl" className="text-amber-500 mx-auto mb-3" />
                <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-100">Yêu cầu quyền Quản trị viên</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Chỉ tài khoản Quản trị hệ thống (Admin) mới có quyền bật/tắt các chức năng trên menu.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header Card với phong cách Apple Glass */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-card p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-popup bg-sky-100 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 shadow-2xs">
                            <AppIcon name="viewOptions" size="lg" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-[17px] font-bold text-slate-900 dark:text-slate-100">
                                    Quản lý Bật / Tắt Menu Hệ Thống
                                </h2>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                    Quản trị hệ thống
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Cho phép bật/tắt các chức năng. Khi tắt, người dùng không thể thấy và dù có link trực tiếp vẫn bị chặn bằng màn hình lỗi 404 vui nhộn.
                            </p>
                        </div>
                    </div>

                    {/* Metadata cập nhật */}
                    {lastUpdated && (
                        <div className="text-left sm:text-right text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                            <span>Cập nhật gần nhất: </span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {new Date(lastUpdated).toLocaleString('vi-VN')}
                            </span>
                            {updatedByName && <div>Bởi: <span className="font-medium text-slate-700 dark:text-slate-300">{updatedByName}</span></div>}
                        </div>
                    )}
                </div>

                {/* Thống kê nhanh KPI */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="p-2.5 sm:p-3 rounded-popup bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Tổng chức năng</span>
                            <p className="text-[17px] sm:text-xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</p>
                        </div>
                        <AppIcon name="viewList" size="md" className="text-slate-400" />
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-popup bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Đang hoạt động</span>
                            <p className="text-[17px] sm:text-xl font-bold text-emerald-700 dark:text-emerald-300">{stats.enabled}</p>
                        </div>
                        <AppIcon name="success" size="md" className="text-emerald-500" />
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-popup bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-between">
                        <div>
                            <span className="text-[11px] font-medium text-rose-700 dark:text-rose-400">Đang tạm đóng (404)</span>
                            <p className="text-[17px] sm:text-xl font-bold text-rose-700 dark:text-rose-300">{stats.disabled}</p>
                        </div>
                        <AppIcon name="error" size="md" className="text-rose-500" />
                    </div>
                </div>
            </div>

            {/* Bộ lọc & Thao tác nhanh */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-card p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                {/* Search & Filter pills */}
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
                    <div className="w-full sm:w-64">
                        <Input
                            dense
                            type="search"
                            leftIcon="search"
                            placeholder="Tìm kiếm tính năng, mã tab..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 text-xs w-full"
                        />
                    </div>

                    <Tabs
                        variant="segment"
                        size="sm"
                        activeId={filterCategory}
                        onChange={(id) => setFilterCategory(id as typeof filterCategory)}
                        items={[
                            { id: 'all', label: `Tất cả (${stats.total})` },
                            { id: 'main', label: 'Chính' },
                            { id: 'tools', label: 'Công cụ' },
                            { id: 'disabled', label: `Đã tắt (${stats.disabled})` },
                        ]}
                    />
                </div>

                {/* Batch buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setAllFeatures(true)}
                        disabled={isLoading}
                        icon="check"
                        className="text-xs h-8"
                    >
                        Bật tất cả
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => resetToDefault()}
                        disabled={isLoading}
                        icon="refresh"
                        className="text-xs h-8 text-slate-600 dark:text-slate-300"
                        title="Khôi phục trạng thái mặc định"
                    >
                        Mặc định
                    </Button>
                </div>
            </div>

            {/* Danh sách thẻ tính năng */}
            <div className="space-y-2">
                {filteredFeatures.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-card p-8 text-center border border-slate-200 dark:border-slate-800">
                        <AppIcon name="search" size="lg" className="text-slate-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy chức năng phù hợp</p>
                        <p className="text-xs text-slate-400 mt-1">Hãy thử tìm với từ khoá khác hoặc xoá bộ lọc.</p>
                    </div>
                ) : (
                    filteredFeatures.map((feat) => {
                        const isEnabled = isFeatureEnabled(feat.id);
                        const isUpdating = togglingId === feat.id;

                        return (
                            <div
                                key={feat.id}
                                className={cn(
                                    'bg-white dark:bg-slate-900 border rounded-card p-3 sm:p-4 transition-all duration-200 flex flex-col gap-3 shadow-xs',
                                    isEnabled
                                        ? 'border-slate-200/90 dark:border-slate-800'
                                        : 'border-rose-200 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/10'
                                )}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    {/* Left info */}
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div
                                            className={cn(
                                                'w-10 h-10 rounded-popup flex items-center justify-center shrink-0 shadow-2xs mt-0.5',
                                                isEnabled
                                                    ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400'
                                                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                            )}
                                        >
                                            <AppIcon name={feat.icon} size="md" />
                                        </div>

                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                    {feat.label}
                                                </span>

                                                <span
                                                    className={cn(
                                                        'px-2 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider',
                                                        feat.group === 'main'
                                                            ? 'bg-sky-100 text-sky-800'
                                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    )}
                                                >
                                                    {feat.group === 'main' ? 'Menu chính' : 'Công cụ'}
                                                </span>

                                                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                                                    ?tab={feat.id}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                {feat.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right controls */}
                                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                                        {/* Ai được xem chức năng này (quản trị hệ thống luôn xem được) */}
                                        <div role="group" aria-label={`Ai được xem ${feat.label}`} className="flex items-center gap-1">
                                            {VAI_TRO_CHON.map(v => {
                                                const dangXem = (featureRoles?.[feat.id] ?? TAT_CA_VAI_TRO).includes(v.id);
                                                return (
                                                    <Button
                                                        key={v.id}
                                                        variant="toggle"
                                                        size="xs"
                                                        aria-pressed={dangXem}
                                                        onClick={() => doiVaiTro(feat.id, v.id)}
                                                        className="ycx-hit text-[11px] font-semibold"
                                                        title={`${dangXem ? 'Đang cho' : 'Chưa cho'} ${v.label} xem`}
                                                    >
                                                        {v.label}
                                                    </Button>
                                                );
                                            })}
                                        </div>

                                        {/* Status Badge */}
                                        <span
                                            className={cn(
                                                'px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5',
                                                isEnabled
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                                                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60'
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'w-1.5 h-1.5 rounded-full',
                                                    isEnabled ? 'bg-emerald-500' : 'bg-rose-500'
                                                )}
                                            />
                                            <span>{isEnabled ? 'Đang mở' : 'Đã tắt (404)'}</span>
                                        </span>

                                        {/* Switch Toggle */}
                                        <div className="flex items-center gap-1.5">
                                            <Switch
                                                checked={isEnabled}
                                                onChange={(next) => handleToggle(feat.id, next)}
                                                disabled={isUpdating}
                                                label={`Bật tắt ${feat.label}`}
                                                title={isEnabled ? 'Nhấn để tắt tính năng' : 'Nhấn để mở tính năng'}
                                            />
                                            {isUpdating && (
                                                <AppIcon name="loading" size="xs" spin className="text-sky-600" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Danh sách Tab con (nếu có) */}
                                {feat.subTabs && feat.subTabs.length > 0 && isEnabled && (
                                    <div className="mt-1 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 pl-2 sm:pl-12">
                                        <div className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                                            <AppIcon name="columns" size="xs" className="text-slate-400" />
                                            <span>Quản lý chế độ in / Tab con của {feat.shortLabel}:</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                            {feat.subTabs.map((sub) => {
                                                const isSubEnabled = isFeatureEnabled(sub.id);
                                                const isSubUpdating = togglingId === sub.id;
                                                return (
                                                    <div
                                                        key={sub.id}
                                                        className={cn(
                                                            'flex items-center justify-between p-2 rounded-popup border text-xs transition-colors',
                                                            isSubEnabled
                                                                ? 'bg-slate-50/80 dark:bg-slate-850/80 border-slate-200/80 dark:border-slate-700/80'
                                                                : 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/50 opacity-75'
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            {sub.icon && <AppIcon name={sub.icon} size="xs" className={isSubEnabled ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'} />}
                                                            <span className={cn('font-medium truncate', isSubEnabled ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 line-through')}>
                                                                {sub.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                                            <Switch
                                                                checked={isSubEnabled}
                                                                onChange={(next) => handleToggle(sub.id, next)}
                                                                disabled={isSubUpdating}
                                                                label={`Bật tắt ${sub.label}`}
                                                                title={isSubEnabled ? `Tắt chế độ ${sub.label}` : `Bật chế độ ${sub.label}`}
                                                            />
                                                            {isSubUpdating && <AppIcon name="loading" size="xs" spin className="text-sky-600" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

        </div>
    );
};

export default MenuConfigTab;
