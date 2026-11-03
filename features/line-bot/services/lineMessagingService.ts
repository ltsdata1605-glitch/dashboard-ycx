/**
 * Service tương tác với LINE Messaging API thông qua Cloud Function Proxy
 * Giải quyết triệt để lỗi "Failed to fetch" do trình duyệt chặn CORS khi gọi trực tiếp api.line.me
 */

import { getAuth } from 'firebase/auth';
import { db } from '../../../services/firebase';

export interface LineBotInfo {
    userId: string;
    basicId: string;
    displayName: string;
    pictureUrl?: string;
    chatMode: string;
    markAsReadMode: string;
}

const FIREBASE_REGION = 'asia-southeast1';
const FIREBASE_PROJECT_ID = 'dashboa-7e20b';
const CLOUD_PROXY_URL = `https://${FIREBASE_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net/lineBotWebhook`;

/** ID token Firebase của người đang đăng nhập — server bắt buộc khi dùng bot theo botId (audit S13). */
async function currentIdToken(): Promise<string> {
    try { return (await getAuth(db.app).currentUser?.getIdToken()) ?? ''; } catch { return ''; }
}

export const lineMessagingService = {
    /**
     * Sinh Webhook URL cá nhân hoá cho Quản lý
     */
    getPersonalWebhookUrl(userId: string): string {
        return `${CLOUD_PROXY_URL}?uid=${encodeURIComponent(userId)}`;
    },

    /** Kiểm tra token ĐÃ LƯU của bot (server tự lấy token, client không cần biết). */
    async verifyBotById(botId: string): Promise<{ success: boolean; info?: LineBotInfo; error?: string }> {
        try {
            const idToken = await currentIdToken();
            const res = await fetch(`${CLOUD_PROXY_URL}?action=verifyToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ botId })
            });
            return await res.json();
        } catch {
            return { success: false, error: 'Không thể kết nối đến máy chủ xác thực LINE.' };
        }
    },

    /**
     * Hạn mức tin nhắn LINE của bot trong tháng (2026-10-15): tin PUSH vào nhóm tính theo SỐ THÀNH VIÊN nhóm; hết hạn mức thì
     * LINE từ chối mọi tin hẹn giờ/gửi ngay tới ngày 1 tháng sau. `limit` null = gói không giới hạn.
     */
    async getQuota(botId: string): Promise<{ success: boolean; limit?: number | null; used?: number | null; exhausted?: boolean; notifyCaThang?: number; notifyConLai?: number; error?: string }> {
        try {
            const idToken = await currentIdToken();
            const res = await fetch(`${CLOUD_PROXY_URL}?action=quota`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ botId })
            });
            return await res.json();
        } catch {
            return { success: false, error: 'Không đọc được hạn mức tin nhắn LINE.' };
        }
    },

    /** Lưu Token/Secret mới lên server (line_bot_secrets). Chỉ chủ bot hoặc Admin; field bỏ trống = giữ nguyên. */
    async saveBotSecrets(botId: string, secrets: { channelAccessToken?: string; channelSecret?: string }): Promise<{ success: boolean; hasToken?: boolean; hasSecret?: boolean; error?: string }> {
        try {
            const idToken = await currentIdToken();
            const res = await fetch(`${CLOUD_PROXY_URL}?action=saveSecrets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ botId, ...secrets })
            });
            return await res.json();
        } catch {
            return { success: false, error: 'Không thể kết nối máy chủ để lưu Token.' };
        }
    },

    /**
     * Kiểm tra tính hợp lệ của Token và lấy thông tin Bot
     */
    async verifyBotToken(token: string): Promise<{ success: boolean; info?: LineBotInfo; error?: string }> {
        const cleanToken = (token || '').trim().replace(/^["']|["']$/g, '');
        if (!cleanToken) {
            return { success: false, error: 'Vui lòng nhập Channel Access Token' };
        }

        // 1. Thử gọi qua Firebase Cloud Function Proxy (Hỗ trợ CORS đầy đủ cho Browser)
        try {
            // Token tự gõ (chưa lưu) — server bắt buộc đăng nhập Dashboard (2026-10-28, AUD-016: trước đó ai cũng gọi được).
            const idToken = await currentIdToken();
            const res = await fetch(`${CLOUD_PROXY_URL}?action=verifyToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ token: cleanToken })
            });

            if (res.ok) {
                const data = await res.json();
                return data;
            }
        } catch (cloudErr) {
            console.warn('[LineBot] Cloud Function Proxy không phản hồi, thử fallback local...', cloudErr);
        }

        // 2. Fallback sang Vite Dev Proxy (nếu đang chạy localhost với Vite)
        try {
            const res = await fetch('/api-line-proxy/v2/bot/info', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${cleanToken}`
                }
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                return {
                    success: false,
                    error: errData.message || `Token không hợp lệ (mã lỗi HTTP ${res.status})`
                };
            }

            const info: LineBotInfo = await res.json();
            return { success: true, info };
        } catch (localErr: any) {
            return {
                success: false,
                error: 'Không thể kết nối đến máy chủ xác thực LINE (Lỗi mạng hoặc CORS). Vui lòng thử lại sau.'
            };
        }
    },

    /**
     * Gửi tin nhắn kiểm tra tới một LINE User ID / nhóm — LUÔN theo botId (token nằm ở server, audit S13). 2026-10-28: gỡ đường
     * gửi bằng token chuỗi + sendBroadcast (không còn nơi gọi) — server chỉ còn nhận token tự gõ ở verifyToken, và phải đăng nhập.
     */
    async sendTestPush(target: { botId: string }, toUserId: string, text: string): Promise<{ success: boolean; error?: string }> {
        const cleanTo = (toUserId || '').trim();
        if (!target.botId || !cleanTo) return { success: false, error: 'Thiếu Bot hoặc LINE User ID' };
        try {
            const idToken = await currentIdToken();
            const res = await fetch(`${CLOUD_PROXY_URL}?action=sendTestPush`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ botId: target.botId, toUserId: cleanTo, text: text || '🔔 Tin nhắn kiểm tra kết nối từ Dashboard thành công!' })
            });
            return await res.json();
        } catch {
            return { success: false, error: 'Lỗi mạng khi gửi tin nhắn test' };
        }
    },
};

/**
 * Duyệt / từ chối một yêu cầu xin phép từ tab "Yêu cầu duyệt" trên web. Server kiểm quyền (chủ bot, admin, hoặc
 * manager cùng Mã Kho) và ghi nhật ký nguồn "web". Trạng thái trên giao diện tự cập nhật qua onSnapshot.
 */
export async function decideApprovalOnBot(botId: string, approvalId: string, decision: 'ok' | 'no'): Promise<{ success: boolean; error?: string }> {
    if (!botId || !approvalId) return { success: false, error: 'Thiếu Bot hoặc mã yêu cầu' };
    try {
        const idToken = await currentIdToken();
        const res = await fetch(`${CLOUD_PROXY_URL}?action=approvalDecide`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ botId, approvalId, decision })
        });
        return await res.json();
    } catch {
        return { success: false, error: 'Lỗi mạng khi gửi quyết định duyệt' };
    }
}
