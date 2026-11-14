import React, { Suspense, useCallback, useEffect, useState, useTransition, useMemo } from 'react';
import { useActiveTab } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMenuConfig } from '../../contexts/MenuConfigContext';
import { Button } from '../shared/ui/Button';
import { GlassSurface } from '../shared/ui/GlassSurface';
import { AppIcon, type IconName } from '../shared/ui/icon';
import { cn } from '../shared/ui/utils';
import { NAV_TAB_ICONS } from './navIcons';
import { lazyWithRetry } from '../../utils/lazyWithRetry';
import type { NavTabItem as TabItem } from './MobileMoreSheet';
import { chonThayThe } from './navThayThe';

const MobileMoreSheet = lazyWithRetry(() => import('./MobileMoreSheet'), 'MobileMoreSheet');

interface MobileBottomNavProps {
    /** Mini-app toàn màn (Báo cáo khai thác, In Sticker, Phân ca): ẩn thanh tab dưới nhưng vẫn giữ sheet "Thêm". */
    hideBar?: boolean;
    externalMoreOpen?: boolean;
    onExternalMoreOpenChange?: (open: boolean) => void;
}

/**
 * THANH TAB DƯỚI iPhone/iPad + bảng "Khác" (GĐ4, KE_HOACH_GIAO_DIEN_APPLE.md mục 3.5).
 *
 * - Thanh tab (Liquid Glass, 2026-10-28): viên kính nổi 3 tab chính (icon + nhãn 11px, mục chọn = viên xám iOS + chữ sky-600)
 *   và nút tròn kính "Khác" tách riêng. Cao 60px; nội dung trang chừa đáy 72px + vùng thanh Home (App.tsx).
 *   Chưa chọn: slate-700 (tương phản cao trên kính — ảnh mẫu dùng icon đen).
 * - "Khác": sheet dùng chung (`Modal position="bottom"` — kéo để đóng, Esc, chống tràn khi xoay ngang) với danh sách nhóm kiểu
 *   Cài đặt iOS: thẻ tài khoản (bấm mở Phân quyền, nút Đăng xuất) → nhóm "Công cụ" → nhóm "Hệ thống". Thay lưới ô màu cũ.
 */
