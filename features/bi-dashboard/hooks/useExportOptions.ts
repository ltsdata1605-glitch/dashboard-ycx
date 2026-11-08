import { useState, useCallback } from 'react';
import { downloadBlob, shareBlob, canShareFiles, copyBlobToClipboard } from '../services/uiService';
import { toast } from '../../../components/shared/ui/toast';

export interface PendingExport {
    blob: Blob;
    filename: string;
    resolve: (action: 'download' | 'share' | 'cancel' | 'copy') => void;
}

export function useExportOptions() {
    const [pendingExport, setPendingExport] = useState<PendingExport | null>(null);

    const showExportOptions = useCallback(async (blob: Blob, filename: string): Promise<'download' | 'share' | 'cancel' | 'copy'> => {
        // Bypass modal on desktop and directly download. Check for touch/mobile specifically.
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
        if (!isMobile) {
            downloadBlob(blob, filename);
            return Promise.resolve('download');
        }

        await shareBlob(blob, filename);
        return 'share';
    }, []);

    const handleDownload = useCallback(() => {
        if (pendingExport) {
            downloadBlob(pendingExport.blob, pendingExport.filename);
            pendingExport.resolve('download');
            setPendingExport(null);
        }
    }, [pendingExport]);

    const handleShare = useCallback(async () => {
        if (pendingExport) {
            await shareBlob(pendingExport.blob, pendingExport.filename);
            pendingExport.resolve('share');
            setPendingExport(null);
        }
    }, [pendingExport]);

    const handleCopy = useCallback(async () => {
        if (pendingExport) {
            const ok = await copyBlobToClipboard(pendingExport.blob);
            if (ok) toast.success('Đã sao chép ảnh vào bộ nhớ tạm (có thể dán trực tiếp)!', { id: 'copy-image-status', duration: 3500 });
            else toast.error('Trình duyệt chưa hỗ trợ sao chép ảnh trực tiếp', { id: 'copy-image-status' });
            pendingExport.resolve('copy');
            setPendingExport(null);
        }
    }, [pendingExport]);

    const handleClose = useCallback(() => {
        if (pendingExport) {
            pendingExport.resolve('cancel');
            setPendingExport(null);
        }
    }, [pendingExport]);

    return {
        pendingExport,
        showExportOptions,
        handleDownload,
        handleShare,
        handleCopy,
        handleClose,
        canShare: canShareFiles(),
    };
}
