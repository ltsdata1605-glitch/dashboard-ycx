import { describe, expect, it } from 'vitest';
import {
    chonThayThe,
    laTabToanManMobile,
    timTabBatDauTien,
    timTabCoThanhDuoiDauTien,
} from '../../components/layout/navThayThe';

describe('chonThayThe — công cụ thay ô menu chính bị tắt', () => {
    it('đủ 3 ô chính: không đổi gì', () => {
        const kq = chonThayThe(['a', 'b', 'c'], ['x', 'y']);
        expect(kq).toEqual({ chinh: ['a', 'b', 'c'], congCu: ['x', 'y'] });
    });
    it('tắt 2 ô: 2 công cụ đầu lên thay, phần còn lại ở nhóm công cụ', () => {
        const kq = chonThayThe(['a'], ['x', 'y', 'z']);
        expect(kq).toEqual({ chinh: ['a', 'x', 'y'], congCu: ['z'] });
    });
    it('tắt hết ô chính, ít công cụ hơn số ô: lên hết, không còn ở nhóm công cụ', () => {
        expect(chonThayThe<string>([], ['x'])).toEqual({ chinh: ['x'], congCu: [] });
    });
    it('không có công cụ nào: ô trống như cũ', () => {
        expect(chonThayThe<string>([], [])).toEqual({ chinh: [], congCu: [] });
    });
});

describe('timTabBatDauTien & timTabCoThanhDuoiDauTien — điều hướng dự phòng khi tắt tab chính', () => {
    it('mặc định bật hết: ưu tiên analysis', () => {
        expect(timTabBatDauTien(() => true)).toBe('analysis');
        expect(timTabCoThanhDuoiDauTien(() => true)).toBe('analysis');
    });

    it('tắt Phân tích, Report BI, Check thưởng nhưng bật Thưởng: về thẳng Thưởng (không nhảy vào Báo cáo toàn màn)', () => {
        const tat = new Set(['analysis', 'employees', 'check-thuong']);
        const bat = (id: string) => !tat.has(id);
        expect(timTabBatDauTien(bat)).toBe('thuong');
        expect(timTabCoThanhDuoiDauTien(bat)).toBe('thuong');
    });

    it('nhân viên thường không có quyền Bot LINE: bỏ qua tools-line-bot khi chọn tab dự phòng', () => {
        const chiBatBotVaCoupon = (id: string) => id === 'tools-line-bot' || id === 'tools-coupon';
        expect(timTabCoThanhDuoiDauTien(chiBatBotVaCoupon, false)).toBe('tools-coupon');
        expect(timTabCoThanhDuoiDauTien(chiBatBotVaCoupon, true)).toBe('tools-line-bot');
    });

    it('chỉ bật mini-app toàn màn (reports, tools-print-sticker): timTabCoThanhDuoiDauTien trả null, timTabBatDauTien trả reports', () => {
        const chiMiniApp = (id: string) => id === 'reports' || id === 'tools-print-sticker';
        expect(timTabCoThanhDuoiDauTien(chiMiniApp)).toBeNull();
        expect(timTabBatDauTien(chiMiniApp)).toBe('reports');
    });

    it('tắt toàn bộ tính năng: rơi về help (tab hệ thống luôn bật)', () => {
        expect(timTabBatDauTien(() => false)).toBe('help');
        expect(timTabCoThanhDuoiDauTien(() => false)).toBeNull();
    });

    it('nhận diện đúng 3 mini-app toàn màn trên điện thoại', () => {
        expect(laTabToanManMobile('reports')).toBe(true);
        expect(laTabToanManMobile('tools-print-sticker')).toBe(true);
        expect(laTabToanManMobile('tools-phanca')).toBe(true);
        expect(laTabToanManMobile('thuong')).toBe(false);
        expect(laTabToanManMobile('analysis')).toBe(false);
    });
});