const MobileBottomNav: React.FC<MobileBottomNavProps> = React.memo(({
    hideBar = false,
    externalMoreOpen = false,
    onExternalMoreOpenChange,
}) => {
    const { activeTab, setActiveTab } = useActiveTab();
    const { userRole, isDemoMode } = useAuth();
    const { isFeatureEnabled } = useMenuConfig();
    const [internalMoreOpen, setInternalMoreOpen] = useState(false);
    const [daMoKhac, setDaMoKhac] = useState(false);
    const isMoreOpen = internalMoreOpen || externalMoreOpen;
    const canAccessLineBot = isDemoMode || userRole === 'admin' || userRole === 'manager';

    useEffect(() => {
        if (externalMoreOpen) setDaMoKhac(true);
    }, [externalMoreOpen]);

    const setMoreOpen = useCallback((next: boolean) => {
        if (next) setDaMoKhac(true);
        setInternalMoreOpen(next);
        onExternalMoreOpenChange?.(next);
    }, [onExternalMoreOpenChange]);

    // Tải trước sheet "Khác" khi máy rảnh — chỉ màn có thanh tab dưới (< lg) — để lần bấm đầu mở ngay như khi còn chung gói.
    useEffect(() => {
        if (!window.matchMedia?.('(max-width: 1023.98px)').matches) return;
        const taiTruoc = () => { void MobileMoreSheet.preload(); };
        if ('requestIdleCallback' in window) {
            const h = window.requestIdleCallback(taiTruoc, { timeout: 4000 });
            return () => window.cancelIdleCallback(h);
        }
        const t = setTimeout(taiTruoc, 2000);
        return () => clearTimeout(t);
    }, []);
    const [isPending, startTransition] = useTransition();

    // Icon theo TÊN CHỨC NĂNG (chuẩn hoá icon 2026-10-02) — cùng tên với Sidebar nên 2 thanh luôn cùng hình.
    const mainTabs: TabItem[] = [
        { id: 'analysis', label: 'Phân tích', icon: NAV_TAB_ICONS['analysis'] },
        { id: 'employees', label: 'Report BI', icon: NAV_TAB_ICONS['employees'] },
        { id: 'check-thuong', label: 'Check thưởng', icon: NAV_TAB_ICONS['check-thuong'] },
        { id: 'thuong', label: 'Thưởng', icon: NAV_TAB_ICONS['thuong'] },
    ];

    const toolTabs: TabItem[] = [
        { id: 'reports', label: 'Báo cáo', icon: NAV_TAB_ICONS['reports'], tone: 'sky' },
        { id: 'tools-print-sticker', label: 'In Sticker', icon: NAV_TAB_ICONS['tools-print-sticker'], tone: 'sky' },
        { id: 'tools-phanca', label: 'Phân ca', icon: NAV_TAB_ICONS['tools-phanca'], tone: 'emerald' },
        { id: 'tools-line-bot', label: 'Bot LINE', icon: NAV_TAB_ICONS['tools-line-bot'], tone: 'emerald' },
        { id: 'tools-coupon', label: 'Rút gọn Coupon', icon: NAV_TAB_ICONS['tools-coupon'], tone: 'amber' },
        { id: 'tools-tax', label: 'Tính thuế', icon: NAV_TAB_ICONS['tools-tax'], tone: 'rose' },
        { id: 'tools-price-compare', label: 'So sánh giá ĐT', icon: NAV_TAB_ICONS['tools-price-compare'], tone: 'slate' },
    ];
    const systemTabs: TabItem[] = [
        { id: 'settings', label: 'Phân quyền', icon: NAV_TAB_ICONS['settings'], tone: 'slate' },
        { id: 'help', label: 'Giới thiệu', icon: NAV_TAB_ICONS['help'], tone: 'slate' },
    ];

    const visibleMainTabs = useMemo(() => {
        return mainTabs.filter(t => isFeatureEnabled(t.id));
    }, [mainTabs, isFeatureEnabled]);

    const visibleToolTabs = useMemo(() => {
        return toolTabs.filter(t => isFeatureEnabled(t.id) && (t.id !== 'tools-line-bot' || canAccessLineBot));
    }, [toolTabs, isFeatureEnabled, canAccessLineBot]);

    // Ô chính bị tắt → công cụ đang bật lên thay (chonThayThe); công cụ đã lên thanh thì không hiện lại trong sheet "Thêm".
    const { chinh: thanhChinh, congCu: congCuTrongSheet } = useMemo(
        () => chonThayThe(visibleMainTabs, visibleToolTabs),
        [visibleMainTabs, visibleToolTabs],
    );

    const handleTabClick = useCallback((id: string) => {
        startTransition(() => {
            setActiveTab(id);
        });
        setMoreOpen(false);
    }, [setActiveTab, setMoreOpen]);

    const isInMainBar = thanhChinh.some(t => t.id === activeTab);
    const isMoreActive = !isInMainBar && ([...toolTabs, ...systemTabs].some(t => activeTab === t.id) || activeTab.startsWith('tools-'));
    const hasBottomBarItems = thanhChinh.length > 0 || congCuTrongSheet.length > 0;

    // Mục tab trong viên kính (ảnh mẫu Apple Liquid Glass 1): icon + nhãn; mục đang chọn có viên xám `ycx-glass-item[aria-current]`
    // và đổi màu thương hiệu. Cao 50px (vùng chạm ≥ 44 không cần ::after).
    const oTab = (opts: { key: string; label: string; icon: IconName; active: boolean; onClick: () => void }) => (
        <Button
            variant="tab" size="none"
            key={opts.key}
            onClick={opts.onClick}
            title={opts.label}
            aria-label={opts.label}
            aria-current={opts.active ? 'page' : undefined}
            className={cn(
                'ycx-glass-item flex-auto min-w-0 h-[50px] px-0.5 rounded-full flex flex-col items-center justify-center gap-0.5',
                opts.active ? 'text-sky-600' : 'text-slate-700',
                isPending && 'opacity-70'
            )}
        >
            <AppIcon name={opts.icon} size="lg" />
            <span aria-hidden="true" className="type-caption font-semibold max-w-full truncate">{opts.label}</span>
        </Button>
    );

    return (
        <>
            {/* Sheet "Khác": mảnh code riêng (MobileMoreSheet) — gắn từ lần mở đầu và GIỮ gắn để hiệu ứng đóng vẫn chạy.
                Khi hideBar=true (mini-app toàn màn: Báo cáo khai thác, In Sticker, Phân ca), truyền đủ cả mainTabs + visibleToolTabs
                để người dùng thấy trọn vẹn toàn bộ menu tính năng đang bật mà không bị thiếu các ô trên thanh dưới. */}
            {(isMoreOpen || daMoKhac) && (
                <Suspense fallback={null}>
                    <MobileMoreSheet
                        isOpen={isMoreOpen}
                        onClose={() => setMoreOpen(false)}
                        onTabClick={handleTabClick}
                        mainTabs={hideBar ? visibleMainTabs : undefined}
                        toolTabs={hideBar ? visibleToolTabs : congCuTrongSheet}
                        systemTabs={systemTabs}
                    />
                </Suspense>
            )}

            {/* Thanh tab nổi Liquid Glass (Apple Design System V2, 2026-10-28 — ảnh mẫu 1): viên kính chứa 3 tab chính + nút tròn
                kính tách riêng cho "Khác" (như nút Tìm kiếm của iOS 26). Bản thân <nav> trong suốt — kính nằm ở 2 GlassSurface. */}
            {!hideBar && hasBottomBarItems && (
                <nav
                    data-app-chrome="tabbar"
                    aria-label="Điều hướng chính"
                    className="mobile-chrome lg:hidden fixed bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[calc(100%-16px)] min-[360px]:w-[calc(100%-24px)] max-w-[420px] z-[190] flex items-center gap-1.5 min-[360px]:gap-2"
                >
                    <GlassSurface shape="capsule" className="flex-1 min-w-0 flex items-center gap-0.5 p-1">
                        {thanhChinh.map(tab => oTab({
                            key: tab.id, label: tab.label, icon: tab.icon,
                            active: activeTab === tab.id && !isMoreOpen,
                            onClick: () => handleTabClick(tab.id),
                        }))}
                    </GlassSurface>
                    <GlassSurface shape="circle" className="shrink-0 w-[60px] h-[60px] p-1 flex items-center justify-center">
                        <Button
                            variant="tab" size="none"
                            onClick={() => setMoreOpen(!isMoreOpen)}
                            title="Khác"
                            aria-label="Khác"
                            aria-haspopup="dialog"
                            aria-expanded={isMoreOpen}
                            aria-current={isMoreActive || isMoreOpen ? 'page' : undefined}
                            className={cn(
                                'ycx-glass-item w-full h-full rounded-full flex items-center justify-center',
                                isMoreActive || isMoreOpen ? 'text-sky-600' : 'text-slate-700'
                            )}
                        >
                            <AppIcon name="navTools" size="lg" />
                        </Button>
                    </GlassSurface>
                </nav>
            )}
        </>
    );
});

MobileBottomNav.displayName = 'MobileBottomNav';
export default MobileBottomNav;
