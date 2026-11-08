import React, { useMemo, useRef, useState } from 'react';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { Button } from '../../../components/shared/ui/Button';
import { Input } from '../../../components/shared/ui/Input';
import { Select } from '../../../components/shared/ui/Select';
import { ConfirmDialog } from '../../../components/shared/ui/ConfirmDialog';
import type { Lead, LeadStatus } from '../types';
import { LEAD_STATUSES } from '../types';
import { COUNT_ITEMS } from '../catalog';
import { BandHeader } from './GroupSection';
import { shareElementAsImage } from '../utils/exportImage';

interface LeadsTabProps {
    leads: Lead[];
    staffName: string;
    onAdd: (lead: Pick<Lead, 'name' | 'phone' | 'product' | 'notes'>) => void;
    onUpdate: (lead: Lead) => void;
    onRemove: (id: string) => void;
}

export const OVERDUE_MS = 2 * 60 * 60 * 1000;
export const isOverdue = (l: Lead, now = Date.now()) => l.status === 'Chưa liên hệ' && now - l.createdAt > OVERDUE_MS;

/** Vạch mép trái mã hoá trạng thái chăm sóc chuẩn Apple */
const STATUS_STRIPE: Record<LeadStatus, string> = {
    'Chưa liên hệ': 'border-l-rose-500',
    'Đã liên hệ': 'border-l-sky-500',
    'Đã chốt': 'border-l-emerald-600',
    'Tham khảo': 'border-l-amber-500',
    'Từ chối': 'border-l-slate-400',
};

const DETAIL_LABEL: Partial<Record<LeadStatus, string>> = {
    'Đã liên hệ': 'Nội dung trao đổi',
    'Đã chốt': 'Thông tin chốt (giao chiều, cọc 500k…)',
    'Từ chối': 'Lý do từ chối',
};

