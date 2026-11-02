import { describe, expect, it, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ warning: vi.fn() }));
vi.mock('../../components/shared/ui/toast', () => ({ toast: { warning: h.warning } }));
import { xoaBanCloudKhiMayTrong } from '../../services/xoaBanCloud';

/** AUD-020: xoá bản cloud hỏng thì PHẢI báo người dùng (trước chỉ console.error trong khi đã báo "Đã xoá"). */
describe('xoaBanCloudKhiMayTrong', () => {
    const user = { uid: 'u1' } as never;
    beforeEach(() => h.warning.mockReset());
    it('xoá được → không báo', async () => {
        const del = vi.fn(async () => {});
        expect(await xoaBanCloudKhiMayTrong(user, async () => ({ deleteCloudSalesData: del }))).toBe(true);
        expect(del).toHaveBeenCalledWith(user);
        expect(h.warning).not.toHaveBeenCalled();
    });
    it('xoá cloud lỗi (mất mạng / hết phiên) → báo cảnh báo', async () => {
        const del = vi.fn(async () => { throw new Error('unavailable'); });
        expect(await xoaBanCloudKhiMayTrong(user, async () => ({ deleteCloudSalesData: del }))).toBe(false);
        expect(h.warning).toHaveBeenCalledTimes(1);
        expect(String(h.warning.mock.calls[0][0])).toContain('CHƯA xoá được bản trên đám mây');
    });
    it('tải mảnh code lỗi → vẫn báo (trước đây rơi im lặng)', async () => {
        expect(await xoaBanCloudKhiMayTrong(user, async () => { throw new TypeError('Failed to fetch dynamically imported module'); })).toBe(false);
        expect(h.warning).toHaveBeenCalledTimes(1);
    });
});
