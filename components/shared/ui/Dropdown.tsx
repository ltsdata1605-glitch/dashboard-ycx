import React, { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';
import { cn, onActivateKey } from './utils';
import { AppIcon } from './icon/AppIcon';
import { Button } from './Button';

/* ─── Dropdown ─── */

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  /** Mục đang được chọn (menu kiểu "chọn 1 trong N chế độ") — tô nền sky nhạt + chữ đậm. */
  active?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  onSelect: (id: string) => void;
  /** Alignment relative to trigger */
  align?: 'left' | 'right';
  /** Width of dropdown panel */
  width?: 'auto' | 'trigger' | string;
  /** Định vị fixed để thoát overflow của card; ancestor không được tạo fixed containing block (transform/contain). */
  escapeClipping?: boolean;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  onSelect,
  align = 'left',
  width = 'auto',
  escapeClipping = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [floatingPosition, setFloatingPosition] = useState<{left:number;top:number;width?:string}>({left:-9999,top:-9999});

  useLayoutEffect(() => {
    if (!isOpen || !escapeClipping) return;
    const place = () => {
      const container = containerRef.current;
      const panel = panelRef.current;
      if (!container || !panel) return;
      const trigger = container.getBoundingClientRect();
      const requestedWidth = width === 'auto' ? '' : width === 'trigger' ? `${trigger.width}px`
        : /^\d+(?:\.\d+)?%$/.test(width) ? `${trigger.width * parseFloat(width) / 100}px` : width;
      panel.style.width = requestedWidth;
      const w = panel.offsetWidth, h = panel.offsetHeight;
      const vw = document.documentElement.clientWidth, vh = window.innerHeight;
      const left = Math.max(8, Math.min(align === 'right' ? trigger.right - w : trigger.left, vw - w - 8));
      const below = trigger.bottom + 6, above = trigger.top - h - 6;
      const top = below + h <= vh - 8 ? below : above >= 8 ? above : Math.max(8, vh - h - 8);
      setFloatingPosition(previous => previous.left === left && previous.top === top && previous.width === requestedWidth
        ? previous : {left,top,width:requestedWidth});
    };
    place();
    const observer = new ResizeObserver(place);
    if (containerRef.current) observer.observe(containerRef.current);
    if (panelRef.current) observer.observe(panelRef.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [isOpen, escapeClipping, width, align]);

  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  const close = useCallback(() => setIsOpen(false), []);
  const restoreTriggerFocus = useCallback(() => {
    containerRef.current?.querySelector<HTMLElement>('[data-dropdown-trigger]')?.focus({ preventScroll: true });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // preventDefault: Escape chỉ đóng menu này, không đóng luôn Modal chứa nó (Modal bỏ qua phím
      // Escape đã bị xử lý). Trả focus về nút mở menu cho người dùng bàn phím (audit A15).
      e.preventDefault();
      close();
      restoreTriggerFocus();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, close, restoreTriggerFocus]);

  const handleSelect = useCallback((item: DropdownItem) => {
    if (item.disabled || item.divider) return;
    onSelect(item.id);
    close();
    // Panel bị unmount sau chọn mục; trả focus về trigger thay vì rơi xuống body.
    restoreTriggerFocus();
  }, [onSelect, close, restoreTriggerFocus]);

  // Mũi tên ↑/↓ đi giữa các mục (audit A15): trước đây chỉ có Tab, menu dài phải Tab qua từng mục.
  const handlePanelKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
    if (buttons.length === 0) return;
    e.preventDefault();
    const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next = 0;
    if (e.key === 'End') next = buttons.length - 1;
    else if (e.key === 'ArrowDown') next = idx < 0 ? 0 : (idx + 1) % buttons.length;
    else if (e.key === 'ArrowUp') next = idx < 0 ? buttons.length - 1 : (idx - 1 + buttons.length) % buttons.length;
    buttons[next].focus();
  }, []);

  // Mở bằng bàn phím (↓ trên nút mở) → focus mục đang chọn hoặc mục đầu.
  const handleTriggerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      requestAnimationFrame(() => {
        const panel = containerRef.current?.querySelector<HTMLElement>('[data-dropdown-panel]');
        const target = panel?.querySelector<HTMLButtonElement>('button[aria-current="true"]:not([disabled])')
          ?? panel?.querySelector<HTMLButtonElement>('button:not([disabled])');
        target?.focus();
      });
      return;
    }
    onActivateKey(toggle)(e);
  }, [toggle]);

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        data-dropdown-trigger=""
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={toggle}
        onKeyDown={handleTriggerKeyDown}
        // ycx-hit: trigger chỉ có icon (vd "Chế độ xem" 32px ở Report BI › Thưởng) vẫn đủ vùng chạm 44 trên màn hẹp/cảm ứng (GĐ9).
        className="ycx-hit cursor-pointer"
      >
        {trigger}
      </div>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          data-dropdown-panel=""
          onKeyDown={handlePanelKeyDown}
          className={cn(
            'z-[var(--p-z-dropdown)]',
            escapeClipping ? 'fixed max-w-[calc(100vw-1rem)]' : 'absolute top-full mt-1.5',
            'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
            'rounded-popup shadow-lg overflow-hidden',
            'animate-fade-in',
            !escapeClipping && (align === 'right' ? 'right-0' : 'left-0'),
            width === 'auto' ? 'min-w-[180px]' : !escapeClipping && width === 'trigger' ? 'w-full' : ''
          )}
          style={escapeClipping ? floatingPosition : width !== 'auto' && width !== 'trigger' ? { width } : undefined}
        >
          <div className="py-1 max-h-[280px] overflow-y-auto custom-scrollbar">
            {items.map((item, idx) => {
              if (item.divider) {
                return <div key={`d-${idx}`} className="h-px bg-slate-100 dark:bg-slate-700 my-1" />;
              }
              return (
                <Button
                  variant="row" size="none"
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  disabled={item.disabled}
                  aria-current={item.active ? 'true' : undefined}
                  className={cn(
                    'justify-start gap-2.5 px-3 py-2 text-sm',
                    item.danger
                      ? 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                      : item.active
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50',
                    item.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  {item.icon && <span className="shrink-0 w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

Dropdown.displayName = 'Dropdown';

/* ─── Simple DropdownButton trigger ─── */

export interface DropdownButtonProps {
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({ label, icon, className }) => (
  <Button
    variant="secondary" size="md"
    className={cn(
      'gap-1.5 px-3 font-medium',
      'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
      'rounded-control shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700',
      'text-slate-700 dark:text-slate-300 transition-colors',
      className
    )}
  >
    {icon && <span className="shrink-0">{icon}</span>}
    <span className="truncate">{label}</span>
    <AppIcon name="chevronDown" size="sm" className="text-slate-400" />
  </Button>
);

DropdownButton.displayName = 'DropdownButton';
