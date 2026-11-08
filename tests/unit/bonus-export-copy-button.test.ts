import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ExportButton from '../../features/bi-dashboard/components/ExportButton';

vi.mock('../../components/shared/ui/imageDelivery', () => ({
    copyBlobToClipboard: vi.fn(async () => true),
    deliverImage: vi.fn(),
}));

vi.mock('../../components/shared/ui/toast', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('ExportButton with CopyImageButton', () => {
    it('renders CopyImageButton beside the ExportButton when onCopyImage is provided', () => {
        const onExport = vi.fn();
        const onCopy = vi.fn();

        const html = renderToStaticMarkup(
            React.createElement(ExportButton, {
                onExportPNG: onExport,
                onCopyImage: onCopy,
                title: 'Xuất ảnh báo cáo (PNG)',
            })
        );

        // Nút xuất ảnh
        expect(html).toContain('export-button-component');
        expect(html).toContain('title="Xuất ảnh báo cáo (PNG)"');

        // Nút copy ảnh
        expect(html).toContain('copy-image-button-component');
        expect(html).toContain('title="Sao chép ảnh vào bộ nhớ tạm"');
    });

    it('renders CopyImageButton when targetRef is provided even if onCopyImage is omitted', () => {
        const fakeRef = { current: null };

        const html = renderToStaticMarkup(
            React.createElement(ExportButton, {
                onExportPNG: vi.fn(),
                targetRef: fakeRef as any,
                title: 'Xuất ảnh báo cáo',
            })
        );

        expect(html).toContain('copy-image-button-component');
    });

    it('does not render CopyImageButton when hideCopyButton is true', () => {
        const html = renderToStaticMarkup(
            React.createElement(ExportButton, {
                onExportPNG: vi.fn(),
                onCopyImage: vi.fn(),
                hideCopyButton: true,
            })
        );

        expect(html).not.toContain('copy-image-button-component');
    });
});
