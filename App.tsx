import React, { Suspense } from 'react';
import { LayoutProvider, useLayout, useActiveTab } from './contexts/LayoutContext';
import ErrorBoundary from './components/shared/ui/ErrorBoundary';
import Sidebar from './components/layout/Sidebar';
import MobileBottomNav from './components/layout/MobileBottomNav';
// Import thẳng file con, KHÔNG qua barrel services/dbService: barrel `export *` cả salesData → kéo dataUtils + constants (~33 KB)
// vào gói tải đầu (GĐ9 2026-10-14). Code khung app (contexts/, hooks/useCloudSync, services/firestoreService|syncService) cũng vậy.
import { getGlobalFont } from './services/dbService/settings';
import { AppIcon } from './components/shared/ui/icon';
import { Button } from './components/shared/ui/Button';
import { navTabIcon } from './components/layout/navIcons';
import { lazyWithRetry } from './utils/lazyWithRetry';

// DashboardView đã xoá theo yêu cầu người dùng
const CheckThuongView = lazyWithRetry(() => import('./components/views/CheckThuongView'), 'CheckThuongView');
const ExternalToolView = lazyWithRetry(() => import('./components/views/ExternalToolView'), 'ExternalToolView');
const UserManagementView = lazyWithRetry(() => import('./components/views/UserManagementView'), 'UserManagementView');
const SettingsView = lazyWithRetry(() => import('./components/views/SettingsView'), 'SettingsView');
const AboutView = lazyWithRetry(() => import('./components/views/AboutView'), 'AboutView');
const StickerPrinterView = lazyWithRetry(() => import('./features/sticker-event/StickerPrinterView'), 'StickerPrinterView');
const PhanCaView = lazyWithRetry(() => import('./features/phan-ca/PhanCaView'), 'PhanCaView');
const LineBotView = lazyWithRetry(() => import('./features/line-bot/LineBotView'), 'LineBotView');
const KhaiThacView = lazyWithRetry(() => import('./features/khai-thac/KhaiThacView'), 'KhaiThacView');
const TaxCalculatorView = lazyWithRetry(() => import('./features/tax-calculator/TaxCalculatorView'), 'TaxCalculatorView');

// BI Module Wrapper
const BiWrapper = lazyWithRetry(() => import('./features/bi-dashboard/components/BiWrapper'), 'BiWrapper');

// Không cần ngay lúc mở app (GĐ2 tăng tốc, KE_HOACH_GIAO_DIEN_APPLE.md mục 4.3): màn đăng nhập / chờ duyệt chỉ hiện với
// người chưa có phiên; Rút gọn coupon là một tab; dock Auto Sync chỉ HIỆN trên laptop nhưng kéo theo ~100 KB code Report BI
// (tự đồng bộ, đổ thưởng, hẹn giờ) — tách khỏi gói vào và gắn sau lần rảnh đầu tiên (xem useSauLanRanhDau).
const LoginView = lazyWithRetry(() => import('./components/views/LoginView'), 'LoginView');
const PendingApprovalView = lazyWithRetry(() => import('./components/views/PendingApprovalView'), 'PendingApprovalView');
const CouponConverterView = lazyWithRetry(() => import('./components/views/CouponConverterView'), 'CouponConverterView');
const GlobalAutoSyncDock = lazyWithRetry(() => import('./components/layout/GlobalAutoSyncDock'), 'GlobalAutoSyncDock');
// Gói tải đầu (GĐ10 2026-10-20): 2 phần không cần cho lượt vẽ đầu — nhắc cài app (vốn chờ 4 s mới hiện, chỉ Safari iPhone) và gợi ý
// nhấn-giữ đọc `title` trên màn cảm ứng — tách khỏi gói vào. Chuông thông báo: components/layout/NotificationBell.tsx.
const InstallAppHint = lazyWithRetry(() => import('./components/layout/InstallAppHint'), 'InstallAppHint');
const TouchTitleHint = lazyWithRetry(() => import('./components/shared/ui/TouchTitleHint').then(m => ({ default: m.TouchTitleHint })), 'TouchTitleHint');

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import { MenuConfigProvider, useMenuConfig } from './contexts/MenuConfigContext';
import { AppToaster } from './components/shared/ui/toast';
import MobileNavBar from './components/layout/MobileNavBar';
import {
    TAB_LUON_BAT,
    laTabToanManMobile,
    timTabBatDauTien,
    timTabCoThanhDuoiDauTien,
} from './components/layout/navThayThe';
import PageActionsBar from './components/layout/PageActionsBar';
import { PageActionsProvider } from './components/shared/ui/PageActions';
import PendingApprovalBanner from './components/layout/PendingApprovalBanner';
import AppFooter from './components/layout/AppFooter';
import { installTableScrollCue } from './components/shared/ui/tableScrollCue';
import { napPhongGoogle } from './components/shared/ui/googleFonts';

