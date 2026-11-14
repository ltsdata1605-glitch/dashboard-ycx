/**
 * Thay thế ô menu chính bị TẮT bằng công cụ đang BẬT (2026-10-30, chủ dự án): thanh chính có SO_O_CHINH ô (Phân tích, Report BI,
 * Check thưởng). Ô nào không còn (tắt trong Quản lý Bật/Tắt) thì lấy công cụ đầu danh sách đưa lên thay; công cụ đó không còn nằm
 * trong nhóm công cụ nữa (không hiện hai lần). Không có công cụ nào thì ô trống như cũ.
 */
export const SO_O_CHINH = 3;

export function chonThayThe<T>(chinh: T[], congCu: T[], soO: number = SO_O_CHINH): { chinh: T[]; congCu: T[] } {
    const thieu = Math.max(0, soO - chinh.length);
    return { chinh: [...chinh, ...congCu.slice(0, thieu)], congCu: congCu.slice(thieu) };
}

/** Các tab hệ thống luôn hoạt động bất kể cấu hình Bật/Tắt chức năng. */
export const TAB_LUON_BAT = ['settings', 'approval', 'pending-approval', 'help'] as const;

/** Các mini-app toàn màn trên điện thoại (có thanh dưới riêng hoặc cần tối đa diện tích màn hình → ẩn thanh tab dưới chính). */
export const FULLSCREEN_MOBILE_TABS = ['reports', 'tools-print-sticker', 'tools-phanca'] as const;

export function laTabToanManMobile(tabId: string): boolean {
    return (FULLSCREEN_MOBILE_TABS as readonly string[]).includes(tabId);
}

/** Thứ tự ưu tiên các tab có hiển thị thanh điều hướng dưới trên điện thoại (MobileBottomNav). */
export const THU_TU_TAB_CO_THANH_DUOI = [
    'analysis',
    'employees',
    'check-thuong',
    'thuong',
    'tools-line-bot',
    'tools-coupon',
    'tools-tax',
    'tools-price-compare',
] as const;

/** Thứ tự ưu tiên toàn bộ tính năng khi chọn tab mặc định / dự phòng (ưu tiên tab có thanh dưới trước, sau đó tới mini-app toàn màn). */
export const THU_TU_TAB_UU_TIEN = [
    ...THU_TU_TAB_CO_THANH_DUOI,
    ...FULLSCREEN_MOBILE_TABS,
] as const;

function tabDuocPhepTruyCap(
    tabId: string,
    isFeatureEnabled: (id: string) => boolean,
    canAccessLineBot: boolean,
): boolean {
    if (tabId === 'tools-line-bot' && !canAccessLineBot) return false;
    return isFeatureEnabled(tabId);
}

/**
 * Tìm tab đầu tiên đang bật mà vẫn hiện thanh điều hướng dưới (MobileBottomNav) trên điện thoại.
 * Dùng cho nút `<` ("Về Dashboard") ở các mini-app toàn màn hình (Báo cáo khai thác, In Sticker, Phân ca).
 */
export function timTabCoThanhDuoiDauTien(
    isFeatureEnabled: (id: string) => boolean,
    canAccessLineBot = true,
): string | null {
    for (const id of THU_TU_TAB_CO_THANH_DUOI) {
        if (tabDuocPhepTruyCap(id, isFeatureEnabled, canAccessLineBot)) return id;
    }
    return null;
}

/**
 * Tìm tab tính năng đầu tiên đang bật theo thứ tự ưu tiên chuẩn của hệ thống.
 * Nếu tất cả tính năng đều tắt, rơi về `'help'` (Giới thiệu — tab hệ thống luôn bật và hiện thanh dưới).
 */
export function timTabBatDauTien(
    isFeatureEnabled: (id: string) => boolean,
    canAccessLineBot = true,
): string {
    for (const id of THU_TU_TAB_UU_TIEN) {
        if (tabDuocPhepTruyCap(id, isFeatureEnabled, canAccessLineBot)) return id;
    }
    return 'help';
}
