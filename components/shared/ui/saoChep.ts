import { toast } from './toast';

/**
 * Sao chép chữ vào clipboard — DÙNG CHUNG, luôn báo kết quả (2026-10-27).
 *
 * Trước đây các nơi gọi thẳng `navigator.clipboard.writeText(x).then(() => toast.success(...))`, không có nhánh lỗi: trình duyệt từ chối
 * (chưa cấp quyền, khung nhúng, trang không HTTPS) thì người dùng chạm mà không thấy gì; trình duyệt cũ không có `navigator.clipboard`
 * thì ném lỗi ngay trong onClick. Ở đây: Clipboard API → dự phòng `execCommand('copy')` → vẫn hỏng thì báo lỗi kèm nội dung để chép tay.
 */

/** Môi trường trình duyệt cần dùng — truyền vào được để test (test đơn vị chạy trong node, không có DOM). */
export interface MoiTruongSaoChep {
    clipboard?: { writeText(text: string): Promise<void> } | null;
    document?: Document | null;
}

const moiTruongThat = (): MoiTruongSaoChep => ({
    clipboard: typeof navigator !== 'undefined' ? navigator.clipboard : null,
    document: typeof document !== 'undefined' ? document : null,
});

/** Clipboard API không trả lời trong khoảng này thì coi như hỏng (Chromium chưa cấp quyền có lúc TREO thay vì từ chối — đo 21/10 với
 *  `clipboard.write`) → vẫn kịp báo cho người dùng thay vì im lặng mãi. */
export const CHO_CLIPBOARD_MS = 2000;

/** Ghi `text` vào clipboard. Trả `true` khi ghi được (bằng Clipboard API hoặc cách cũ `execCommand('copy')`). Không bao giờ ném lỗi. */
export async function ghiClipboard(text: string, moiTruong: MoiTruongSaoChep = moiTruongThat()): Promise<boolean> {
    try {
        if (moiTruong.clipboard?.writeText) {
            let hen: ReturnType<typeof setTimeout> | undefined;
            const quaGio = new Promise<never>((_, loi) => { hen = setTimeout(() => loi(new Error('clipboard treo')), CHO_CLIPBOARD_MS); });
            try {
                await Promise.race([moiTruong.clipboard.writeText(text), quaGio]);
            } finally {
                clearTimeout(hen);
            }
            return true;
        }
    } catch { /* bị từ chối / treo → thử cách cũ */ }
    const doc = moiTruong.document;
    if (!doc?.body) return false;
    const o = doc.createElement('textarea');
    try {
        o.value = text;
        o.setAttribute('readonly', '');
        o.style.position = 'fixed';
        o.style.top = '0';
        o.style.left = '0';
        o.style.opacity = '0';
        o.style.pointerEvents = 'none';
        doc.body.appendChild(o);
        o.select();
        o.setSelectionRange(0, text.length); // Safari cũ: select() một mình không chọn chữ trong ô readonly
        return doc.execCommand('copy') === true;
    } catch {
        return false;
    } finally {
        o.remove();
    }
}

export interface TuyChonSaoChep {
    /** Chữ toast khi chép được, vd `Đã sao chép: SO002`. */
    thanhCong: string;
    /** id toast — chạm liên tiếp thì thay toast cũ thay vì xếp chồng. Mặc định `sao-chep`. */
    id?: string;
}

/** Sao chép rồi báo bằng toast chung: được → toast thành công; hỏng → toast lỗi kèm nội dung (ngắn) để người dùng chép tay. */
export async function saoChep(text: string, tuyChon: TuyChonSaoChep, moiTruong?: MoiTruongSaoChep): Promise<boolean> {
    const id = tuyChon.id ?? 'sao-chep';
    const duoc = await ghiClipboard(text, moiTruong);
    if (duoc) {
        toast.success(tuyChon.thanhCong, { id });
    } else {
        toast.error('Không sao chép được', {
            id,
            description: text.length <= 40 ? `Trình duyệt chặn sao chép — chép tay: ${text}` : 'Trình duyệt chặn sao chép. Thử lại, hoặc mở bằng Safari/Chrome.',
        });
    }
    return duoc;
}