/**
 * TabContent — Isolated component that handles tab switching.
 * Uses lazy-mount pattern: views only mount when first visited,
 * then stay alive via hidden/block CSS. This prevents mounting
 * heavy views (with IDB reads, Firebase listeners, etc.) that
 * the user may never open → saves CPU + battery.
 */
/**
 * `true` sau lần trình duyệt rảnh đầu tiên (tối đa `timeout` ms; Safari chưa có requestIdleCallback → 300 ms).
 * Dùng để gắn phần chạy nền (dock Auto Sync, hẹn giờ) SAU khi trang đầu đã vẽ xong, không giành CPU/mạng với nó.
 */
function useSauLanRanhDau(timeout = 1500): boolean {
    const [ready, setReady] = React.useState(false);
    React.useEffect(() => {
        if ('requestIdleCallback' in window) {
            const h = window.requestIdleCallback(() => setReady(true), { timeout });
            return () => window.cancelIdleCallback(h);
        }
        const t = setTimeout(() => setReady(true), 300);
        return () => clearTimeout(t);
    }, [timeout]);
    return ready;
}

/** Chunk của 3 tab chính trên thanh dưới — tải trước khi máy rảnh (xem effect trong AppContent). Qua `.preload()` của
 *  lazyWithRetry (không gọi import() trần): module tải xong thì lần mở tab đầu vẽ ngay, không treo Suspense + giữ màn chờ
 *  300 ms của React (GĐ9 2026-10-14: Report BI 0,5–0,7 s → xem utils/lazyWithRetry.ts). */
const TAI_TRUOC_TAB: Record<string, () => Promise<unknown>> = {
    'thuong': () => BiWrapper.preload(),
    'check-thuong': () => CheckThuongView.preload(),
};

/** Bật "Tiết kiệm dữ liệu" hoặc mạng 2G → không tải trước gì (Safari không có navigator.connection → coi như được). */
function mangChoPhepTaiTruoc(): boolean {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    return !(c?.saveData || /(^|-)2g$/.test(c?.effectiveType || ''));
}

let daTaiTruocTabChinh = false;
function taiTruocTabChinh(): void {
    if (daTaiTruocTabChinh || !mangChoPhepTaiTruoc()) return;
    daTaiTruocTabChinh = true;
    for (const tai of Object.values(TAI_TRUOC_TAB)) void tai().catch(() => { /* lúc mở tab sẽ tải lại */ });
    // (2026-10-12) Bỏ prefetch /check-thuong.html: Check thưởng nay là component React (không còn iframe) — chunk của nó
    // đã nằm trong TAI_TRUOC_TAB, tải trang HTML cũ chỉ phí ~100 KB.
}