const ago = (ts: number, now: number) => {
    const m = Math.max(0, Math.round((now - ts) / 60000));
    if (m < 60) return `${m} phút`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}g${String(m % 60).padStart(2, '0')}`;
    return `${Math.floor(h / 24)} ngày`;
};

export const LeadsTab: React.FC<LeadsTabProps> = ({ leads, staffName, onAdd, onUpdate, onRemove }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [picked, setPicked] = useState<string[]>([]);
    const [customProduct, setCustomProduct] = useState('');
    const [notes, setNotes] = useState('');
    const [search, setSearch] = useState('');
    const [pendingDelete, setPendingDelete] = useState<Lead | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const now = Date.now();

    const productOptions = COUNT_ITEMS.products.map(i => i.label);
    const togglePick = (label: string) => setPicked(p => (p.includes(label) ? p.filter(x => x !== label) : [...p, label]));

    const errors = {
        name: name.trim() ? '' : 'Nhập tên khách',
        phone: phone.trim() ? '' : 'Nhập số điện thoại',
        product: picked.length || customProduct.trim() ? '' : 'Chọn ít nhất 1 sản phẩm',
    };
    const canAdd = !errors.name && !errors.phone && !errors.product;

    const submit = () => {
        if (!canAdd) return;
        const products = [...picked, ...(customProduct.trim() ? [customProduct.trim()] : [])];
        onAdd({ name: name.trim(), phone: phone.trim(), product: products.join(', '), notes: notes.trim() });
        setName(''); setPhone(''); setPicked([]); setCustomProduct(''); setNotes('');
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const rows = q
            ? leads.filter(l => l.name.toLowerCase().includes(q) || l.phone.includes(q) || l.product.toLowerCase().includes(q) || l.status.toLowerCase().includes(q))
            : leads;
        return [...rows].sort((a, b) => b.createdAt - a.createdAt);
    }, [leads, search]);

    const overdueCount = leads.filter(l => isOverdue(l, now)).length;

    return (
        <div className="lg:grid lg:grid-cols-12 lg:gap-3.5 space-y-3.5 lg:space-y-0">
            {/* Form thêm khách */}
            <section className="lg:col-span-4 rounded-card border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden self-start" data-testid="lead-form">
                <BandHeader icon="user" title="Thêm khách hàng" />
                <div className="p-3 sm:p-3.5 space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                        <div>
                            <label htmlFor="lead-name" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Tên khách</label>
                            <Input id="lead-name" placeholder="Nguyễn Văn A" value={name} onChange={e => setName(e.target.value)} className="h-9 text-[13px] rounded-lg" />
                        </div>
                        <div>
                            <label htmlFor="lead-phone" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Số điện thoại</label>
                            <Input id="lead-phone" type="tel" inputMode="numeric" placeholder="09xx…" value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} className="h-9 text-[13px] tabular-nums rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Sản phẩm quan tâm</span>
                        <div className="flex flex-wrap gap-1.5">
                            {productOptions.map(label => {
                                const on = picked.includes(label);
                                return (
                                    <Button key={label} variant="secondary" size="sm" onClick={() => togglePick(label)} aria-pressed={on}
                                        className={`ycx-hit h-8 px-2.5 text-[12px] rounded-full transition-all duration-150 active:scale-95 ${on ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-semibold shadow-2xs' : 'rounded-full'}`}>
                                        {label}
                                    </Button>
                                );
                            })}
                        </div>
                        <Input placeholder="Sản phẩm khác…" value={customProduct} onChange={e => setCustomProduct(e.target.value)} className="h-8 text-[13px] mt-2 rounded-lg" aria-label="Sản phẩm khác" />
                    </div>
                    <div>
                        <label htmlFor="lead-notes" className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Ghi chú</label>
                        <Input id="lead-notes" placeholder="Ghi chú khách hàng…" value={notes} onChange={e => setNotes(e.target.value)} className="h-8 text-[13px] rounded-lg"
                            onKeyDown={e => { if (e.key === 'Enter') submit(); }} />
                    </div>
                    <Button variant="primary" onClick={submit} disabled={!canAdd} leftIcon={<AppIcon name="add" size="md" />} className="w-full h-10 rounded-full font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25 active:scale-95 text-[13px]" data-testid="btn-add-lead"
                        title={canAdd ? undefined : Object.values(errors).filter(Boolean).join(' · ')}>
                        Thêm khách
                    </Button>
                </div>
            </section>

            {/* Danh sách */}
            <section className="lg:col-span-8 rounded-card border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden" data-testid="lead-list">
                <BandHeader
                    icon="users"
                    title={<>Danh sách khách hàng <span className="tabular-nums text-sky-600 dark:text-sky-400 font-bold">({leads.length})</span>{staffName ? <span className="ml-2 font-normal normal-case tracking-normal text-slate-500 dark:text-slate-400">· {staffName}</span> : null}</>}
                    right={
                        <div className="flex items-center gap-1.5">
                            <div className="relative hidden sm:block">
                                <AppIcon name="search" size="xs" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input placeholder="Tìm nhanh…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Tìm khách hàng"
                                    className="h-7 w-44 pl-7 pr-2 text-[12px] rounded-lg bg-white dark:bg-slate-850" fullWidth={false} />
                            </div>
                            {leads.length > 0 && (
                                <Button variant="secondary" size="sm" className="ycx-hit h-7 px-2.5 text-[11px] rounded-full" leftIcon={<AppIcon name="share" size="xs" />}
                                    onClick={() => shareElementAsImage(listRef.current, `khach-hang-${new Date().toISOString().slice(0, 10)}.png`, 'Danh sách khách hàng')}>
                                    Xuất ảnh
                                </Button>
                            )}
                        </div>
                    }
                />
                {overdueCount > 0 && (
                    <div className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 flex items-center gap-2 text-[12px] text-amber-800 dark:text-amber-200">
                        <AppIcon name="clock" size="sm" className="text-amber-600 shrink-0" />
                        <span>Có <b>{overdueCount}</b> khách quá 2 giờ chưa cập nhật trạng thái liên hệ.</span>
                    </div>
                )}
                {leads.length === 0 ? (
                    <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
                        Chưa có khách hàng nào. Nhập thông tin ở form bên trái để lưu khách cần chăm sóc.
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
                        Không tìm thấy khách hàng khớp với từ khoá &quot;{search}&quot;.
                    </div>
                ) : (
                    <div ref={listRef} className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                        {filtered.map(l => {
                            const overdue = isOverdue(l, now);
                            const stripe = STATUS_STRIPE[l.status] || 'border-l-slate-300';
                            return (
                                <div key={l.id} className={`p-3 sm:p-3.5 border-l-4 ${stripe} flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors`}>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-[14px] text-slate-900 dark:text-white">{l.name}</span>
                                            <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 text-[13px] font-bold text-sky-600 dark:text-sky-400 hover:underline tabular-nums">
                                                <AppIcon name="phone" size="xs" /> {l.phone}
                                            </a>
                                            <span className="text-[11px] text-slate-400 tabular-nums">({ago(l.createdAt, now)} trước)</span>
                                            {overdue && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                                    Quá 2h
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[13px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 flex-wrap">
                                            <span className="font-medium text-slate-500 dark:text-slate-400">SP:</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{l.product}</span>
                                            {l.notes && <span className="text-slate-500 italic">· {l.notes}</span>}
                                        </div>
                                        {l.statusDetails && (
                                            <div className="text-[12px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800 mt-1">
                                                <b className="text-slate-700 dark:text-slate-300">{DETAIL_LABEL[l.status] || 'Chi tiết'}:</b> {l.statusDetails}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        <div className="w-36">
                                            <Select
                                                value={l.status}
                                                onChange={e => onUpdate({ ...l, status: e.target.value as LeadStatus, updatedAt: Date.now() })}
                                                options={LEAD_STATUSES.map(s => ({ value: s, label: s }))}
                                                className="h-8 text-[12px] rounded-lg"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => setPendingDelete(l)}
                                            title="Xoá khách này"
                                            aria-label="Xoá khách"
                                            className="ycx-hit h-8 w-8 text-slate-400 hover:text-rose-600 rounded-full"
                                        >
                                            <AppIcon name="delete" size="sm" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <ConfirmDialog
                isOpen={!!pendingDelete}
                title="Xoá khách hàng?"
                message={`Xoá khách hàng "${pendingDelete?.name}" (${pendingDelete?.phone})? Không thể hoàn tác.`}
                confirmText="Xoá"
                cancelText="Giữ lại"
                variant="danger"
                onConfirm={() => { if (pendingDelete) { onRemove(pendingDelete.id); setPendingDelete(null); } }}
                onClose={() => setPendingDelete(null)}
            />
        </div>
    );
};
