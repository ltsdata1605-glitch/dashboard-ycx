import React, { useEffect, useMemo, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { Button } from '../../../components/shared/ui/Button';
import { Select } from '../../../components/shared/ui/Select';
import { Badge, type BadgeVariant } from '../../../components/shared/ui/Badge';
import { ConfirmDialog } from '../../../components/shared/ui/ConfirmDialog';
import { EmptyState } from '../../../components/shared/ui/EmptyState';
import { toast } from '../../../components/shared/ui/toast';
import { decideApprovalOnBot } from '../services/lineMessagingService';

type Status = 'pending' | 'approved' | 'rejected';
type Decision = 'ok' | 'no';

interface ApprovalRow {
    id: string;
    body?: string;
    status?: Status;
    requesterName?: string;
    createdAt?: string;
    decidedByName?: string;
    decidedAt?: string;
    decidedSource?: string;
}

interface ApprovalEvent {
    id: string;
    action?: string;
    actorName?: string;
    source?: 'line' | 'web';
    at?: string;
    attempted?: Decision;
}

const STATUS_LABEL: Record<Status, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
const STATUS_VARIANT: Record<Status, BadgeVariant> = { pending: 'warning', approved: 'success', rejected: 'danger' };

/** Nhãn từng hành động trong nhật ký — gồm cả các lần bị chặn để thấy ai đã thử làm gì. */
const EVENT_LABEL: Record<string, string> = {
    created: 'Gửi yêu cầu',
    approved: 'Duyệt',
    rejected: 'Từ chối',
    blocked_self: 'Bị chặn: tự duyệt',
    blocked_no_permission: 'Bị chặn: không có quyền',
    already_decided: 'Bị chặn: đã xử lý xong',
};

const SOURCE_LABEL: Record<string, string> = { line: 'LINE', web: 'Web' };

function formatTime(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
}

const TH = 'px-3 py-2 text-left whitespace-nowrap';

interface ApprovalRequestsTabProps {
    botId?: string;
}

/**
 * Tab "Yêu cầu duyệt": xem và xử lý yêu cầu /xinphep gửi từ nhóm LINE, kèm nhật ký từng lần tác động.
 * Đọc trực tiếp Firestore (quy tắc chỉ cho chủ bot/admin/manager cùng Kho); ghi (duyệt/từ chối) qua server.
 */
export const ApprovalRequestsTab: React.FC<ApprovalRequestsTabProps> = ({ botId }) => {
    const [rows, setRows] = useState<ApprovalRow[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | Status>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [eventsById, setEventsById] = useState<Record<string, ApprovalEvent[]>>({});
    const [pendingDecision, setPendingDecision] = useState<{ row: ApprovalRow; decision: Decision } | null>(null);
    const [isDeciding, setIsDeciding] = useState<boolean>(false);

    useEffect(() => {
        if (!botId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(collection(db, 'line_bots', botId, 'approvals'), orderBy('createdAt', 'desc'), limit(200));
        return onSnapshot(
            q,
            snap => {
                setRows(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ApprovalRow, 'id'>) })));
                setError(null);
                setLoading(false);
            },
            err => {
                setError(err.message);
                setLoading(false);
            }
        );
    }, [botId]);

    const shown = useMemo(() => (filter === 'all' ? rows : rows.filter(r => r.status === filter)), [rows, filter]);
    const pendingCount = useMemo(() => rows.filter(r => r.status === 'pending').length, [rows]);

    async function toggleHistory(id: string) {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        if (!botId || eventsById[id]) return;
        try {
            const snap = await getDocs(query(collection(db, 'line_bots', botId, 'approvals', id, 'events'), orderBy('at', 'asc')));
            setEventsById(prev => ({ ...prev, [id]: snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ApprovalEvent, 'id'>) })) }));
        } catch (e) {
            toast.error('Không tải được lịch sử', { description: e instanceof Error ? e.message : undefined });
        }
    }

    async function confirmDecision() {
        if (!pendingDecision || !botId) return;
        const { row, decision } = pendingDecision;
        setIsDeciding(true);
        const res = await decideApprovalOnBot(botId, row.id, decision);
        setIsDeciding(false);
        setPendingDecision(null);
        if (res.success) {
            toast.success(decision === 'ok' ? 'Đã duyệt yêu cầu' : 'Đã từ chối yêu cầu');
            // Nhật ký đã đổi — bỏ bộ nhớ đệm để lần mở sau tải lại.
            setEventsById(prev => {
                const next = { ...prev };
                delete next[row.id];
                return next;
            });
        } else {
            toast.error(res.error || 'Không thực hiện được');
        }
    }

    if (!botId) {
        return <EmptyState icon="securityOk" title="Chưa có Bot LINE" description="Tạo hoặc chọn Bot LINE trước để xem yêu cầu duyệt." />;
    }

    const dialogRow = pendingDecision?.row;
    const isApprove = pendingDecision?.decision === 'ok';

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    Chờ duyệt: <strong>{pendingCount}</strong> · Tổng: <strong>{rows.length}</strong>
                    {rows.length >= 200 && <span className="text-slate-400"> (hiển thị 200 yêu cầu gần nhất)</span>}
                </p>
                <Select
                    aria-label="Lọc theo trạng thái"
                    dense
                    value={filter}
                    onChange={e => setFilter(e.target.value as 'all' | Status)}
                    options={[
                        { value: 'all', label: 'Tất cả' },
                        { value: 'pending', label: 'Chờ duyệt' },
                        { value: 'approved', label: 'Đã duyệt' },
                        { value: 'rejected', label: 'Từ chối' },
                    ]}
                />
            </div>

            {error && <p role="alert" className="text-sm text-rose-600">Không tải được yêu cầu: {error}</p>}

            {loading ? (
                <p className="text-sm text-slate-500">Đang tải…</p>
            ) : shown.length === 0 ? (
                <EmptyState
                    icon="securityOk"
                    title={rows.length === 0 ? 'Chưa có yêu cầu nào' : 'Không có yêu cầu ở trạng thái này'}
                    description="Yêu cầu gửi bằng /xinphep trong nhóm LINE sẽ hiện ở đây."
                />
            ) : (
                <div className="overflow-x-auto rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className={TH}>Mã</th>
                                <th className={TH}>Nội dung</th>
                                <th className={TH}>Người xin</th>
                                <th className={TH}>Gửi lúc</th>
                                <th className={TH}>Trạng thái</th>
                                <th className={TH}>Người quyết định</th>
                                <th className={TH}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shown.map(row => {
                                const status: Status = row.status ?? 'pending';
                                const isOpen = expandedId === row.id;
                                return (
                                    <React.Fragment key={row.id}>
                                        <tr className="border-t border-slate-100 dark:border-slate-700 align-top">
                                            <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{row.id}</td>
                                            <td className="px-3 py-2 max-w-[280px] break-words">{row.body || '—'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{row.requesterName || '—'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{formatTime(row.createdAt)}</td>
                                            <td className="px-3 py-2"><Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge></td>
                                            <td className="px-3 py-2 whitespace-nowrap">
                                                {row.decidedByName ? `${row.decidedByName}${row.decidedSource === 'web' ? ' (web)' : ''}` : '—'}
                                                {row.decidedAt && <div className="text-xs text-slate-400">{formatTime(row.decidedAt)}</div>}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {status === 'pending' && (
                                                        <>
                                                            <Button size="sm" variant="primary" onClick={() => setPendingDecision({ row, decision: 'ok' })}>Duyệt</Button>
                                                            <Button size="sm" variant="destructive" onClick={() => setPendingDecision({ row, decision: 'no' })}>Từ chối</Button>
                                                        </>
                                                    )}
                                                    <Button size="sm" variant="ghost" onClick={() => toggleHistory(row.id)} aria-expanded={isOpen}>
                                                        {isOpen ? 'Ẩn lịch sử' : 'Lịch sử'}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                        {isOpen && (
                                            <tr className="bg-slate-50/70 dark:bg-slate-900/60">
                                                <td colSpan={7} className="px-3 py-2">
                                                    {!eventsById[row.id] ? (
                                                        <p className="text-xs text-slate-500">Đang tải lịch sử…</p>
                                                    ) : eventsById[row.id].length === 0 ? (
                                                        <p className="text-xs text-slate-500">Chưa có nhật ký.</p>
                                                    ) : (
                                                        <table className="w-full text-xs">
                                                            <thead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                                <tr>
                                                                    <th className={TH}>Thời gian</th>
                                                                    <th className={TH}>Hành động</th>
                                                                    <th className={TH}>Người thực hiện</th>
                                                                    <th className={TH}>Nguồn</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {eventsById[row.id].map(ev => (
                                                                    <tr key={ev.id} className="border-t border-slate-200/70 dark:border-slate-700">
                                                                        <td className="px-3 py-1.5 whitespace-nowrap">{formatTime(ev.at)}</td>
                                                                        <td className={`px-3 py-1.5 ${ev.action?.startsWith('blocked') || ev.action === 'already_decided' ? 'text-rose-600' : ''}`}>
                                                                            {EVENT_LABEL[ev.action ?? ''] ?? ev.action ?? '—'}
                                                                        </td>
                                                                        <td className="px-3 py-1.5 whitespace-nowrap">{ev.actorName || '—'}</td>
                                                                        <td className="px-3 py-1.5">{SOURCE_LABEL[ev.source ?? ''] ?? '—'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!pendingDecision}
                onClose={() => setPendingDecision(null)}
                onConfirm={confirmDecision}
                isLoading={isDeciding}
                variant={isApprove ? 'info' : 'danger'}
                title={isApprove ? 'Duyệt yêu cầu?' : 'Từ chối yêu cầu?'}
                message={dialogRow ? `"${dialogRow.body || ''}" của ${dialogRow.requesterName || 'nhân viên'}. Thao tác này được ghi vào nhật ký.` : ''}
                confirmText={isApprove ? 'Duyệt' : 'Từ chối'}
            />
        </div>
    );
};
