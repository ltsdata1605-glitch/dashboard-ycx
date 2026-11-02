import { describe, expect, it } from 'vitest';
import { cungNoiDungCauHinh, fromCloudProductConfig, isProductConfigComplete, toCloudProductConfig } from '../../services/productConfigSerialization';
import type { ProductConfig } from '../../types';

// productConfig qua Firestore (2026-09-28): Firestore biến Set thành {} — code cũ chỉ đổi `groups`, làm
// mất 2 tập hình thức xuất (835 + 1062 mục trên dữ liệu thật) → máy mới tính DTQĐ/đơn quá hạn sai.
const cauHinh = (): ProductConfig => ({
    groups: { ICT: new Set(['Laptop', 'Tablet']) },
    subgroups: {}, childToParentMap: {}, childToSubgroupMap: {}, quantityMultiplierMap: { A: 2 },
    revenueEligibleHTX: new Set(['xuat ban', 'tra gop']),
    nonRevenueEligibleHTX: new Set(['xuat doi']),
});
/** Giả lập đúng cách Firestore/JSON đối xử với Set. */
const quaFirestore = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

describe('productConfig qua Cloud', () => {
    it('mã CŨ (chỉ đổi groups) làm mất 2 tập hình thức xuất — điều kiện tái hiện lỗi', () => {
        const c = cauHinh();
        const cu = quaFirestore({ ...c, groups: { ICT: Array.from(c.groups.ICT) } });
        expect(cu.revenueEligibleHTX).toEqual({});
    });
    it('toCloud → Firestore → fromCloud giữ nguyên mọi Set', () => {
        const ve = fromCloudProductConfig(quaFirestore(toCloudProductConfig(cauHinh())));
        expect(ve.groups.ICT).toEqual(new Set(['Laptop', 'Tablet']));
        expect(ve.revenueEligibleHTX).toEqual(new Set(['xuat ban', 'tra gop']));
        expect(ve.nonRevenueEligibleHTX).toEqual(new Set(['xuat doi']));
        expect(ve.quantityMultiplierMap).toEqual({ A: 2 });
        expect(isProductConfigComplete(ve)).toBe(true);
    });
    it('toCloud không đụng tới object gốc', () => {
        const c = cauHinh();
        toCloudProductConfig(c);
        expect(c.revenueEligibleHTX).toBeInstanceOf(Set);
    });
    it('bản Cloud không có HTX → tự động bù tập HTX mặc định để tính số', () => {
        const hong = { ...toCloudProductConfig(cauHinh()), revenueEligibleHTX: {}, nonRevenueEligibleHTX: {} };
        const ve = fromCloudProductConfig(quaFirestore(hong));
        expect(ve.revenueEligibleHTX?.size).toBeGreaterThan(0);
        expect(isProductConfigComplete(ve)).toBe(true);
    });
    it('bản Cloud bị phân loại nhầm HTX bán hàng sang nonRevenueEligibleHTX → tự động sửa đưa sang revenueEligibleHTX', () => {
        const configLoi = {
            ...toCloudProductConfig(cauHinh()),
            revenueEligibleHTX: ['Bán lẻ', 'Xuất bán lẻ'],
            nonRevenueEligibleHTX: ['xuất bán hàng tại siêu thị', 'xuất bán hàng trả góp tại siêu thị', 'xuất dịch vụ thu hộ payoo']
        };
        const ve = fromCloudProductConfig(quaFirestore(configLoi));
        expect(ve.revenueEligibleHTX?.has('xuất bán hàng tại siêu thị')).toBe(true);
        expect(ve.revenueEligibleHTX?.has('xuất bán hàng trả góp tại siêu thị')).toBe(true);
        expect(ve.nonRevenueEligibleHTX?.has('xuất bán hàng tại siêu thị')).toBe(false);
        expect(ve.nonRevenueEligibleHTX?.has('xuất dịch vụ thu hộ payoo')).toBe(true);
        expect(ve.htxClassification?.['xuất bán hàng trả góp tại siêu thị']).toBe('tra_gop');
    });
    it('không có groups → không dùng được', () => {
        expect(isProductConfigComplete({ ...cauHinh(), groups: {} })).toBe(false);
        expect(isProductConfigComplete(null)).toBe(false);
    });
});

