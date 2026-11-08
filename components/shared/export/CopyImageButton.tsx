import React, { useState } from 'react';
import { AppIcon } from '../ui/icon/AppIcon';
import { Button, cn } from '../ui/Button';
import { copyBlobToClipboard } from '../ui/imageDelivery';
import { toast } from '../ui/toast';
import { exportElementAsImage, type ExportImageOptions } from './captureEngine';

export interface CopyImageButtonProps {
    /** Trực tiếp truyền hàm xử lý copy ảnh */
    onCopy?: () => Promise<void | boolean>;
    /** Hoặc truyền hàm lấy Blob ảnh */
    onGetBlob?: () => Promise<Blob | null>;
    /** Hoặc truyền Ref phần tử DOM cần chụp */
    targetRef?: React.RefObject<HTMLElement | null>;
    /** Hoặc truyền hàm lấy phần tử DOM cần chụp */
    getTarget?: () => HTMLElement | null;
    /** Tên gợi ý file ảnh khi chụp */
    filename?: string;
    /** Tuỳ chọn chụp ảnh */
    options?: ExportImageOptions;
    disabled?: boolean;
    className?: string;
    size?: 'icon' | 'icon-xs' | 'icon-inline' | 'sm';
    variant?: 'ghost' | 'toolbar';
    dataUi?: string;
    title?: string;
    ariaLabel?: string;
}

/**
 * Nút sao chép ảnh báo cáo trực tiếp vào Clipboard (Bộ nhớ tạm).
 * Tuân thủ chuẩn Apple Design System V2 & Card Header Action Buttons Standard.
 */
export const CopyImageButton: React.FC<CopyImageButtonProps> = ({
    onCopy,
    onGetBlob,
    targetRef,
    getTarget,
    filename = 'anh-bao-cao.png',
    options,
    disabled = false,
    className,
    size = 'icon',
    variant = 'toolbar',
    dataUi,
    title = 'Sao chép ảnh vào bộ nhớ tạm (dán trực tiếp)',
    ariaLabel = 'Sao chép ảnh',
}) => {
    const [isCopying, setIsCopying] = useState(false);

    const handleCopy = async (e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
        }
        if (disabled || isCopying) return;

        setIsCopying(true);
        try {
            if (onCopy) {
                await onCopy();
                return;
            }

            let blob: Blob | null = null;
            if (onGetBlob) {
                blob = await onGetBlob();
            } else {
                const el = targetRef?.current || (getTarget ? getTarget() : null);
                if (!el) {
                    toast.error('Không tìm thấy vùng dữ liệu để sao chép ảnh', { id: 'copy-image-status' });
                    return;
                }
                blob = await exportElementAsImage(el, filename, {
                    ...options,
                    mode: 'blob-only',
                    elementsToHide: options?.elementsToHide || ['.hide-on-export', '.no-print', '.export-button-component'],
                });
            }

            if (!blob) {
                toast.error('Không thể tạo ảnh để sao chép', { id: 'copy-image-status' });
                return;
            }

            const copied = await copyBlobToClipboard(blob);
            if (copied) {
                toast.success('Đã sao chép ảnh vào bộ nhớ tạm (có thể dán trực tiếp)!', {
                    id: 'copy-image-status',
                    duration: 3500,
                });
            } else {
                toast.error('Trình duyệt chưa hỗ trợ sao chép ảnh trực tiếp vào bộ nhớ tạm', { id: 'copy-image-status' });
            }
        } catch (err) {
            console.error('[CopyImageButton] Lỗi khi sao chép ảnh:', err);
            toast.error('Lỗi khi sao chép ảnh', { id: 'copy-image-status' });
        } finally {
            setIsCopying(false);
        }
    };

    const iconSize = size === 'icon-xs' ? 'xs' : 'md';

    return (
        <Button
            type="button"
            variant={variant}
            size={size}
            data-ui={dataUi}
            onClick={handleCopy}
            disabled={disabled || isCopying}
            className={cn(
                'ycx-hit copy-image-button-component preserve-rounded active:scale-[0.94] disabled:opacity-40 shrink-0',
                className
            )}
            title={title}
            aria-label={ariaLabel}
        >
            {isCopying ? (
                <AppIcon name="loading" spin size={iconSize} className="text-sky-500" />
            ) : (
                <AppIcon name="copyImage" size={iconSize} />
            )}
        </Button>
    );
};

