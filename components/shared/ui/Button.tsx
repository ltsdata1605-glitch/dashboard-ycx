import React from 'react';
import { cn } from './utils';
import { AppIcon } from './icon/AppIcon';
import type { IconName } from './icon/iconRegistry';

// MỘT cn() cho cả bộ thành phần dùng chung (tailwind-merge đã khai token bo góc — xem ./utils). Giữ export cho nơi đang import từ Button.
export { cn };

export type ButtonVariant = 'primary' | 'secondary' | 'tinted' | 'danger' | 'destructive' | 'warning' | 'ghost' | 'outline' | 'success' | 'inline-link' | 'link' | 'toolbar' | 'toggle' | 'tab' | 'cell' | 'row' | 'card' | 'unstyled';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon-inline' | 'icon-xs' | 'icon' | 'none';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** @deprecated Dùng `icon` (tên chức năng trong iconRegistry) — size/khoảng cách tự chuẩn. */
  leftIcon?: React.ReactNode;
  /** @deprecated Dùng `iconRight`. */
  rightIcon?: React.ReactNode;
  /**
   * Icon bên trái theo TÊN CHỨC NĂNG (chuẩn hoá icon 2026-10-02). Nút tự chọn size icon theo
   * `size` của nút (`lg` → icon `lg`, còn lại → `md` 16/18px) và cách chữ đúng 6px (`gap-1.5`).
   */
  icon?: IconName;
  /** Icon bên phải theo tên chức năng (vd `chevronDown` cho nút mở menu). */
  iconRight?: IconName;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      icon,
      iconRight,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isUnstyled = variant === 'unstyled';
    // `link` (2026-10-28): nút dạng liên kết KHÔNG viền, KHÔNG ép màu (lấy màu từ className hoặc kế thừa chữ quanh nó), KHÔNG ép bố cục
    // (không inline-flex/nowrap — link nằm trong dòng chữ vẫn xuống dòng tự nhiên). Khác `inline-link` (ép sky-600 + viền trong suốt)
    // — thử đổi 20 nút liên kết tự vẽ sang `inline-link` phải hoàn lại vì đổi màu link đỏ và làm link trong câu nhích 2px.
    const isLink = variant === 'link';
    // Kiểu theo VAI TRÒ (2026-10-29, chủ dự án "xử lý hết" nút tự vẽ): phần tử bấm được nhưng KHÔNG mang hình nút — ô bảng/đầu cột
    // sắp xếp (`cell`), dòng danh sách/menu (`row`), thẻ chọn (`card`), mục dải tab tự dựng (`tab`). Không ép cỡ/đệm/viền (mật độ bảng 26px, thẻ tự lo bố cục),
    // chỉ chuẩn hoá phần hành vi chung: con trỏ, chuyển màu, vòng focus bàn phím, trạng thái tắt; `card` đang chọn (aria-pressed) có vòng
    // sáng nhẹ. Trước đó các phần tử này là `unstyled` — không ai biết vai trò, mỗi nơi tự chép con trỏ/chuyển màu.
    const isRole = variant === 'cell' || variant === 'row' || variant === 'card' || variant === 'tab';

    // Audit A16 (2026-09-29): `outline-none` mà không có dấu focus thay thế → người dùng bàn phím
    // không biết đang đứng ở nút nào. `focus-visible` CHỈ hiện khi điều hướng bằng bàn phím, không
    // hiện khi chạm/bấm chuột → giao diện thường ngày không đổi.
    // `outline-solid` bắt buộc: ở Tailwind 4, `outline-none` đặt --tw-outline-style: none và
    // `outline-2` dùng lại chính biến đó → không có nó thì viền vẫn vô hình (đã đo trong test).
    const focusRing = 'focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500';
    const baseStyles = isUnstyled || isLink || isRole
      ? `outline-none ${focusRing} disabled:opacity-50 disabled:cursor-not-allowed`
      : `inline-flex items-center justify-center transition-colors duration-200 outline-none ${focusRing} disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap active:opacity-80`;

    // 5 KIỂU NÚT kiểu Apple (GĐ3 2026-10-11, KE_HOACH_GIAO_DIEN_APPLE.md mục 3.14) — mỗi màn CHỈ MỘT nút `primary`:
    //  primary     sky-600 đặc — hành động chính.
    //  secondary   "tinted" xám: nền slate-100, chữ đậm, KHÔNG viền (trước: trắng viền xám) — Huỷ, hành động phụ.
    //  tinted      nền sky-50, chữ sky-700 — hành động phụ QUAN TRỌNG (vẫn rõ là nút, không tranh với nút chính).
    //  destructive đỏ nhạt (nền rose-50, chữ rose-600) — việc nguy hiểm đặt cuối nhóm; bấm vẫn phải hỏi xác nhận.
    //  danger      đỏ ĐẶC — CHỈ cho nút xác nhận cuối cùng (ConfirmDialog "Xoá").
    //  ghost / outline giữ cho chỗ cũ (nút icon, thanh công cụ dày).
    const variants: Record<ButtonVariant, string> = {
      primary: 'font-semibold bg-sky-600 hover:bg-sky-700 text-white border border-transparent',
      secondary: 'font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-transparent dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
      tinted: 'font-semibold bg-sky-50 hover:bg-sky-100 text-sky-700 border border-transparent',
      danger: 'font-semibold bg-rose-600 hover:bg-rose-700 text-white border border-transparent',
      destructive: 'font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-transparent',
      success: 'font-semibold bg-emerald-600 hover:bg-emerald-700 text-white border border-transparent',
      ghost: 'font-medium bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent',
      outline: 'font-medium bg-transparent text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20',
      'inline-link': 'font-medium bg-transparent text-sky-600 hover:text-sky-700 hover:underline border border-transparent p-0 h-auto min-h-0',
      link: 'bg-transparent underline-offset-2 hover:underline cursor-pointer',
      // `toolbar` (2026-10-28) — "Card Header Action Buttons Standard" (CLAUDE.md): nút icon bật/tắt ở đầu thẻ/bảng (chế độ xem, cột,
      // xuất…). Trạng thái BẬT = `aria-pressed={true}` (trình đọc màn hình đọc được) → nền sky-50, chữ sky-700, viền sky-300, bóng nhẹ;
      // TẮT → chữ slate-400, rê chuột nền slate-100. Trước đó 26 nơi tự chép 2 chuỗi màu này (11 nơi thiếu viền/bóng khi bật). Dùng với
      // `size="icon"` (32 iPhone / 36 laptop theo token).
      toolbar: 'font-medium bg-transparent border border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-100 aria-pressed:bg-sky-50 aria-pressed:text-sky-700 aria-pressed:border-sky-300 aria-pressed:shadow-2xs aria-pressed:font-semibold aria-pressed:hover:bg-sky-50 aria-pressed:hover:text-sky-700',
      // `warning` (2026-10-29): amber ĐẶC — hành động gắn với cảnh báo/tệp YCX (vd "Nhập nhân viên (File YCX)", "Cập nhật" bản lưu đang
      // mở, "Tiếp tục ngay" lượt bị dừng). Amber là màu semantic warning của dự án; trước đó 4 nơi tự tô amber-500/600.
      warning: 'font-semibold bg-amber-500 hover:bg-amber-600 text-white border border-transparent',
      // `toggle` (2026-10-29): viên bật/tắt có chữ (bộ lọc, "Realtime", "Còn lại", ngày trong tuần…). TẮT = nền trắng viền xám; BẬT =
      // `aria-pressed` → sky. Màu BẬT theo nghĩa (amber, emerald…) đè bằng lớp `aria-pressed:*` ở className. Dùng với size xs/sm.
      toggle: 'font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 aria-pressed:bg-sky-50 aria-pressed:border-sky-300 aria-pressed:text-sky-700 aria-pressed:hover:bg-sky-100',
      // `tab`: mục trong dải tab TỰ DỰNG có chỉ báo riêng (gạch chân màu theo tab, nút xoá trong tab, nhãn co theo màn…) — chỗ nào chỉ
      // cần chọn một thì dùng <Tabs>. Màu đang chọn đặt ở className; nên kèm `aria-pressed` để trình đọc màn hình biết tab đang mở.
      tab: 'cursor-pointer select-none whitespace-nowrap transition-colors',
      cell: 'cursor-pointer select-none transition-colors',
      row: 'flex w-full items-center text-left cursor-pointer transition-colors',
      card: 'text-left cursor-pointer transition-[color,background-color,border-color,box-shadow] aria-pressed:ring-2 aria-pressed:ring-sky-500/20',
      unstyled: '',
    };

    // VÙNG CHẠM TRÊN ĐIỆN THOẠI — `min-h-11` (44px) là mức tối thiểu trong Human Interface
    // Guidelines của Apple. Đo thật trên iPhone 15 (2026-09-26) ở Report BI: 20 nút nhỏ hơn 44px,
    // nhỏ nhất chỉ 14px cao. Dùng `min-h`/`min-w` chứ KHÔNG đổi `h`: nhiều nơi tự đè `className="h-8"`,
    // mà theo CSS thì min-height vẫn thắng height — nên các nút đó cũng được chạm đủ rộng mà
    // không phải sửa từng chỗ. Audit 2026-10-07 (GĐ4): điều kiện là màn hẹp <640px HOẶC THIẾT BỊ CẢM
    // ỨNG (`pointer-coarse:`) — trước chỉ có "màn hẹp" nên iPhone xoay ngang (844px) và iPad (768–1024px) trước đây rơi
    // vào cỡ desktop 32–36px. Máy dùng chuột giữ cỡ gọn cũ để không phình thanh công cụ (CLAUDE.md mục 2).
    //
    // CỐ Ý không áp cho `size="none"`: đó là nút tự lo style hoàn toàn (ô trong bảng, nhãn bấm
    // được, icon bọc trong dòng dữ liệu) — ép 44px ở đó sẽ phá vỡ mật độ bảng.
    // Chiều cao lấy từ token --btn-height-* (styles/tokens.css) — MỘT nguồn; `className="h-8"` vẫn đè được (tailwind-merge cùng nhóm h-*).
    const sizes: Record<ButtonSize, string> = {
      // `xs` / `icon-xs` (2026-10-29, chủ dự án duyệt): nút NHỎ trong dòng dữ liệu / đầu thẻ dày đặc — nhìn thấy 24px để dòng 26px của
      // bảng và thẻ không phình (trước đó ~250 nút tự vẽ `p-1`/`text-[11px]` vì cỡ chuẩn nhỏ nhất là 32). Vùng chạm 44 vô hình bằng
      // `ycx-hit` trên màn hẹp/cảm ứng — KHÔNG dùng min-h-11 như sm/md vì sẽ làm dòng phình trên iPhone.
      xs: 'ycx-hit h-[var(--btn-height-xs)] px-2 gap-1 text-[11px] rounded-control',
      sm: 'h-[var(--btn-height-sm)] max-sm:min-h-11 pointer-coarse:min-h-11 px-3 text-xs rounded-control',
      md: 'h-[var(--btn-height-md)] max-sm:min-h-11 pointer-coarse:min-h-11 px-4 text-sm rounded-control',
      lg: 'h-[var(--btn-height-lg)] px-6 text-base rounded-control',
      // Cỡ nút icon: h-8 w-8 gọn gàng, bo 8px (rounded-control) thanh lịch cả trên mobile và desktop (chủ dự án, f0a5558 — bỏ min-44 vì
      // nút phình làm "mobile icon squishing"). GĐ9: giữ ĐÚNG cỡ nhìn thấy đó, chỉ nới vùng chạm vô hình 44×44 bằng `ycx-hit`
      // (styles.css — màn hẹp hoặc cảm ứng), không đổi bố cục. Nút cạnh nhau sát hơn 12px thì vùng chạm chồng nhẹ ở khe.
      icon: 'ycx-hit h-[var(--btn-height-icon)] w-[var(--btn-height-icon)] rounded-control p-0',
      // `icon-inline` (2026-10-29): icon bấm được NẰM TRONG dòng chữ/viên (× bỏ chọn, mũi tên cây, ✓/× khi sửa tên) — cỡ = icon + đệm 2px,
      // không ép chiều cao (24px của icon-xs làm dòng phình). Vùng chạm 44 vô hình bằng ycx-hit.
      'icon-inline': 'ycx-hit inline-flex items-center justify-center shrink-0 rounded-md border-0 p-0.5',
      'icon-xs': 'ycx-hit h-[var(--btn-height-icon-xs)] w-[var(--btn-height-icon-xs)] rounded-control p-0',
      none: '',
    };

    const effectiveSize = isRole ? 'none' : (variant === 'inline-link' || isLink) && size === 'md' ? 'none' : size;
    const iconSize = effectiveSize === 'lg' ? 'lg' : effectiveSize === 'xs' || effectiveSize === 'icon-xs' || effectiveSize === 'icon-inline' ? 'sm' : 'md';
    const hasNamedIcon = Boolean(icon || iconRight);

    return (
      // ĐÂY chính là component <Button> mà quy tắc RULES.md §2.5 yêu cầu mọi nơi khác dùng;
      // nó buộc phải render <button> thật của DOM nên được miễn trừ quy tắc đó.
      // eslint-disable-next-line no-restricted-syntax
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[effectiveSize], hasNamedIcon && 'gap-1.5', className)}
        // Đánh dấu nút CÓ KIỂU CHUẨN (không phải 'unstyled' tự tạo kiểu) — chế độ mật độ gọn của
        // Report BI (features/bi-dashboard/biDensity.css) không thu nhỏ các nút này (audit A20).
        // Nơi gọi được truyền `data-ui` khác (vd Report BI: `data-ui="bi"` — nút chuẩn nhưng vẫn co theo chế độ mật độ gọn).
        data-ui={isUnstyled || isRole ? undefined : 'shared'}
        // Đang tải: báo cho trình đọc màn hình (2026-10-30, CORR-013 của máy Mac — sổ ghi đã sửa nhưng Button.tsx chưa vào commit).
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <AppIcon name="loading" spin size={iconSize} className={hasNamedIcon ? undefined : '-ml-1 mr-2'} />}
        {!isLoading && icon && <AppIcon name={icon} size={iconSize} />}
        {!isLoading && leftIcon && <span className="mr-2 -ml-1 shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 -mr-1 shrink-0">{rightIcon}</span>}
        {!isLoading && iconRight && <AppIcon name={iconRight} size={iconSize} />}
      </button>
    );
  }
);

Button.displayName = 'Button';
