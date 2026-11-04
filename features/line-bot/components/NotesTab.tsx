import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Button } from '../../../components/shared/ui/Button';
import { Input } from '../../../components/shared/ui/Input';
import { ConfirmDialog } from '../../../components/shared/ui/ConfirmDialog';
import { EmptyState } from '../../../components/shared/ui/EmptyState';
import { toast } from '../../../components/shared/ui/toast';

interface NoteRow {
    id: string;
    body?: string;
    authorName?: string;
    groupName?: string | null;
    createdAt?: string;
}

function formatTime(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
}

const TH = 'px-3 py-2 text-left whitespace-nowrap';

interface NotesTabProps {
    botId?: string;
}

/**
 * Tab "Ghi nhanh": xem các mục /ghi gửi từ nhóm LINE (lưu trong Firebase, không dùng Google Sheet).
 * Đọc/xoá trực tiếp Firestore theo quy tắc: chủ bot, admin, hoặc manager cùng Mã Kho.
 */
export const NotesTab: React.FC<NotesTabProps> = ({ botId }) => {
    const [rows, setRows] = useState<NoteRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState<string>('');
    const [pendingDelete, setPendingDelete] = useState<NoteRow | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    useEffect(() => {
        if (!botId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(collection(db, 'line_bots', botId, 'notes'), orderBy('createdAt', 'desc'), limit(300));
        return onSnapshot(
            q,
            snap => {
                setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<NoteRow, 'id'>) })));
                setError(null);
                setLoading(false);
            },
            err => {
                setError(err.message);
                setLoading(false);
            }
        );
    }, [botId]);

    const shown = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter(r =>
            (r.body || '').toLowerCase().includes(q)
            || (r.authorName || '').toLowerCase().includes(q)
            || (r.groupName || '').toLowerCase().includes(q)
        );
    }, [rows, search]);

    async function confirmDelete() {
        if (!pendingDelete || !botId) return;
        setIsDeleting(true);
        try {
            await deleteDoc(doc(db, 'line_bots', botId, 'notes', pendingDelete.id));
            toast.success('Đã xoá ghi nhanh');
        } catch (e) {
            toast.error('Không xoá được', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setIsDeleting(false);
            setPendingDelete(null);
        }
    }

    if (!botId) {
        return <EmptyState icon="edit" title="Chưa có Bot LINE" description="Tạo hoặc chọn Bot LINE trước để xem ghi nhanh." />;
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Tổng: <strong>{rows.length}</strong>
                    {rows.length >= 300 && <span className="text-slate-400"> (hiển thị 300 mục gần nhất)</span>}
                </p>
                <div className="w-full sm:w-72">
                    <Input
                        aria-label="Tìm ghi nhanh"
                        dense
                        placeholder="Tìm theo nội dung, người ghi, nhóm…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {error && <p role="alert" className="text-sm text-rose-600">Không tải được ghi nhanh: {error}</p>}

            {loading ? (
                <p className="text-sm text-slate-500">Đang tải…</p>
            ) : shown.length === 0 ? (
                <EmptyState
                    icon="edit"
                    title={rows.length === 0 ? 'Chưa có ghi nhanh nào' : 'Không có mục khớp tìm kiếm'}
                    description="Gõ /ghi <nội dung> trong nhóm LINE để ghi nhanh. Mục sẽ hiện ở đây."
                />
            ) : (
                <div className="overflow-x-auto rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <table className="w-full min-w-[640px] text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className={TH}>Thời gian</th>
                                <th className={TH}>Người ghi</th>
                                <th className={TH}>Nhóm</th>
                                <th className={TH}>Nội dung</th>
                                <th className={TH}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map(row => (
                                <tr key={row.id} className="border-t border-slate-100 dark:border-slate-700 align-top">
                                    <td className="px-3 py-2 whitespace-nowrap">{formatTime(row.createdAt)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{row.authorName || '—'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap">{row.groupName || 'Chat riêng'}</td>
                                    <td className="px-3 py-2 max-w-[360px] break-words whitespace-pre-line">{row.body || '—'}</td>
                                    <td className="px-3 py-2">
                                        <Button size="sm" variant="destructive" onClick={() => setPendingDelete(row)}>Xoá</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                isLoading={isDeleting}
                variant="danger"
                title="Xoá ghi nhanh này?"
                message={pendingDelete ? `"${(pendingDelete.body || '').slice(0, 120)}" sẽ bị xoá vĩnh viễn.` : ''}
                confirmText="Xoá"
            />
        </div>
    );
};
