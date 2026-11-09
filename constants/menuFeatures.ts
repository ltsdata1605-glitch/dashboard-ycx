import type { IconName } from '../components/shared/ui/icon';
import { NAV_TAB_ICONS } from '../components/layout/navIcons';

export interface AppMenuFeature {
    id: string;
    label: string;
    shortLabel: string;
    group: 'main' | 'tools';
    icon: IconName;
    queryTab: string;
    path?: string;
    description: string;
    defaultEnabled: boolean;
    subTabs?: { id: string; label: string; icon?: IconName; defaultEnabled?: boolean }[];
}

/**
 * Danh sách toàn bộ các tính năng menu có thể cấu hình Bật / Tắt bởi Quản trị hệ thống.
 * Chú ý: Các chức năng nhạy cảm hoặc cốt lõi như 'settings' (Phân quyền) và 'pending-approval' (Hồ sơ quyền)
 * TUYỆT ĐỐI KHÔNG nằm trong danh sách này để đảm bảo Quản trị viên luôn có thể vào hệ thống bật lại!
 */
export const APP_MENU_FEATURES: AppMenuFeature[] = [
    {
        id: 'analysis',
        label: 'Phân tích YCX',
        shortLabel: 'Phân tích',
        group: 'main',
        icon: NAV_TAB_ICONS['analysis'],
        path: '/analysis',
        queryTab: 'analysis',
        description: 'Bảng tổng quan doanh thu, ngành hàng, nhân viên và biểu đồ hiệu suất kinh doanh',
        defaultEnabled: true,
    },
    {
        id: 'employees',
        label: 'Report BI',
        shortLabel: 'Report BI',
        group: 'main',
        icon: NAV_TAB_ICONS['employees'],
        path: '/employees',
        queryTab: 'employees',
        description: 'Báo cáo chi tiết theo kho, bảng xếp hạng thi đua, doanh số nhân viên và tiến độ luỹ kế',
        defaultEnabled: true,
    },
    {
        id: 'check-thuong',
        label: 'Check thưởng',
        shortLabel: 'Check thưởng',
        group: 'main',
        icon: NAV_TAB_ICONS['check-thuong'],
        path: '/',
        queryTab: 'check-thuong',
        description: 'Tra cứu điểm thưởng, tính tiền thưởng chi tiết và bảng xếp hạng thu nhập nhân viên',
        defaultEnabled: true,
    },
    {
        id: 'thuong',
        label: 'Thưởng',
        shortLabel: 'Thưởng',
        group: 'main',
        icon: NAV_TAB_ICONS['thuong'],
        path: '/thuong',
        queryTab: 'thuong',
        description: 'Hiệu suất thưởng nhân viên — doanh thu quy đổi, ERP, thưởng nóng và tổng thưởng dự kiến',
        defaultEnabled: true,
    },
    {
        id: 'tools-line-bot',
        label: 'Bot LINE PMH',
        shortLabel: 'Bot LINE',
        group: 'main',
        icon: NAV_TAB_ICONS['tools-line-bot'],
        path: '/line-bot',
        queryTab: 'tools-line-bot',
        description: 'Tự động xuất ảnh báo cáo, chia sẻ tin nhắn và gửi số liệu qua LINE Messaging',
        defaultEnabled: true,
    },
    {
        id: 'reports',
        label: 'Báo cáo khai thác',
        shortLabel: 'Báo cáo',
        group: 'tools',
        icon: NAV_TAB_ICONS['reports'],
        queryTab: 'reports',
        description: 'Dữ liệu khai thác chi tiết, báo cáo doanh số tổng hợp và phân tích chuyên sâu',
        defaultEnabled: true,
    },
    {
        id: 'tools-print-sticker',
        label: 'In Sticker',
        shortLabel: 'In Sticker',
        group: 'tools',
        icon: NAV_TAB_ICONS['tools-print-sticker'],
        queryTab: 'tools-print-sticker',
        description: 'Công cụ in tem nhãn, sticker sản phẩm sự kiện và khuyến mãi nhanh',
        defaultEnabled: true,
        subTabs: [
            { id: 'tools-print-sticker:gia_soc', label: 'Giá Sốc', icon: 'quick', defaultEnabled: true },
            { id: 'tools-print-sticker:gio_vang', label: 'Giờ Vàng', icon: 'clock', defaultEnabled: true },
            { id: 'tools-print-sticker:draw', label: 'Phiếu', icon: 'coupon', defaultEnabled: true },
            { id: 'tools-print-sticker:event', label: 'Sticker', icon: 'product', defaultEnabled: true },
        ],
    },
    {
        id: 'tools-phanca',
        label: 'Phân ca làm việc',
        shortLabel: 'Phân ca',
        group: 'tools',
        icon: NAV_TAB_ICONS['tools-phanca'],
        queryTab: 'tools-phanca',
        description: 'Xếp lịch trực nhân viên, phân chia ca xoay và đồng bộ Google Sheets',
        defaultEnabled: true,
    },
    {
        id: 'tools-coupon',
        label: 'Rút gọn Coupon',
        shortLabel: 'Coupon',
        group: 'tools',
        icon: NAV_TAB_ICONS['tools-coupon'],
        queryTab: 'tools-coupon',
        description: 'Chuyển đổi, rút gọn và quản lý mã phiếu giảm giá coupon',
        defaultEnabled: true,
    },
    {
        id: 'tools-tax',
        label: 'Tính thuế TNCN',
        shortLabel: 'Tính thuế',
        group: 'tools',
        icon: NAV_TAB_ICONS['tools-tax'],
        queryTab: 'tools-tax',
        description: 'Bảng tính thuế thu nhập cá nhân chi tiết theo biểu thuế luỹ tiến từng phần',
        defaultEnabled: true,
    },
    {
        id: 'tools-price-compare',
        label: 'So sánh giá ĐT',
        shortLabel: 'So sánh giá',
        group: 'tools',
        icon: NAV_TAB_ICONS['tools-price-compare'],
        queryTab: 'tools-price-compare',
        description: 'Tra cứu và so sánh giá bán điện thoại thị trường giữa các chuỗi bán lẻ',
        defaultEnabled: true,
    },
];

export const MENU_FEATURE_MAP: Record<string, AppMenuFeature> = APP_MENU_FEATURES.reduce(
    (acc, feat) => {
        acc[feat.id] = feat;
        return acc;
    },
    {} as Record<string, AppMenuFeature>
);

export function getFeatureById(id: string): AppMenuFeature | undefined {
    return MENU_FEATURE_MAP[id];
}