/** Vòng quay chờ toàn màn — lúc Firebase đang xác nhận phiên và lúc tải màn đăng nhập/chờ duyệt. */
// data-man-cho-khoi-dong: màn khởi động động (index.html #ycx-splash) còn che tới khi vòng quay này không còn (public/man-cho-khoi-dong.js).
const ManChoKhoiDong = () => (
    <div data-man-cho-khoi-dong className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const TabContent = React.memo(() => {
    const { activeTab, setActiveTab } = useActiveTab();
    const { userRole, isDemoMode } = useAuth();
    const { isFeatureEnabled } = useMenuConfig();
    const [mountedTabs, setMountedTabs] = React.useState<Set<string>>(() => new Set([activeTab]));
    const canAccessLineBot = isDemoMode || userRole === 'admin' || userRole === 'manager';
    const laTabLuonBat = (id: string) => (TAB_LUON_BAT as readonly string[]).includes(id);

    // Route / Tab Guard: tính năng đã bị Quản trị hệ thống tắt thì đường dẫn tới nó coi như CHƯA TỪNG TỒN TẠI (2026-10-30, chủ dự án):
    // tự chuyển sang tab tính năng đầu tiên đang bật (ưu tiên tab có thanh điều hướng dưới như Phân tích / Report BI / Check thưởng / Thưởng...),
    // không hiện trang 404. Nếu tất cả tính năng đều tắt thì sang Giới thiệu (tab hệ thống luôn bật).
    const isTabDisabled = !laTabLuonBat(activeTab) && (!isFeatureEnabled(activeTab) || (activeTab === 'tools-line-bot' && !canAccessLineBot));
    const tabDuPhong = timTabBatDauTien(isFeatureEnabled, canAccessLineBot);
    React.useEffect(() => {
        if (isTabDisabled) setActiveTab(tabDuPhong);
    }, [isTabDisabled, tabDuPhong, setActiveTab]);

    // GỠ tab bị tắt khỏi mountedTabs — không để view cũ chạy ngầm tải dữ liệu
    React.useEffect(() => {
        setMountedTabs(prev => {
            const next = new Set<string>();
            for (const t of prev) {
                if (laTabLuonBat(t) || isFeatureEnabled(t)) next.add(t);
            }
            return next.size === prev.size ? prev : next;
        });
    }, [isFeatureEnabled]);

    // Mount tab on first visit
    React.useEffect(() => {
        setMountedTabs(prev => {
            if (!laTabLuonBat(activeTab) && !isFeatureEnabled(activeTab)) return prev;
            if (prev.has(activeTab)) return prev;
            const next = new Set(prev);
            next.add(activeTab);
            return next;
        });
    }, [activeTab, isFeatureEnabled]);

    // Persistent views — only mount when first visited, keep alive after
    const persistentViews = React.useMemo(() => [
        { id: 'approval', className: 'w-full', component: <UserManagementView /> },
        { id: 'settings', className: 'w-full', component: <SettingsView /> },
        { id: 'pending-approval', className: 'w-full', component: <PendingApprovalView /> },
        { id: 'help', className: 'w-full', component: <AboutView /> },
        { id: 'check-thuong', className: 'w-full', component: <CheckThuongView /> },
        { id: 'thuong', className: 'w-full', component: <BiWrapper /> },
        { id: 'tools-print-sticker', className: 'w-full h-full', component: <StickerPrinterView /> },
        { id: 'tools-phanca', className: 'w-full h-full bg-slate-50', component: <PhanCaView /> },
        { id: 'tools-line-bot', className: 'w-full h-full bg-slate-50 dark:bg-slate-900', component: <LineBotView /> },
        { id: 'reports', className: 'w-full bg-slate-50', component: <KhaiThacView /> },
    ], []);

    // Đang chuyển sang tab dự phòng (effect ở trên): không vẽ gì để không lộ trang 404.
    if (isTabDisabled) return null;

    return (
        <>
            {persistentViews.map(view => {
                const isVisible = activeTab === view.id;
                const viewIsActive = activeTab === view.id;
                return mountedTabs.has(view.id) ? (
                    <div
                        key={view.id}
                        className={`${view.className || ''} ${isVisible ? 'flex-1 relative w-full' : '!absolute left-[-9999px] top-0 opacity-0 pointer-events-none w-full h-full overflow-hidden'}`}
                        // Audit A25 (2026-09-29): tab ẩn chỉ bị đẩy ra ngoài màn hình — phím Tab và trình đọc
                        // màn hình vẫn đi vào ô nhập/nút của nó. `inert` chặn cả hai; không đổi giao diện.
                        inert={!isVisible || undefined}
                    >
                        {React.cloneElement(view.component, { isActive: viewIsActive })}
                    </div>
                ) : null;
            })}

            {activeTab === 'tools-coupon' && (
                <div className="flex-1 relative w-full flex flex-col">
                    <CouponConverterView />
                </div>
            )}

            {activeTab === 'tools-tax' && (
                // Tính thuế tràn bề ngang khi mở cột Lịch sử (max-w 1560px) → laptop 1280–1440px bị 2 dock nổi đè cột trái/phải (đo GĐ9).
                <div className="flex-1 relative w-full flex flex-col ycx-tranh-dock">
                    <TaxCalculatorView />
                </div>
            )}

            {/* Fallback for any tab not handled above */}
            {!persistentViews.some(v => v.id === activeTab) && !['tools-coupon', 'tools-tax', 'tools'].includes(activeTab) && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
                    <p className="text-[17px] font-medium leading-7">Tính năng đang được phát triển</p>
                    <p className="text-sm">Vui lòng quay lại sau</p>
                </div>
            )}
        </>
    );
});
TabContent.displayName = 'TabContent';

