/**
 * Các thẻ "Auto Sync Pro" (thanh bên phải + cột icon thu gọn) có thể bật/tắt theo VAI TRÒ (2026-10-31, chủ dự án).
 * Quyền xem dùng chung cơ chế featureRoles trong shared_configs/system_menu_config: thiếu khoá = mọi vai trò thấy;
 * quản trị hệ thống luôn thấy. Đây là phân quyền GIAO DIỆN; các thao tác đồng bộ vẫn đi qua quyền dữ liệu của chức năng gốc.
 */
export interface AutoSyncCardMeta {
    id: string;
    label: string;
}

export const AUTO_SYNC_CARDS: AutoSyncCardMeta[] = [
    { id: 'auto-bi-realtime', label: 'BI Realtime' },
    { id: 'auto-bi-luyke', label: 'BI Luỹ kế' },
    { id: 'auto-bonus', label: 'Đổ Thưởng' },
    { id: 'auto-ycx-realtime', label: 'YCX Realtime' },
    { id: 'auto-ycx-luyke', label: 'YCX Luỹ kế' },
    { id: 'auto-tnb', label: 'TNB Data' },
];
