import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * AUD-002 (2026-10-28): tự xuất ảnh cho Bot LINE phải tìm bot TRƯỚC khi chụp. Trước đây `triggerYcxAutoReportExport` chạy
 * runner chụp ảnh (nặng, hiện hộp tiến trình) sau mỗi lần nạp dữ liệu rồi mới phát hiện không có bot nào và bỏ ảnh —
 * gặp ở mọi người không dùng Bot LINE, kể cả Chế độ Dùng Thử (đo thật bằng Playwright: hộp "Xuất ảnh … Đang chụp ảnh…" hiện
 * sau khi nạp tệp mẫu ở tab Phân tích).
 */
const h = vi.hoisted(() => ({ bot: null as null | { botId: string; botName: string }, whBot: null as null | { id: string }, personal: null as unknown }));

vi.mock('../../services/dbService', () => ({ getSetting: vi.fn(async () => null), saveSetting: vi.fn(async () => {}) }));
vi.mock('../../services/firebase', () => ({ db: {} }));
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), setDoc: vi.fn(async () => {}) }));
vi.mock('../../services/lineReportDelivery', () => ({
    resolveLineBot: vi.fn(async () => h.bot),
    prepareLineImage: vi.fn(async () => ({ base64: 'x' })),
    prepareLineHdImage: vi.fn(async () => ({ base64: 'x', contentType: 'image/png' })),
    uploadLineImage: vi.fn(async () => 'https://img/preview.jpg'),
    uploadLineHdImage: vi.fn(async () => 'https://img/hd.png'),
    lineHdSupported: vi.fn(async () => false),
}));
vi.mock('../../features/line-bot/services/lineBotFirestoreService', () => ({
    lineBotFirestoreService: {
        findWarehouseBot: vi.fn(async () => h.whBot),
        getBotConfig: vi.fn(async () => h.personal),
    },
}));
vi.mock('../../components/shared/ui/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { registerYcxAutoExportRunner, triggerYcxAutoReportExport, resolveAutoReportTargetBots } from '../../services/autoReportExportService';

describe('tự xuất ảnh Bot LINE — chỉ chụp khi có bot nhận', () => {
    beforeEach(() => { h.bot = null; h.whBot = null; h.personal = null; });

    it('không có bot nào (Dùng Thử / chưa nối bot) → KHÔNG chạy chụp ảnh', async () => {
        const runner = vi.fn(async () => new Blob(['png']));
        const go = registerYcxAutoExportRunner('Chi Tiết Theo Kho', runner); // khu vực bật sẵn mặc định
        await triggerYcxAutoReportExport('realtime', null, null);
        await triggerYcxAutoReportExport('luyke', { uid: 'u1' }, '910');
        expect(runner).not.toHaveBeenCalled();
        go();
    });

    it('có bot của tài khoản → chụp đúng một lần mỗi lượt nạp', async () => {
        h.bot = { botId: 'u1', botName: 'Bot' };
        const runner = vi.fn(async () => new Blob(['png']));
        const go = registerYcxAutoExportRunner('Chi Tiết Theo Kho', runner);
        await triggerYcxAutoReportExport('realtime', { uid: 'u1' }, null);
        expect(runner).toHaveBeenCalledTimes(1);
        go();
    });

    it('resolveAutoReportTargetBots gom bot tài khoản + bot kho, bỏ kho "ALL"', async () => {
        h.bot = { botId: 'u1', botName: 'Bot' };
        h.whBot = { id: 'wh910' };
        expect([...await resolveAutoReportTargetBots({ uid: 'u1' }, '910')].sort()).toEqual(['u1', 'wh910']);
        expect([...await resolveAutoReportTargetBots({ uid: 'u1' }, 'ALL')]).toEqual(['u1']);
        h.bot = null; h.whBot = null;
        expect((await resolveAutoReportTargetBots(undefined, null)).size).toBe(0);
    });
});
