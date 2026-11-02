import { expect, type Page } from '@playwright/test';

/**
 * Mở một mục trong nhóm "Công cụ" của dock điều hướng laptop (2026-10-27). Từ 19b5dbf1 (chủ dự án, 22/10) "Báo cáo" không còn là nút
 * riêng trên dock mà nằm trong menu bật ra của "Công cụ" (cùng In Sticker, Phân ca…).
 * BẤM "Công cụ" (menu mở theo lượt bấm, đứng yên tới khi chọn mục) thay vì rê chuột: máy bận thì nút Bot LINE hiện ra sau bước bật
 * Dùng thử, đẩy các nút dock xuống — chuột đang "rê" bị lệch sang nút khác, menu đóng (đo 27/10 dưới tải 4 luồng). Chỉ bấm khi menu
 * chưa mở (bấm lần nữa là ĐÓNG), thử lại cả cặp tới khi chọn được.
 */
export async function moMucCongCu(page: Page, ten: string) {
    const dock = page.locator('aside').first();
    const muc = dock.getByRole('button', { name: ten, exact: true });
    await expect(async () => {
        if (!(await muc.isVisible())) await dock.getByRole('button', { name: 'Công cụ', exact: true }).click({ timeout: 5_000 });
        await muc.click({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
}
