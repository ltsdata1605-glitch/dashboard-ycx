import React, { useState, useRef, useCallback, useEffect, useId, useLayoutEffect } from 'react';
import { cn } from './utils';

/* ─── Tooltip ─── */

export interface TooltipProps {
  /** Nội dung mô tả không tương tác; không đặt link/button vào tooltip. */
  content: React.ReactNode;
  /** Tooltip placement */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Delay before showing (ms) */
  delay?: number;
  /** Một trigger focusable, chuyển tiếp aria-describedby tới DOM (vd Button). */
  children: React.ReactElement;
  className?: string;
  /** Disable tooltip */
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  side = 'top',
  delay = 200,
  children,
  className,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{left: number; top: number; side: NonNullable<TooltipProps['side']>; arrow: number} | null>(null);
  const focusedRef = useRef(false);
  const hoveredRef = useRef(false);

  const show = useCallback(() => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setIsVisible(true);
    }, delay);
  }, [delay, disabled]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setIsVisible(false);
  }, []);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide();
    };
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('keydown', onEscape);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [hide]);

  useEffect(() => {
    if (disabled) hide();
  }, [disabled, hide]);

  const visible = isVisible && !disabled && Boolean(content);
  const trigger = children as React.ReactElement<{ 'aria-describedby'?: string }>;
  const describedBy = [trigger.props['aria-describedby'], visible ? tooltipId : undefined].filter(Boolean).join(' ') || undefined;

  // Cùng nguyên tắc đo/lật/clamp như ActionMenu; giữ panel là con của trigger để hover liên tục.
  useLayoutEffect(() => {
    if (!visible) return;
    const place = () => {
      const wrapper = triggerRef.current;
      const panel = panelRef.current;
      if (!wrapper || !panel) return;
      const rect = wrapper.getBoundingClientRect();
      const width = panel.offsetWidth, height = panel.offsetHeight;
      const vw = document.documentElement.clientWidth, vh = window.innerHeight;
      const gap = 8, inset = 8;
      const room = {top: rect.top - inset, bottom: vh - rect.bottom - inset, left: rect.left - inset, right: vw - rect.right - inset};
      const opposite = {top:'bottom', bottom:'top', left:'right', right:'left'} as const;
      const candidates = [side, opposite[side], 'top', 'bottom', 'left', 'right'] as const;
      const resolved = candidates.find(candidate => room[candidate] >= (candidate === 'top' || candidate === 'bottom' ? height : width) + gap)
        ?? (room[opposite[side]] > room[side] ? opposite[side] : side);
      let left = rect.left + (rect.width - width) / 2;
      let top = rect.top + (rect.height - height) / 2;
      if (resolved === 'top') top = rect.top - height - gap;
      if (resolved === 'bottom') top = rect.bottom + gap;
      if (resolved === 'left') left = rect.left - width - gap;
      if (resolved === 'right') left = rect.right + gap;
      left = Math.max(inset, Math.min(left, vw - width - inset));
      top = Math.max(inset, Math.min(top, vh - height - inset));
      const vertical = resolved === 'top' || resolved === 'bottom';
      const center = vertical ? rect.left + rect.width / 2 - left : rect.top + rect.height / 2 - top;
      const arrow = Math.max(8, Math.min(center, (vertical ? width : height) - 8));
      const next = {left: left - rect.left, top: top - rect.top, side: resolved, arrow};
      setPosition(previous => previous && previous.left === next.left && previous.top === next.top && previous.side === next.side && previous.arrow === next.arrow ? previous : next);
    };
    place();
    const observer = new ResizeObserver(place);
    if (triggerRef.current) observer.observe(triggerRef.current);
    if (panelRef.current) observer.observe(panelRef.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [visible, side, content]);
  const resolvedSide = position?.side ?? side;

  // Nối khoảng cách 8px với trigger để con trỏ đi vào tooltip không phát mouseleave.
  // Pseudo-element trong suốt không đổi kích thước hoặc vị trí nhìn thấy của tooltip.
  const hoverBridgeClasses = {
    top: 'before:inset-x-0 before:top-full before:h-2',
    bottom: 'before:inset-x-0 before:bottom-full before:h-2',
    left: 'before:inset-y-0 before:left-full before:w-2',
    right: 'before:inset-y-0 before:right-full before:w-2',
  };

  const arrowClasses = {
    top:    'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-slate-900 dark:border-t-slate-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-slate-900 dark:border-b-slate-700',
    left:   'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-slate-900 dark:border-l-slate-700',
    right:  'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-slate-900 dark:border-r-slate-700',
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={() => { hoveredRef.current = true; show(); }}
      onMouseLeave={() => { hoveredRef.current = false; if (!focusedRef.current) hide(); }}
      onFocus={() => { focusedRef.current = true; show(); }}
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        focusedRef.current = false;
        if (!hoveredRef.current) hide();
      }}
    >
      {React.cloneElement(trigger, { 'aria-describedby': describedBy })}
      {visible && (
        <div
          ref={panelRef}
          id={tooltipId}
          data-side={resolvedSide}
          style={{left: position?.left ?? 0, top: position?.top ?? 0, visibility: position ? 'visible' : 'hidden'}}
          role="tooltip"
          className={cn(
            "absolute z-[var(--p-z-tooltip)] pointer-events-auto before:absolute before:content-['']",
            'px-2 py-1 text-xs font-medium text-white bg-slate-900 dark:bg-slate-700 rounded-md shadow-lg',
            'w-max max-w-[min(20rem,calc(100vw-1rem))] whitespace-normal [overflow-wrap:anywhere] animate-fade-in',
            hoverBridgeClasses[resolvedSide],
            className
          )}
        >
          <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto">{content}</div>
          <span aria-hidden="true" className={cn('absolute border-4', arrowClasses[resolvedSide])}
            style={resolvedSide === 'top' || resolvedSide === 'bottom' ? {left: position?.arrow} : {top: position?.arrow}} />
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';
