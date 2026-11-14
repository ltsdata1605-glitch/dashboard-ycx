import { describe, it, expect } from 'vitest';
import {
    getDefaultBgImageForType,
    isValidBgImageForType,
    resolveEffectiveBgImage,
    getDefaultHeaderForType,
    getDefaultSubHeaderForType,
    getDefaultActiveFieldForType,
    GIO_VANG_DEFAULT_BG,
    GIA_SOC_DEFAULT_BG,
    DRAW_DMX_DEFAULT_BG,
    DRAW_TGDD_DEFAULT_BG,
    GIA_SOC_ALT_BG,
    bgImageUrl,
} from '../../features/sticker-event/stickerprinter/stickerBackgroundHelpers';

describe('stickerBackgroundHelpers', () => {
    it('returns correct default background for each sticker type', () => {
        expect(getDefaultBgImageForType('gio_vang')).toBe(GIO_VANG_DEFAULT_BG);
        expect(getDefaultBgImageForType('draw')).toBe(DRAW_DMX_DEFAULT_BG);
        expect(getDefaultBgImageForType('gia_soc')).toBe(GIA_SOC_DEFAULT_BG);
    });

    it('validates background image strictly by sticker type', () => {
        // gio_vang should ONLY allow GVO2-scaled
        expect(isValidBgImageForType('gio_vang', GIO_VANG_DEFAULT_BG)).toBe(true);
        expect(isValidBgImageForType('gio_vang', DRAW_DMX_DEFAULT_BG)).toBe(false);
        expect(isValidBgImageForType('gio_vang', GIA_SOC_DEFAULT_BG)).toBe(false);

        // draw should ONLY allow draw backgrounds
        expect(isValidBgImageForType('draw', DRAW_DMX_DEFAULT_BG)).toBe(true);
        expect(isValidBgImageForType('draw', DRAW_TGDD_DEFAULT_BG)).toBe(true);
        expect(isValidBgImageForType('draw', GIO_VANG_DEFAULT_BG)).toBe(false);
        expect(isValidBgImageForType('draw', GIA_SOC_DEFAULT_BG)).toBe(false);

        // gia_soc should ONLY allow gia_soc backgrounds
        expect(isValidBgImageForType('gia_soc', GIA_SOC_DEFAULT_BG)).toBe(true);
        expect(isValidBgImageForType('gia_soc', '/frame/X24.png')).toBe(true);
        expect(isValidBgImageForType('gia_soc', GIO_VANG_DEFAULT_BG)).toBe(false);
        expect(isValidBgImageForType('gia_soc', DRAW_DMX_DEFAULT_BG)).toBe(false);
    });

    it('resolveEffectiveBgImage falls back to valid default when cross-tab background is provided', () => {
        // If draw background is provided to gio_vang, it must resolve to GIO_VANG_DEFAULT_BG
        expect(resolveEffectiveBgImage('gio_vang', DRAW_DMX_DEFAULT_BG)).toBe(GIO_VANG_DEFAULT_BG);
        expect(resolveEffectiveBgImage('gio_vang', null)).toBe(GIO_VANG_DEFAULT_BG);

        // If gio_vang background is provided to draw, it must resolve to DRAW_DMX_DEFAULT_BG
        expect(resolveEffectiveBgImage('draw', GIO_VANG_DEFAULT_BG)).toBe(DRAW_DMX_DEFAULT_BG);

        // If valid, keep it
        expect(resolveEffectiveBgImage('draw', DRAW_TGDD_DEFAULT_BG)).toBe(DRAW_TGDD_DEFAULT_BG);
    });

    it('returns appropriate default headers and active fields', () => {
        expect(getDefaultHeaderForType('gio_vang')).toBe('TỪ 00/00 ĐẾN 00/00');
        expect(getDefaultHeaderForType('gia_soc')).toBe('QUẠT ĐIỀU HOÀ');
        expect(getDefaultSubHeaderForType('gio_vang')).toBe('5 SUẤT/NGÀY');
        expect(getDefaultActiveFieldForType('draw')).toBe('drawContentBottomLeft');
        expect(getDefaultActiveFieldForType('gio_vang')).toBe('header');
        expect(getDefaultActiveFieldForType('gia_soc')).toBe('header');
    });

    // 2026-11-14: app chạy dưới /dashboard-ycx/ — mã nền giữ nguyên (lịch sử in đã lưu so khớp theo mã), chỉ URL vẽ có tiền tố.
    it('mã định danh nền KHÔNG đổi giá trị (lịch sử in / trạng thái đã lưu so khớp theo chuỗi này)', () => {
        expect([GIO_VANG_DEFAULT_BG, GIA_SOC_DEFAULT_BG, GIA_SOC_ALT_BG, DRAW_DMX_DEFAULT_BG, DRAW_TGDD_DEFAULT_BG]).toEqual([
            '/frame/GVO2-scaled.png', '/frame/X24_NEW.png', '/frame/X24.png', '/frame/bg_phieu.png', '/frame/bg_phieutgd.png',
        ]);
        // mục lịch sử cũ lưu mã gốc vẫn hợp lệ
        expect(isValidBgImageForType('draw', '/frame/bg_phieutgd.png')).toBe(true);
    });

    it('bgImageUrl: mã gốc → URL theo vite base', () => {
        const B = '/dashboard-ycx/';
        expect(bgImageUrl(DRAW_DMX_DEFAULT_BG, B)).toBe('/dashboard-ycx/frame/bg_phieu.png');
        expect(bgImageUrl(GIO_VANG_DEFAULT_BG, B)).toBe('/dashboard-ycx/frame/GVO2-scaled.png');
        expect(bgImageUrl('/dashboard-ycx/frame/X24.png', B)).toBe('/dashboard-ycx/frame/X24.png'); // đã có tiền tố → không nối 2 lần
        expect(bgImageUrl('/dashboard-ycx/frame/X24.png', '/dashboard-ycx')).toBe('/dashboard-ycx/frame/X24.png'); // base thiếu '/' cuối
        expect(bgImageUrl('/frame/X24.png', '/dashboard-ycx')).toBe('/dashboard-ycx/frame/X24.png');
        expect(bgImageUrl('/frame/X24.png', '/')).toBe('/frame/X24.png'); // chạy ở gốc tên miền
    });

    it('bgImageUrl: data:/http(s):/blob:/protocol-relative/rỗng giữ nguyên', () => {
        const B = '/dashboard-ycx/';
        for (const v of ['data:image/png;base64,AAAA', 'https://cdn.example.com/a.png', 'http://x/a.png', 'blob:https://x/1', '//cdn.example.com/a.png', 'frame/a.png']) {
            expect(bgImageUrl(v, B)).toBe(v);
        }
        expect(bgImageUrl('', B)).toBe('');
        expect(bgImageUrl(null, B)).toBe('');
        expect(bgImageUrl(undefined, B)).toBe('');
    });

    it('bgImageUrl mặc định lấy import.meta.env.BASE_URL', () => {
        const base = import.meta.env.BASE_URL;
        expect(bgImageUrl(DRAW_DMX_DEFAULT_BG)).toBe(base === '/' ? '/frame/bg_phieu.png' : `${base.replace(/\/?$/, '/')}frame/bg_phieu.png`);
    });
});
