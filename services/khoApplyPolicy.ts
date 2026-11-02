/**
 * Quyết định áp dữ liệu Kho dùng chung lên dashboard khi KIỂM CLOUD (hooks/useDataManagement.ts → triggerCloudSync: chạy lúc mở app,
 * mỗi lần quay lại app, 3 phút/lần khi đang mở, và mỗi khi listener khoData/*\/salesFiles báo).
 *
 * AUD-018 (2026-10-28): trước đây áp xong KHÔNG lưu mốc `khoDataAppliedSnapshot::<kho>` — nhánh lưu nằm sau một `else if` có điều kiện
 * TRÙNG HỆT nhánh áp nên không bao giờ chạy. Nhân viên chỉ xem dữ liệu Kho (không tự nạp tệp) bị xử lý lại TOÀN BỘ dữ liệu Kho giống
 * hệt ~3 phút/lần + toast "Đã cập nhật dữ liệu Kho mới nhất" mỗi lần quay lại app.
 */
export type QuyetDinhKho = 'ap' | 'danh-dau-da-ap' | 'bo-qua';

export function quyetDinhApKho(p: { soDong: number; lastApplied: string | null | undefined; snapshot: string; localMoiHonHoacBang: boolean }): QuyetDinhKho {
    if (p.soDong === 0 || p.lastApplied === p.snapshot) return 'bo-qua';
    // Tệp trên máy mới hơn (hoặc bằng) bản Kho: không đè, nhưng ghi nhận đã xét bản Kho này — lần sau khỏi xét lại; bản Kho MỚI
    // (mốc khác) vẫn được áp.
    if (p.localMoiHonHoacBang) return 'danh-dau-da-ap';
    return 'ap';
}
