import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../components/shared/ui/toast', () => ({ toast: { info: vi.fn(), error: vi.fn() } }));

import { generatePriceTagHTML, type PrintSettings } from './printService';
import type { Product } from '../types';

/**
 * Tem kiểu "modern" (2026-10-29): trước đây LUÔN in tên NV + số thưởng ở góc tem, bỏ qua 2 công tắc "Hiện tên NV"/"Hiện thưởng"
 * (kiểu mặc định thì tôn trọng). Tem treo cho khách xem → tắt "Hiện thưởng" mà vẫn in thưởng là lộ thông tin nội bộ.
 */
const sp: Product = {
    msp: '123', sanPham: 'Tủ lạnh Toshiba', thuongERP: 0, thuongNong: 0, tongThuong: 87_000,
    giaGoc: '10.990.000', giaGiam: '8.990.000', khuyenMai: '', ngayIn: '', selected: true, quantity: 1,
};
const caiDat = (kieu: PrintSettings['stickerStyle'], showBonus: boolean, showEmployeeName: boolean): PrintSettings => ({
    showOriginalPrice: true, showPromotion: true, showBonus, showQrCode: false, showEmployeeName,
    tagsPerPage: 4, shortenPrice: false, sortByName: false, stickerStyle: kieu,
});
const NV = '1234 - Nguyễn Văn An';

describe('tem in — công tắc Hiện thưởng / Hiện tên NV', () => {
    for (const kieu of ['modern', 'default'] as const) {
        it(`${kieu}: tắt cả hai → không in số thưởng (87) lẫn tên NV`, () => {
            const html = generatePriceTagHTML(sp, NV, caiDat(kieu, false, false), '');
            expect(html).not.toMatch(/\b87\b/);
            expect(html).not.toContain('1234 -');
        });
        it(`${kieu}: bật cả hai → có số thưởng và mã NV`, () => {
            const html = generatePriceTagHTML(sp, NV, caiDat(kieu, true, true), '');
            expect(html).toMatch(/\b87\b/);
            expect(html).toContain('1234 -');
        });
    }
});