// Máy mới đăng nhập (2026-10-27): bản dự phòng users/{uid}/configs/productConfig "mới hơn" bản chung vừa tải chỉ vì được
// chép lại SAU — cùng nội dung thì chỉ chỉnh mốc, không ghi đè/xử lý lại. Hàm so phải bỏ qua dạng lưu, chỉ nhìn nội dung.
describe('cungNoiDungCauHinh', () => {
    /** Bản chung đúng như getGlobalProductConfig() trả về (đã qua fromCloud → đã chuẩn hoá HTX). */
    const banChung = (c: ProductConfig) => fromCloudProductConfig(quaFirestore(toCloudProductConfig(c)));
    /** Dạng lưu trên máy (saveProductConfig*): groups thành mảng, 2 tập HTX vẫn là Set. */
    const dangMay = (c: ProductConfig) => ({ ...c, groups: Object.fromEntries(Object.entries(c.groups).map(([k, v]) => [k, Array.from(v)])) });
    /** Máy khác đẩy bản trên máy lên bản dự phòng (undefined → null) rồi máy này kéo về (fromCloud → Set). */
    const quaBanDuPhong = (mayKhac: object) => fromCloudProductConfig(JSON.parse(JSON.stringify(toCloudProductConfig(mayKhac), (_k, v) => v === undefined ? null : v)));
    const coKhoaLonXon = (): ProductConfig => ({ ...cauHinh(), vasMultiplierMap: undefined, childToParentMap: { b: 'B', a: 'A' } });

    it('bản trên máy (mảng) và bản dự phòng kéo về (Set) cùng nội dung → giống', () => {
        expect(cungNoiDungCauHinh(dangMay(banChung(coKhoaLonXon())), quaBanDuPhong(dangMay(banChung(coKhoaLonXon()))))).toBe(true);
    });
    it('khác thứ tự khoá (Firestore trả map xếp a→z) → vẫn giống', () => {
        const a = { ...cauHinh(), childToParentMap: { z: '1', a: '2' } };
        const b = { ...cauHinh(), childToParentMap: { a: '2', z: '1' } };
        expect(cungNoiDungCauHinh(a, b)).toBe(true);
    });
    it('khác MỘT hệ số / thêm một nhóm hàng / thêm một hình thức xuất → khác (phải lấy bản Cloud về)', () => {
        expect(cungNoiDungCauHinh(cauHinh(), { ...cauHinh(), quantityMultiplierMap: { A: 3 } })).toBe(false);
        const them = cauHinh();
        them.groups.ICT.add('PC');
        expect(cungNoiDungCauHinh(dangMay(banChung(cauHinh())), quaBanDuPhong(dangMay(banChung(them))))).toBe(false);
        expect(cungNoiDungCauHinh(cauHinh(), { ...cauHinh(), nonRevenueEligibleHTX: new Set(['xuat doi', 'xuat huy']) })).toBe(false);
    });
    it('thiếu một bên → không coi là giống', () => {
        expect(cungNoiDungCauHinh(null, cauHinh())).toBe(false);
        expect(cungNoiDungCauHinh(cauHinh(), undefined)).toBe(false);
    });
    it('không sửa object gốc', () => {
        const c = cauHinh();
        const truoc = JSON.stringify(dangMay(c));
        cungNoiDungCauHinh(c, quaBanDuPhong(dangMay(banChung(cauHinh()))));
        expect(c.groups.ICT).toBeInstanceOf(Set);
        expect(JSON.stringify(dangMay(c))).toBe(truoc);
    });
});
