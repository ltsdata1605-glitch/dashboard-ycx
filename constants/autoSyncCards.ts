/**
 * Các thẻ "Auto Sync Pro" (thanh bên phải + cột icon thu gọn) có thể bật/tắt theo VAI TRÒ (2026-10-31, chủ dự án).
 * Quyền xem dùng chung cơ chế featureRoles trong shared_configs/system_menu_config: thiếu khoá = mọi vai trò thấy;
 * quản trị hệ thống luôn thấy. Đây là phân quyền GIAO DIỆN; các thao tác đồng bộ vẫn đi qua quyền dữ liệu của chức năng gốc.
 */
export interface AutoSyncCardMeta {
    id: string;
    label: string;
    /** Menu features gốc — tắt hết = auto-sync này vô nghĩa, ẩn luôn. */
    parentFeatures?: string[];
}

export const AUTO_SYNC_CARDS: AutoSyncCardMeta[] = [
    { id: 'auto-bi-realtime', label: 'BI Realtime', parentFeatures: ['employees'] },
    { id: 'auto-bi-luyke', label: 'BI Luỹ kế', parentFeatures: ['employees'] },
    { id: 'auto-bonus', label: 'Đổ Thưởng', parentFeatures: ['employees', 'thuong'] },
    { id: 'auto-ycx-realtime', label: 'YCX Realtime', parentFeatures: ['analysis'] },
    { id: 'auto-ycx-luyke', label: 'YCX Luỹ kế', parentFeatures: ['analysis'] },
    { id: 'auto-tnb', label: 'TNB Data' },
];

const _parentMap: Record<string, string[]> = {};
for (const c of AUTO_SYNC_CARDS) if (c.parentFeatures?.length) _parentMap[c.id] = c.parentFeatures;
export const AUTO_SYNC_PARENT_MAP = _parentMap;
