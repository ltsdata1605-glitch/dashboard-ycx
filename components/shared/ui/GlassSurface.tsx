import React from 'react';
import { cn } from './utils';

/**
 * GlassSurface — bề mặt LIQUID GLASS dùng chung (Apple Design System V2, 2026-10-28).
 *
 * Một nguồn duy nhất cho lớp điều khiển nổi: thanh tab nổi iPhone (viên thuốc + nút tròn tách riêng), dock laptop, cụm con nhộng,
 * thanh công cụ nổi. Giá trị ở `styles/tokens.css` (--glass-*), lớp `.ycx-glass` ở `styles.css` — có sẵn đường lùi khi trình duyệt
 * không hỗ trợ backdrop-filter, người dùng bật Giảm độ trong suốt / Tăng tương phản, hoặc khi in.
 *
 * KHÔNG dùng cho bảng số liệu, thẻ KPI, biểu đồ, form dài — kính làm chữ dày khó đọc (DESIGN_SYSTEM.md mục 8).
 * Mục bấm được bên trong: thêm lớp `ycx-glass-item` + `aria-current="page"` / `aria-pressed` → viên chọn xám kiểu iOS tự hiện.
 */
export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLElement> {
    /** Thẻ HTML gốc — `nav` cho thanh điều hướng, `div` (mặc định) cho cụm nút. */
    as?: 'div' | 'nav' | 'section' | 'aside';
    /** `capsule` viên thuốc (rounded-full) · `circle` nút tròn rời · `panel` khối bo `rounded-card`. */
    shape?: 'capsule' | 'circle' | 'panel';
    /** Bóng: `md` cho lớp nổi giữa nội dung (thanh tab, dock), `sm` cho cụm nằm trong thanh. */
    elevation?: 'sm' | 'md';
    /** `strong` = kính dày hơn (nhiều chữ nhỏ bên trong). */
    tone?: 'default' | 'strong';
}

const SHAPE: Record<NonNullable<GlassSurfaceProps['shape']>, string> = {
    capsule: 'rounded-full',
    circle: 'rounded-full aspect-square',
    panel: 'rounded-card',
};

export const GlassSurface = React.forwardRef<HTMLElement, GlassSurfaceProps>(
    ({ as = 'div', shape = 'capsule', elevation = 'md', tone = 'default', className, children, ...rest }, ref) => {
        const Tag = as as React.ElementType;
        return (
            <Tag
                ref={ref}
                data-glass={shape}
                data-glass-elevation={elevation}
                data-glass-tone={tone === 'strong' ? 'strong' : undefined}
                className={cn('ycx-glass', SHAPE[shape], className)}
                {...rest}
            >
                {children}
            </Tag>
        );
    }
);
GlassSurface.displayName = 'GlassSurface';

export default GlassSurface;