const TAB_TITLES: Record<string, { main: string, highlight?: string }> = {
    'check-thuong': { main: 'Check', highlight: 'Thưởng' },
    'thuong': { main: 'Hiệu suất', highlight: 'Thưởng' },
    'tools': { main: 'Công', highlight: 'Cụ' },
    'tools-print-sticker': { main: 'In', highlight: 'Sticker' },
    'tools-coupon': { main: 'Rút gọn', highlight: 'Coupon' },
    'tools-tax': { main: 'Tính', highlight: 'Thuế' },
    'tools-phanca': { main: 'Phân', highlight: 'Ca' },
    'tools-line-bot': { main: 'Bot LINE', highlight: 'PMH' },
    'reports': { main: 'Báo cáo', highlight: 'Khai thác' },

    'settings': { main: 'Phân Quyền &', highlight: 'Duyệt Yêu Cầu' },
    'help': { main: 'Giới', highlight: 'Thiệu' },
    'pending-approval': { main: 'Hồ Sơ', highlight: 'Quyền' },
};

/**
 * Tiêu đề thanh trên iPhone — viết như câu, đúng tên chức năng (GĐ4, KE_HOACH_GIAO_DIEN_APPLE.md mục 2.2). Laptop vẫn dùng
 * TAB_TITLES (tiêu đề 2 màu IN HOA theo thiết kế khung laptop của chủ dự án 2026-10-12).
 */
const TAB_NAV_TITLES: Record<string, string> = {
    'check-thuong': 'Check thưởng',
    'thuong': 'Hiệu suất thưởng',
    'tools': 'Công cụ',
    'tools-print-sticker': 'In Sticker',
    'tools-coupon': 'Rút gọn coupon',
    'tools-tax': 'Tính thuế',
    'tools-phanca': 'Phân ca',
    'tools-line-bot': 'Bot LINE PMH',
    'reports': 'Báo cáo khai thác',
    'settings': 'Phân quyền & duyệt',
    'help': 'Giới thiệu',
    'pending-approval': 'Hồ sơ quyền',
};

