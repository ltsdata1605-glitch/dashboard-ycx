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
