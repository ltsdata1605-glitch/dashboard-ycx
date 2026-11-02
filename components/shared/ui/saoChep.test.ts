import { beforeEach, describe, expect, it, vi } from 'vitest';

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('./toast', () => ({ toast: toastMock }));

import { CHO_CLIPBOARD_MS, ghiClipboard, saoChep, type MoiTruongSaoChep } from './saoChep';

/** Document giả tối thiểu cho nhánh dự phòng execCommand('copy'). */
function taoDocument(copyDuoc: boolean) {
    const daChep: string[] = [];
    let oHienTai: { value: string } | null = null;
    const doc = {
        body: { appendChild: vi.fn((o: { value: string }) => { oHienTai = o; }) },
        createElement: vi.fn(() => {
            const o = {
                value: '', style: {} as Record<string, string>,
                setAttribute: vi.fn(), select: vi.fn(), setSelectionRange: vi.fn(), remove: vi.fn(),
            };
            return o;
        }),
        execCommand: vi.fn((lenh: string) => {
            if (lenh === 'copy' && copyDuoc && oHienTai) daChep.push(oHienTai.value);
            return copyDuoc;
        }),
    };
    return { doc: doc as unknown as Document, daChep, execCommand: doc.execCommand };
}

describe('ghiClipboard', () => {
    it('Clipboard API ghi được → true, không đụng cách cũ', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        const { doc, execCommand } = taoDocument(true);
        expect(await ghiClipboard('SO002', { clipboard: { writeText }, document: doc })).toBe(true);
        expect(writeText).toHaveBeenCalledWith('SO002');
        expect(execCommand).not.toHaveBeenCalled();
    });

    it('Clipboard API bị từ chối → dự phòng execCommand("copy") chép đúng chữ', async () => {
        const writeText = vi.fn().mockRejectedValue(new DOMException('Write permission denied', 'NotAllowedError'));
        const { doc, daChep } = taoDocument(true);
        expect(await ghiClipboard('SO002', { clipboard: { writeText }, document: doc })).toBe(true);
        expect(daChep).toEqual(['SO002']);
    });

    it('trình duyệt không có navigator.clipboard → vẫn chép bằng cách cũ, không ném lỗi', async () => {
        const { doc, daChep } = taoDocument(true);
        expect(await ghiClipboard('SO003', { clipboard: undefined, document: doc })).toBe(true);
        expect(daChep).toEqual(['SO003']);
    });

    it('cả hai cách đều hỏng → false, không ném lỗi', async () => {
        const writeText = vi.fn().mockRejectedValue(new Error('denied'));
        const { doc } = taoDocument(false);
        await expect(ghiClipboard('SO002', { clipboard: { writeText }, document: doc })).resolves.toBe(false);
    });

    it('Clipboard API TREO → quá hạn thì chuyển sang cách cũ', async () => {
        vi.useFakeTimers();
        try {
            const writeText = vi.fn(() => new Promise<void>(() => { /* không bao giờ xong */ }));
            const { doc, daChep } = taoDocument(true);
            const p = ghiClipboard('SO004', { clipboard: { writeText }, document: doc });
            await vi.advanceTimersByTimeAsync(CHO_CLIPBOARD_MS + 10);
            expect(await p).toBe(true);
            expect(daChep).toEqual(['SO004']);
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('saoChep — luôn báo kết quả', () => {
    beforeEach(() => { toastMock.success.mockClear(); toastMock.error.mockClear(); });

    it('chép được → toast thành công đúng chữ, id mặc định sao-chep', async () => {
        const moiTruong: MoiTruongSaoChep = { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }, document: taoDocument(true).doc };
        expect(await saoChep('SO002', { thanhCong: 'Đã sao chép: SO002' }, moiTruong)).toBe(true);
        expect(toastMock.success).toHaveBeenCalledWith('Đã sao chép: SO002', { id: 'sao-chep' });
        expect(toastMock.error).not.toHaveBeenCalled();
    });

    it('hỏng → toast LỖI kèm nội dung ngắn để chép tay (trước đây: im lặng)', async () => {
        const moiTruong: MoiTruongSaoChep = { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) }, document: taoDocument(false).doc };
        expect(await saoChep('SO002', { thanhCong: 'Đã sao chép: SO002' }, moiTruong)).toBe(false);
        expect(toastMock.success).not.toHaveBeenCalled();
        expect(toastMock.error).toHaveBeenCalledTimes(1);
        const [tieuDe, tuyChon] = toastMock.error.mock.calls[0];
        expect(tieuDe).toBe('Không sao chép được');
        expect(String(tuyChon.description)).toContain('SO002');
    });

    it('nội dung dài (danh sách nhân viên) hỏng → toast lỗi không nhồi cả danh sách', async () => {
        const dai = Array.from({ length: 30 }, (_, i) => `NV${i}`).join('\n');
        const moiTruong: MoiTruongSaoChep = { clipboard: null, document: taoDocument(false).doc };
        await saoChep(dai, { thanhCong: 'ok', id: 'ds-nv' }, moiTruong);
        const [, tuyChon] = toastMock.error.mock.calls[0];
        expect(tuyChon.id).toBe('ds-nv');
        expect(String(tuyChon.description)).not.toContain('NV29');
    });
});
