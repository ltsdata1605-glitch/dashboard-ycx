
/**
 * Lề ngang cho CHỮ và NÚT trên điện thoại.
 * Khung `<main>` của Report BI cố ý để `p-0` ở mobile để BẢNG dùng hết bề ngang (BiWrapper.tsx) —
 * nhưng tiêu đề và thanh công cụ ăn theo `p-0` đó thì chữ dính sát mép máy, trên iPhone trông như
 * bị cắt. Hàng nào là chữ/nút (không phải bảng) thì thêm lề này.
 */
export const MOBILE_GUTTER = 'px-3 sm:px-0';

