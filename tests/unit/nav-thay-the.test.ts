import { describe, expect, it } from 'vitest';
import { chonThayThe } from '../../components/layout/navThayThe';

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
