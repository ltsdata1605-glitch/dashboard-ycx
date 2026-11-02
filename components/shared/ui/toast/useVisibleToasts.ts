import { useCallback, useEffect, useRef, useState } from 'react';
import { useToasterStore, type Toast } from 'react-hot-toast';
import { toast, TOAST_DURATION } from './toast';

type Clock = Pick<Toast, 'createdAt' | 'message' | 'type'> & { duration: number; remaining: number };

/** Store/API vẫn dùng chung; chỉ tính thời lượng cho toast đang có chỗ hiển thị. */
export function useVisibleToasts(limit: number) {
    const { toasts } = useToasterStore({
        success: { duration: TOAST_DURATION.success },
        error: { duration: TOAST_DURATION.error },
        blank: { duration: TOAST_DURATION.info },
    });
    const [paused, setPaused] = useState(false);
    const [, setHeightVersion] = useState(0);
    const heights = useRef(new Map<string, number>());
    const clocks = useRef(new Map<string, Clock>());
    const removals = useRef(new Map<string, ReturnType<typeof setTimeout>>());
    const activeIds = new Set(toasts.filter(t => t.visible).slice(0, limit).map(t => t.id));
    const shown = toasts.filter(t => activeIds.has(t.id) || (!t.visible && heights.current.has(t.id)));

    const updateHeight = useCallback((id: string, height: number) => {
        if (heights.current.get(id) === height) return;
        heights.current.set(id, height);
        setHeightVersion(v => v + 1);
    }, []);
    const startPause = useCallback(() => setPaused(true), []);
    const endPause = useCallback(() => setPaused(false), []);

    useEffect(() => {
        const ids = new Set(toasts.map(t => t.id));
        for (const id of clocks.current.keys()) if (!ids.has(id)) clocks.current.delete(id);
        for (const id of heights.current.keys()) if (!ids.has(id)) heights.current.delete(id);
        for (const [id, timer] of removals.current) {
            if (!toasts.some(t => t.id === id && t.dismissed)) {
                clearTimeout(timer);
                removals.current.delete(id);
            }
        }
        const visibleIds = new Set(toasts.filter(t => t.visible).slice(0, limit).map(t => t.id));
        const running: { clock: Clock; timer: ReturnType<typeof setTimeout> }[] = [];
        const started = Date.now();
        for (const t of toasts) {
            if (t.dismissed && !removals.current.has(t.id)) {
                removals.current.set(t.id, setTimeout(() => {
                    removals.current.delete(t.id);
                    toast.remove(t.id);
                }, t.removeDelay ?? 1000));
            }
            if (!t.visible) continue;
            const duration = t.duration ?? 0;
            let clock = clocks.current.get(t.id);
            if (!clock || clock.createdAt !== t.createdAt || clock.duration !== duration || clock.message !== t.message || clock.type !== t.type) {
                clock = { createdAt: t.createdAt, duration, message: t.message, type: t.type, remaining: duration };
                clocks.current.set(t.id, clock);
            }
            if (!paused && visibleIds.has(t.id) && Number.isFinite(clock.remaining)) {
                running.push({ clock, timer: setTimeout(() => toast.dismiss(t.id), Math.max(0, clock.remaining)) });
            }
        }
        return () => {
            const elapsed = Math.max(0, Date.now() - started);
            for (const { clock, timer } of running) {
                clearTimeout(timer);
                clock.remaining = Math.max(0, clock.remaining - elapsed);
            }
        };
    }, [toasts, paused, limit]);

    useEffect(() => {
        const timers = removals.current;
        return () => { timers.forEach(clearTimeout); timers.clear(); };
    }, []);

    const offsetOf = (target: Toast, gutter: number) => {
        let offset = 0;
        for (const t of shown) {
            if (t.id === target.id) break;
            if (t.visible) offset += (heights.current.get(t.id) ?? 0) + gutter;
        }
        return offset;
    };
    return { shown, updateHeight, startPause, endPause, offsetOf };
}
