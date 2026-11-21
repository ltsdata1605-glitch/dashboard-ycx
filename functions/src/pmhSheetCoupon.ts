/**
 * PMH Sheet Coupon — tự động phản hồi mã PMH từ Google Sheet.
 *
 * CHỈ hoạt động trong Group ID cố định (PMH_SHEET_GROUP_ID).
 * Luồng: tin nhắn chứa "Loại PMH: ..." → tìm mã chưa dùng trong Sheet → reply trích dẫn.
 *
 * Google Sheet: https://docs.google.com/spreadsheets/d/1XdnwrBdnHIXQuq-0Vq8YzpA_dBT_qoUETemCf8-UC9M
 * Sheet 'Coupon': A=Mã Phiếu, B=Loại Phiếu, C=Trạng thái, D=Mã Kho, E=MĐH, F=Người nhận, G=ID Người nhận
 * Sheet 'YeuCauPhatMa': A=ID Tin nhắn, B=ID Người gửi, C=Tên, D=Loại PMH, E=Mã Kho, F=MĐH, G=Trạng thái, H=Thời gian, I=Mã phiếu, J=Ghi chú, K=Quote Token, L=Chat ID
 */

import { google } from 'googleapis';

const SPREADSHEET_ID = '1XdnwrBdnHIXQuq-0Vq8YzpA_dBT_qoUETemCf8-UC9M';
export const PMH_SHEET_GROUP_ID = 'Ceb71871d0e9982527d01f68691075988';
const SHEET_COUPON = 'Coupon';
const SHEET_LOG = 'YeuCauPhatMa';

export function isPmhSheetGroup(groupId: string | undefined): boolean {
    return groupId === PMH_SHEET_GROUP_ID;
}

/** Nhận diện form PMH đơn giản: có "loại pmh:" hoặc "cú pháp:" */
export function looksLikePmhSheetForm(text: string): boolean {
    return /(?:loại\s*pmh|cú\s*pháp)\s*[:：]/i.test(text.normalize('NFC'));
}

export function parsePmhSheetForm(text: string): { loaiPMH: string; maKho: string; mdh: string } {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let loaiPMH = '';
    let maKho = '';
    let mdh = '';

    for (const line of lines) {
        const n = line.normalize('NFC');
        const typeMatch = n.match(/(?:loại\s*pmh|cú\s*pháp)\s*[:：]\s*(.+)/i);
        if (typeMatch && !loaiPMH) loaiPMH = typeMatch[1].trim();

        const khoMatch = n.match(/(?:mã\s*kho(?:\s*áp\s*dụng)?|kho)\s*[:：]\s*(.+)/i);
        if (khoMatch && !maKho) maKho = khoMatch[1].trim();

        const mdhMatch = n.match(/(?:mđh|mdh|mã\s*đh|mã\s*đơn\s*hàng|đơn\s*hàng)(?:\s*áp\s*dụng)?\s*[:：]\s*(.+)/i);
        if (mdhMatch && !mdh) mdh = mdhMatch[1].trim();
    }

    return { loaiPMH, maKho, mdh };
}

let _sheets: ReturnType<typeof google.sheets> | null = null;
function getSheetsClient() {
    if (!_sheets) {
        const auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        _sheets = google.sheets({ version: 'v4', auth });
    }
    return _sheets;
}

/**
 * Tìm mã chưa dùng trong Sheet, đánh dấu "Đã gửi", ghi log. Trả couponCode hoặc null.
 */
export async function handlePmhSheetCoupon(params: {
    text: string;
    senderUserId: string;
    displayName: string;
    groupId: string;
    messageId: string;
    quoteToken?: string;
}): Promise<{ couponCode: string; loaiPMH: string; maKho: string; mdh: string } | null> {
    const { loaiPMH, maKho, mdh } = parsePmhSheetForm(params.text);
    if (!loaiPMH) {
        console.warn('[pmhSheetCoupon] Form không có Loại PMH, bỏ qua.');
        return null;
    }

    const sheets = getSheetsClient();

    const couponRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_COUPON}!A:G`,
    });
    const rows = couponRes.data.values || [];
    if (rows.length <= 1) {
        console.info('[pmhSheetCoupon] Sheet Coupon rỗng.');
        return null;
    }

    // Tìm mã chưa dùng khớp loại
    const loaiLower = loaiPMH.toLowerCase();
    let foundRowIdx = -1;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const loaiPhieu = String(row[1] || '').trim().toLowerCase();
        const trangThai = String(row[2] || '').trim();
        const isUnused = !trangThai || trangThai === 'Chưa gửi';
        if (!isUnused) continue;
        if (loaiPhieu === loaiLower || loaiPhieu.includes(loaiLower) || loaiLower.includes(loaiPhieu)) {
            foundRowIdx = i;
            break;
        }
    }

    if (foundRowIdx === -1) {
        console.info(`[pmhSheetCoupon] Không còn mã "${loaiPMH}" khả dụng trong Sheet.`);
        return null;
    }

    const couponCode = String(rows[foundRowIdx][0] || '').trim();
    if (!couponCode) return null;

    const now = new Date();
    const vnTime = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(now);

    const sheetRow = foundRowIdx + 1; // 1-indexed

    // Đánh dấu "Đã gửi" + điền thông tin người nhận
    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_COUPON}!C${sheetRow}:G${sheetRow}`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [['Đã gửi', maKho, mdh, params.displayName, params.senderUserId]],
        },
    });

    // Ghi log vào sheet YeuCauPhatMa
    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_LOG}!A:L`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [[
                params.messageId,
                params.senderUserId,
                params.displayName,
                loaiPMH,
                maKho,
                mdh,
                'Đã phát mã',
                vnTime,
                couponCode,
                'BOT tự động gửi',
                params.quoteToken || '',
                params.groupId,
            ]],
        },
    });

    console.info(`[pmhSheetCoupon] Phát mã "${couponCode}" (${loaiPMH}) cho ${params.displayName}`);
    return { couponCode, loaiPMH, maKho, mdh };
}
