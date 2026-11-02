import { describe, expect, it } from 'vitest';
import { quyetDinhApKho } from '../../services/khoApplyPolicy';

/** AUD-018 (2026-10-28): dữ liệu Kho dùng chung chỉ được áp MỘT lần cho mỗi bản (mốc snapshot) — trước áp lại ~3 phút/lần. */
describe('quyetDinhApKho', () => {
    const co = { soDong: 900, snapshot: 'S2', localMoiHonHoacBang: false };
    it('bản Kho mới chưa áp → áp', () => expect(quyetDinhApKho({ ...co, lastApplied: 'S1' })).toBe('ap'));
    it('bản đã áp (mốc trùng) → bỏ qua — lượt kiểm 3 phút sau KHÔNG xử lý lại', () => expect(quyetDinhApKho({ ...co, lastApplied: 'S2' })).toBe('bo-qua'));
    it('chưa từng áp → áp', () => expect(quyetDinhApKho({ ...co, lastApplied: null })).toBe('ap'));
    it('Kho rỗng → bỏ qua', () => expect(quyetDinhApKho({ ...co, soDong: 0, lastApplied: null })).toBe('bo-qua'));
    it('tệp trên máy mới hơn → không đè, chỉ đánh dấu đã xét bản Kho này', () =>
        expect(quyetDinhApKho({ ...co, lastApplied: 'S1', localMoiHonHoacBang: true })).toBe('danh-dau-da-ap'));
});