function AppContent() {
    const { isDarkMode, toggleDarkMode, isDesktopMenuOpen, toggleDesktopMenu } = useLayout();
    const { activeTab, setActiveTab } = useActiveTab();
    const { user, userRole, isDemoMode, isLoading, departmentId, status, hasCachedSession } = useAuth();
    const { isFeatureEnabled } = useMenuConfig();
    const canAccessLineBot = isDemoMode || userRole === 'admin' || userRole === 'manager';
    const titleData = TAB_TITLES[activeTab] || { main: 'Hub', highlight: '2.0' };
    // Các "mini-app" toàn màn hình (In Sticker có sẵn BottomNavigation nội bộ: Trang chủ/Công
    // cụ/Quét mã/Lưu DS/Lọc; Phân ca là lịch/bảng cần tối đa không gian màn hình; Báo cáo Khai thác có Liquid Glass Dock riêng) — hiện thêm
    // MobileBottomNav của app chính bên dưới chúng tạo ra 2 lớp thanh điều hướng chồng nhau trên
    // mobile, vừa rối mắt vừa dư khoảng trắng, và chiếm mất không gian màn
    // hình quý giá của cả hai (bug user báo cáo). Ẩn thanh điều hướng chính khi đang ở các tab
    // này; đổi lại thanh trên có nút ‹ "Về Dashboard" và nút "Menu tính năng" để chuyển tab bất cứ lúc nào.
    const isFullscreenMobileTool = laTabToanManMobile(activeTab);
    const [isMobileMenuSheetOpen, setIsMobileMenuSheetOpen] = React.useState(false);
    const lastNonFullscreenTabRef = React.useRef<string | null>(null);
    const sauLanRanhDau = useSauLanRanhDau();

    React.useEffect(() => {
        if (isFullscreenMobileTool) return;
        const laHeThong = (TAB_LUON_BAT as readonly string[]).includes(activeTab);
        const hopLe = laHeThong || (isFeatureEnabled(activeTab) && (activeTab !== 'tools-line-bot' || canAccessLineBot));
        if (hopLe) {
            lastNonFullscreenTabRef.current = activeTab;
        }
    }, [activeTab, isFullscreenMobileTool, isFeatureEnabled, canAccessLineBot]);

    const handleFullscreenMobileBack = React.useCallback(() => {
        const prev = lastNonFullscreenTabRef.current;
        const prevLaHeThong = prev != null && (TAB_LUON_BAT as readonly string[]).includes(prev);
        const prevHopLe = prev != null && !laTabToanManMobile(prev) && (
            prevLaHeThong || (isFeatureEnabled(prev) && (prev !== 'tools-line-bot' || canAccessLineBot))
        );
        if (prev && prevHopLe) {
            setActiveTab(prev);
            return;
        }
        const tabCoThanhDuoi = timTabCoThanhDuoiDauTien(isFeatureEnabled, canAccessLineBot);
        if (tabCoThanhDuoi) {
            setActiveTab(tabCoThanhDuoi);
            return;
        }
        // Trường hợp tất cả tab có thanh dưới đều bị tắt (chỉ bật Báo cáo / In Sticker / Phân ca):
        // bấm ‹ mở thẳng sheet menu tính năng để người dùng chuyển sang công cụ khác hoặc Phân quyền / Đăng xuất.
        setIsMobileMenuSheetOpen(true);
    }, [isFeatureEnabled, canAccessLineBot, setActiveTab]);

    // Viền mờ "còn cột bên phải" cho mọi bảng cuộn ngang (Đợt C, kế hoạch iPhone)
    React.useEffect(() => installTableScrollCue(), []);

    React.useEffect(() => {
        // Tải trước chunk của tab ĐANG MỞ (đổi tab rồi quay lại thấy tức thì), rồi khi máy rảnh tiếp thì tải trước 2 tab
        // chính còn lại của thanh dưới (GĐ2 tăng tốc — chuyển tab ≤ 0,3 s). Lịch sử: audit "PERF FIX"
        // từng bỏ prefetch cứng 3 tab nặng vì tốn băng thông cho người chỉ dùng Phân ca/In tem → nay chỉ tải 3 tab CHÍNH,
        // một lần mỗi phiên, sau khi tab hiện tại đã vẽ xong + rảnh, và bỏ hẳn khi bật Tiết kiệm dữ liệu / mạng 2G.
        let idleHandle: number | undefined;
        const khiRanh = (fn: () => void, timeout: number) => {
            if ('requestIdleCallback' in window) idleHandle = window.requestIdleCallback(fn, { timeout });
            else fn();
        };
        // GĐ9 2026-10-14: tab chính còn lại tải NGAY ở lượt rảnh đầu (trước đây chờ thêm 2 s + một lượt rảnh nữa ≈ 3,5 s sau
        // khi mở app — người dùng bấm sang Report BI sớm hơn thế thì vẫn gặp vòng quay + màn chờ 300 ms của React.lazy).
        // requestIdleCallback vẫn đảm bảo không giành CPU với tab đang vẽ; vẫn một lần mỗi phiên, vẫn bỏ khi tiết kiệm dữ liệu.
        const timer = setTimeout(() => {
            khiRanh(() => {
                void TAI_TRUOC_TAB[activeTab]?.().catch(() => { /* lỗi mạng: lúc mở tab sẽ tải lại */ });
                taiTruocTabChinh();
            }, 3000);
        }, 800);
        // Audit A28: trước đây chỉ huỷ setTimeout — lượt idle đã đặt vẫn chạy sau khi đổi tab và tải
        // trước chunk của tab vừa rời (tốn băng thông/CPU điện thoại vô ích).
        return () => {
            clearTimeout(timer);
            if (idleHandle !== undefined && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle);
        };
    }, [activeTab]);


    React.useEffect(() => {
        getGlobalFont().then(font => {
            const activeFont = font || 'UTM Avo';
            napPhongGoogle(activeFont); // phông Google người dùng đã chọn — nạp theo nhu cầu (bỏ qua phông tự host)
            if (activeFont && activeFont !== 'UTM Avo') {
                document.body.style.fontFamily = `'${activeFont}', sans-serif`;
            } else {
                document.body.style.fontFamily = `'UTM Avo', sans-serif`;
            }
        }).catch(error => {
            console.warn("Failed to get global font, ignoring:", error);
        });
    }, []);




    // Hiển thị màn hình Loading nếu Firebase Auth đang kiểm tra phiên làm việc
    if (isLoading) {
         return <ManChoKhoiDong />;
    }

    // Nếu chưa đăng nhập và cũng chưa bật chế độ Demo -> Bắt buộc ở màn Login.
    // Bỏ qua khi hasCachedSession=true: Ultra-Fast Boot đã xác nhận qua cache là phiên hợp lệ,
    // chỉ đang chờ Firebase SDK xác nhận lại `user` (thường vài chục ms) — không hiện nhầm màn
    // Login trong lúc chờ (xem chú thích chi tiết ở AuthContext.tsx).
    if (!user && !isDemoMode && !hasCachedSession) {
        return <Suspense fallback={<ManChoKhoiDong />}><LoginView /></Suspense>;
    }

    // Hiển thị màn hình thông tin chờ duyệt hoặc form đăng ký cho user mới
    if (status === 'pending') {
        return <Suspense fallback={<ManChoKhoiDong />}><PendingApprovalView /></Suspense>;
    }

    // Bắt buộc nhập mã kho cho tất cả user đã approved (trừ admin/demo)
    if (user && !isDemoMode && userRole !== 'admin' && (!departmentId || departmentId.trim() === '')) {
        return <Suspense fallback={<ManChoKhoiDong />}><PendingApprovalView forceDeptUpdate /></Suspense>;
    }

    return (
        <div className="flex min-h-dvh bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
            <Sidebar />
            <MobileBottomNav
                hideBar={isFullscreenMobileTool}
                externalMoreOpen={isMobileMenuSheetOpen}
                onExternalMoreOpenChange={setIsMobileMenuSheetOpen}
            />
            <div className="flex-grow flex flex-col min-w-0 w-full relative">

                {/* Thanh trên iPhone/iPad (GĐ4) — vật liệu mờ, tiêu đề 17px, nút 44px; laptop dùng thanh tiêu đề bên dưới. */}
                <MobileNavBar
                    title={TAB_NAV_TITLES[activeTab] || `${titleData.main} ${titleData.highlight ?? ''}`.trim()}
                    tabIcon={navTabIcon(activeTab)}
                    onBack={isFullscreenMobileTool ? handleFullscreenMobileBack : undefined}
                    onOpenMenu={isFullscreenMobileTool ? () => setIsMobileMenuSheetOpen(true) : undefined}
                />

                <main className="flex-grow flex flex-col bg-slate-50/50 dark:bg-slate-950/20 relative">
                    {/* Nhắc cài app (chỉ Safari iPhone): dải mảnh NẰM TRONG trang ở đầu nội dung — không nổi đè lên nội dung. */}
                    {sauLanRanhDau && <Suspense fallback={null}><InstallAppHint hidden={isFullscreenMobileTool} /></Suspense>}

                    {/* Thêm Banner thông báo Đơn chờ duyệt */}
                    <PendingApprovalBanner />

                    {/* Global Page Header */}
                    <div data-app-chrome="header" className="hidden lg:block lg:sticky lg:top-0 z-[150] bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 lg:px-8 pt-1 lg:pt-3 pb-1 lg:pb-1 lg:border-b border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center justify-between gap-4 w-full flex-nowrap">
                            <div className="hidden lg:flex items-center shrink-0">
                                {/* Logo tròn - Bấm về trang chủ & thu gọn/mở rộng menu bar */}
                                <div className="w-[56px] flex items-center justify-center shrink-0">
                                    <Button
                                        variant="card" size="none"
                                        onClick={() => {
                                            setActiveTab(timTabBatDauTien(isFeatureEnabled, canAccessLineBot));
                                            // toggleDesktopMenu (không phải setIsDesktopMenuOpen): nhớ trạng thái dock qua lần mở sau.
                                            toggleDesktopMenu();
                                        }}
                                        className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-md shadow-sky-300/30 hover:scale-105 active:scale-95"
                                        title={isDesktopMenuOpen ? "Bấm vào để thu gọn menu" : "Bấm vào để mở rộng menu"}
                                        aria-label="Trang chủ & Menu"
                                    >
                                        <AppIcon name="chartBar" size="lg" className="text-white" />
                                    </Button>
                                </div>

                                <div className="h-8 w-1 bg-sky-600 rounded-full shadow-[0_0_12px_rgba(2,132,199,0.4)] ml-1 mr-3" />
                                <div className="flex flex-col">
                                    <h1 className="text-[28px] font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none">
                                        {titleData.main} <span className="text-sky-600 dark:text-sky-400">{titleData.highlight}</span>
                                    </h1>
                                    <div id="desktop-header-subtitle" className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1 flex items-center"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 justify-end">
                                {/* Màn khai báo bằng usePageActions (phạm vi 'all'/'desktop') — màn cũ vẫn portal vào khe bên cạnh. */}
                                <PageActionsBar variant="desktop" />
                                <div id="global-header-actions" className="flex items-center z-50 overflow-visible shrink-0 justify-end pb-1 lg:pb-0"></div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Notification Center has been moved into the Header component to prevent layout overlap */}
                    
                    {/* BUG FIX: pb-20 chừa 80px bên dưới cho MobileBottomNav CHÍNH — nhưng In
                        Sticker/Phân ca đã ẩn thanh đó (isFullscreenMobileTool) và tự quản lý
                        khoảng chừa riêng (StickerEventApp.tsx dùng pb-[124px] khớp đúng thanh công
                        cụ nội bộ của nó). Giữ nguyên pb-20 sẽ để lại 80px trống thừa vô nghĩa ngay
                        trên thanh công cụ riêng đó — đúng là dải trống/vệt user báo cáo (xác nhận
                        qua DevTools: pb-20 hiện trên khung bọc ngoài dù thanh chính đã ẩn).
                        SỬA 2026-09-27: 80px cố định KHÔNG đủ trên iPhone có Face ID — thanh cao 56px
                        + vùng thanh Home (safe-area 34px) = 90px, nên 10px cuối mọi màn bị che.
                        Chừa đúng 56px + safe-area + 8px thở. */}
                    {/* --dock-left / --dock-right: bề rộng 2 dock nổi laptop (left-8 + 56px + khe 8px; right-7 + 48px thu gọn) — trang tràn
                        ngang dùng qua lớp `ycx-tranh-dock` (styles.css) để không bị dock che. */}
                    <div
                        className={`w-full relative flex-grow min-h-0 ${isFullscreenMobileTool ? 'pb-0' : 'pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0'} flex flex-col`}
                        style={{ '--dock-left': isDesktopMenuOpen ? '96px' : '0px', '--dock-right': '84px' } as React.CSSProperties}
                    >
                        <ErrorBoundary name="MainContent">
                            <Suspense fallback={
                                <div className="flex items-center justify-center min-h-[50vh]">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-sm font-medium text-slate-500 animate-pulse">Đang tải biểu mẫu phân tích...</p>
                                    </div>
                                </div>
                            }>
                                <TabContent />
                            </Suspense>
                        </ErrorBoundary>
                        {!isFullscreenMobileTool && <AppFooter />}
                    </div>
                </main>
            </div>
            {/* Global Auto Sync Pro Dock: hiện trên Laptop/Desktop; logic hẹn giờ/tự đồng bộ của nó chạy ở mọi thiết bị.
                Gắn sau lần rảnh đầu (gói riêng) — lượt hẹn giờ đầu tiên vốn chờ 5 giây nên không lỡ gì. */}
            {sauLanRanhDau && <Suspense fallback={null}><GlobalAutoSyncDock /></Suspense>}
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <SyncProvider>
                <MenuConfigProvider>
                    <LayoutProvider>
                        <ErrorBoundary name="App_Root">
                            {/* Màn khai báo tiêu đề/nút → khung app (thanh trên iPhone, thanh tiêu đề laptop) tự vẽ — GĐ4. */}
                            <PageActionsProvider>
                                <AppContent />
                            </PageActionsProvider>
                            {/* Toast dùng chung: viên nang trên giữa màn hình, không đè thanh tab (components/shared/ui/toast). */}
                            <AppToaster />
                            {/* Màn cảm ứng: nhấn giữ nút có `title` để đọc chú thích (audit A14) */}
                            <Suspense fallback={null}><TouchTitleHint /></Suspense>
                        </ErrorBoundary>
                    </LayoutProvider>
                </MenuConfigProvider>
            </SyncProvider>
        </AuthProvider>
    );
}
