/**
 * Ba tính năng làm việc nhóm trên Bot LINE (đề xuất mục 2, 16, 17 — chủ dự án chốt 2026-11-03):
 *  1. Xác nhận "Đã nhận"   : /xacnhan <nội dung>  · /xacnhan ds <mã>
 *  2. Phiếu yêu cầu        : /yc <việc cần làm>  · /yc ds  · /yc xong <mã YC-0001>
 *  3. Duyệt bằng nút       : /xinphep <nội dung> (nút Duyệt / Từ chối, chỉ người có quyền duyệt)
 *
 * KHÔNG tạo tin tự động: mọi tin chỉ được gửi làm phản hồi trực tiếp cho lệnh của người dùng
 * (replyToken), nên không tính vào hạn mức tin push.
 *
 * Phần THUẦN (phân tích lệnh, dựng Flex, chuyển trạng thái) nằm ở đầu file để test đơn vị không cần
 * firebase-admin/LINE API. Phần Firestore nhận `db` và `reply` qua tham số (không import trực tiếp).
 */
import * as crypto from 'crypto';

// ───────────────────────── PHẦN THUẦN ─────────────────────────

export type WorkflowCommand =
    | { kind: 'ack_create'; body: string }
    | { kind: 'ack_list'; ackId: string }
    | { kind: 'ticket_create'; title: string }
    | { kind: 'ticket_list' }
    | { kind: 'ticket_done'; code: string }
    | { kind: 'approval_create'; body: string };

const PREFIX = /^[./!#]\s*/;

/** Nhận diện lệnh làm việc nhóm. Trả null nếu không phải lệnh của nhóm này (để webhook xử lý tiếp). */
export function parseWorkflowCommand(raw: string): WorkflowCommand | null {
    const text = String(raw || '').trim().replace(/\s+/g, ' ');
    if (!PREFIX.test(text)) return null;
    const body = text.replace(PREFIX, '').trim();
    const lower = body.toLowerCase();

    // /xacnhan (cũng nhận "xác nhận" có dấu)
    const ack = /^(?:xacnhan|xác\s*nhận)(?:\s+|$)([\s\S]*)$/i.exec(body);
    if (ack) {
        const rest = ack[1].trim();
        const list = /^ds\s+(\S+)$/i.exec(rest);
        if (list) return { kind: 'ack_list', ackId: list[1] };
        if (!rest) return null; // "/xacnhan" trơ trọi: không có nội dung → không xử lý
        return { kind: 'ack_create', body: rest };
    }

    // /yc ...
    if (/^yc(?:\s|$)/i.test(body)) {
        const rest = body.replace(/^yc\s*/i, '').trim();
        if (!rest) return null;
        if (/^ds$/i.test(rest)) return { kind: 'ticket_list' };
        const done = /^xong\s+(\S+)$/i.exec(rest);
        if (done) return { kind: 'ticket_done', code: normalizeTicketCode(done[1]) };
        return { kind: 'ticket_create', title: rest };
    }

    // /xinphep <nội dung>
    if (/^xinphep(?:\s|$)/i.test(lower)) {
        const rest = body.replace(/^xinphep\s*/i, '').trim();
        if (!rest) return null;
        return { kind: 'approval_create', body: rest };
    }

    return null;
}

/** "1" / "yc-1" / "YC-0001" → "YC-0001". */
export function normalizeTicketCode(input: string): string {
    const m = /(\d+)/.exec(String(input || ''));
    if (!m) return '';
    return `YC-${String(Number(m[1])).padStart(4, '0')}`;
}

/** Mã ngắn ngẫu nhiên cho xác nhận / duyệt (8 ký tự chữ-số, khó đoán). */
export function newShortId(): string {
    return crypto.randomBytes(6).toString('base64url').slice(0, 8);
}

export function clip(text: string, max: number): string {
    const t = String(text || '').trim();
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

/** Trạng thái phiếu: chỉ "open" mới được đóng; đóng rồi thì không đóng lại. */
export function canCloseTicket(status: string | undefined): boolean {
    return status === 'open';
}

/** Chuyển trạng thái duyệt: chỉ "pending" mới quyết định được; không tự duyệt yêu cầu của chính mình. */
export function decideApproval(
    current: { status?: string; requesterId?: string },
    deciderId: string,
    decision: 'ok' | 'no',
): { ok: true; status: 'approved' | 'rejected' } | { ok: false; reason: 'already' | 'self' } {
    if (current.status !== 'pending') return { ok: false, reason: 'already' };
    if (current.requesterId && current.requesterId === deciderId) return { ok: false, reason: 'self' };
    return { ok: true, status: decision === 'ok' ? 'approved' : 'rejected' };
}

export type WorkflowPostback =
    | { w: 'ack'; id: string }
    | { w: 'tdone'; code: string }
    | { w: 'apr'; id: string; d: 'ok' | 'no' };

/** Đọc dữ liệu nút bấm của tính năng làm việc nhóm. Trả null nếu không phải của tính năng này. */
export function parseWorkflowPostback(data: string): WorkflowPostback | null {
    if (!String(data || '').startsWith('{')) return null;
    try {
        const p = JSON.parse(data);
        if (p?.w === 'ack' && typeof p.id === 'string') return { w: 'ack', id: p.id };
        if (p?.w === 'tdone' && typeof p.c === 'string') return { w: 'tdone', code: normalizeTicketCode(p.c) };
        if (p?.w === 'apr' && typeof p.id === 'string' && (p.d === 'ok' || p.d === 'no')) return { w: 'apr', id: p.id, d: p.d };
    } catch (_) { /* không phải JSON của tính năng này */ }
    return null;
}

const MAX_NAMES = 30;

export function formatConfirmedNames(names: string[]): string {
    if (names.length === 0) return 'Chưa có ai bấm "Đã nhận".';
    const shown = names.slice(0, MAX_NAMES).map((n, i) => `${i + 1}. ${clip(n, 40)}`);
    const more = names.length > MAX_NAMES ? `\n… và ${names.length - MAX_NAMES} người khác` : '';
    return `${shown.join('\n')}${more}`;
}

// ───────────────────────── FLEX MESSAGE ─────────────────────────

export function buildAckFlex(id: string, body: string, creatorName: string): any {
    return {
        type: 'flex',
        altText: `Cần xác nhận: ${clip(body, 80)}`,
        contents: {
            type: 'bubble',
            body: {
                type: 'box', layout: 'vertical', spacing: 'md',
                contents: [
                    { type: 'text', text: '📢 CẦN XÁC NHẬN', weight: 'bold', size: 'sm', color: '#0369a1' },
                    { type: 'text', text: clip(body, 500), wrap: true, size: 'md' },
                    { type: 'text', text: `Từ: ${clip(creatorName, 40)} · Mã ${id}`, size: 'xs', color: '#64748b', wrap: true },
                ],
            },
            footer: {
                type: 'box', layout: 'vertical',
                contents: [{
                    type: 'button', style: 'primary', color: '#0284c7',
                    action: { type: 'postback', label: '✅ Đã nhận', data: JSON.stringify({ w: 'ack', id }), displayText: 'Đã nhận' },
                }],
            },
        },
    };
}

export function buildTicketFlex(t: { code: string; title: string; requesterName: string; createdLabel: string }): any {
    return {
        type: 'flex',
        altText: `Phiếu ${t.code}: ${clip(t.title, 60)}`,
        contents: {
            type: 'bubble',
            body: {
                type: 'box', layout: 'vertical', spacing: 'md',
                contents: [
                    { type: 'text', text: `🎫 PHIẾU ${t.code}`, weight: 'bold', size: 'sm', color: '#0369a1' },
                    { type: 'text', text: clip(t.title, 500), wrap: true, size: 'md' },
                    { type: 'text', text: `Người gửi: ${clip(t.requesterName, 40)} · ${t.createdLabel}`, size: 'xs', color: '#64748b', wrap: true },
                ],
            },
            footer: {
                type: 'box', layout: 'vertical',
                contents: [{
                    type: 'button', style: 'secondary',
                    action: { type: 'postback', label: '✔ Hoàn tất', data: JSON.stringify({ w: 'tdone', c: t.code }), displayText: `Hoàn tất ${t.code}` },
                }],
            },
        },
    };
}

export function buildApprovalFlex(a: { id: string; body: string; requesterName: string }): any {
    return {
        type: 'flex',
        altText: `Xin duyệt: ${clip(a.body, 80)}`,
        contents: {
            type: 'bubble',
            body: {
                type: 'box', layout: 'vertical', spacing: 'md',
                contents: [
                    { type: 'text', text: '📝 XIN DUYỆT', weight: 'bold', size: 'sm', color: '#0369a1' },
                    { type: 'text', text: clip(a.body, 500), wrap: true, size: 'md' },
                    { type: 'text', text: `Người xin: ${clip(a.requesterName, 40)} · Mã ${a.id}`, size: 'xs', color: '#64748b', wrap: true },
                ],
            },
            footer: {
                type: 'box', layout: 'horizontal', spacing: 'sm',
                contents: [
                    {
                        type: 'button', style: 'primary', color: '#059669', flex: 1,
                        action: { type: 'postback', label: 'Duyệt', data: JSON.stringify({ w: 'apr', id: a.id, d: 'ok' }), displayText: 'Duyệt' },
                    },
                    {
                        type: 'button', style: 'secondary', flex: 1,
                        action: { type: 'postback', label: 'Từ chối', data: JSON.stringify({ w: 'apr', id: a.id, d: 'no' }), displayText: 'Từ chối' },
                    },
                ],
            },
        },
    };
}

// ───────────────────────── XỬ LÝ (Firestore + reply) ─────────────────────────

export interface WorkflowDeps {
    /** Firestore Admin (db). */
    db: any;
    /** Gửi phản hồi bằng replyToken (không tính hạn mức push). */
    reply: (messages: any[]) => Promise<unknown>;
    /** Quyền duyệt trên LINE: CHỈ người có trong danh sách admin đang bật với vai trò Duyệt/Toàn quyền. */
    canApprove: (senderUserId: string) => Promise<boolean>;
    /** Bot đã khai báo ít nhất một người duyệt đang bật. Không có thì không cho tạo yêu cầu duyệt. */
    hasApprover: () => Promise<boolean>;
    nowIso?: () => string;
}

/**
 * Nhật ký mọi lần tác động lên một yêu cầu — KỂ CẢ lần bị chặn (không có quyền, tự duyệt, đã xử lý).
 * Ghi vào `approvals/{id}/events`; client KHÔNG được ghi (firestore.rules khoá collection approvals).
 */
export async function logApprovalEvent(db: any, uid: string, approvalId: string, ev: {
    action: string; actorId: string; actorName: string; source: 'line' | 'web'; at: string; attempted?: 'ok' | 'no';
}): Promise<void> {
    await botRef(db, uid).collection('approvals').doc(approvalId).collection('events').add(ev);
}

/**
 * Duyệt / từ chối từ giao diện web (Dashboard). Quyền kiểm ở webhook (canCallerUseBot) trước khi gọi hàm này.
 * Dùng CHUNG luật chuyển trạng thái với nút trên LINE (decideApproval).
 */
export async function decideApprovalForWeb(db: any, uid: string, approvalId: string, decision: 'ok' | 'no',
    actor: { uid: string; name: string }, nowIso: string): Promise<{ ok: true; status: 'approved' | 'rejected' } | { ok: false; reason: 'missing' | 'already' | 'self' }> {
    const ref = botRef(db, uid).collection('approvals').doc(approvalId);
    const actorId = `web:${actor.uid}`;
    const outcome = await db.runTransaction(async (tx: any) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return { ok: false as const, reason: 'missing' as const };
        const d = decideApproval(snap.data(), actorId, decision);
        if (!d.ok) return { ok: false as const, reason: d.reason };
        tx.update(ref, { status: d.status, decidedBy: actorId, decidedByName: actor.name, decidedAt: nowIso, decidedSource: 'web' });
        return { ok: true as const, status: d.status };
    });
    if (outcome.reason !== 'missing') {
        const action = !outcome.ok ? (outcome.reason === 'already' ? 'already_decided' : 'blocked_self') : outcome.status;
        await logApprovalEvent(db, uid, approvalId, { action, actorId, actorName: actor.name, source: 'web', at: nowIso, attempted: decision });
    }
    return outcome;
}

export interface WorkflowContext {
    uid: string;
    senderUserId: string;
    groupId?: string;
    text: string;
}

function botRef(db: any, uid: string) {
    return db.collection('line_bots').doc(uid);
}

async function senderName(db: any, uid: string, userId: string): Promise<string> {
    try {
        const snap = await botRef(db, uid).collection('interacted_users').doc(userId).get();
        const name = snap.exists ? snap.data()?.displayName : '';
        return name || 'Thành viên LINE';
    } catch (_) {
        return 'Thành viên LINE';
    }
}

function vnLabel(iso: string): string {
    return new Date(iso).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
}

/** Trả true nếu đã xử lý (webhook chỉ việc `continue`). */
export async function handleWorkflowText(deps: WorkflowDeps, ctx: WorkflowContext): Promise<boolean> {
    const cmd = parseWorkflowCommand(ctx.text);
    if (!cmd) return false;
    const { db, reply } = deps;
    const nowIso = deps.nowIso ? deps.nowIso() : new Date().toISOString();

    if (cmd.kind === 'ack_create') {
        const id = newShortId();
        const name = await senderName(db, ctx.uid, ctx.senderUserId);
        await botRef(db, ctx.uid).collection('acks').doc(id).set({
            id, body: clip(cmd.body, 2000), groupId: ctx.groupId || null,
            createdBy: ctx.senderUserId, createdByName: name, createdAt: nowIso,
        });
        await reply([buildAckFlex(id, cmd.body, name)]);
        return true;
    }

    if (cmd.kind === 'ack_list') {
        const ref = botRef(db, ctx.uid).collection('acks').doc(cmd.ackId);
        const ackSnap = await ref.get();
        if (!ackSnap.exists) {
            await reply([{ type: 'text', text: `Không tìm thấy thông báo mã ${cmd.ackId}.` }]);
            return true;
        }
        const conf = await ref.collection('confirmations').orderBy('at', 'asc').get();
        const names = conf.docs.map((d: any) => String(d.data().name || 'Thành viên LINE'));
        await reply([{ type: 'text', text: `✅ ĐÃ NHẬN (${names.length}) — mã ${cmd.ackId}\n━━━━━━━━━━━━━━━━━━━━━\n${formatConfirmedNames(names)}` }]);
        return true;
    }

    if (cmd.kind === 'ticket_create') {
        const counterRef = botRef(db, ctx.uid).collection('workflow_meta').doc('counters');
        const name = await senderName(db, ctx.uid, ctx.senderUserId);
        let code = '';
        await db.runTransaction(async (tx: any) => {
            const c = await tx.get(counterRef);
            const next = Number(c.data()?.ticketSeq || 0) + 1;
            code = normalizeTicketCode(String(next));
            tx.set(counterRef, { ticketSeq: next }, { merge: true });
            tx.set(botRef(db, ctx.uid).collection('tickets').doc(code), {
                code, title: clip(cmd.title, 2000), status: 'open', groupId: ctx.groupId || null,
                requesterId: ctx.senderUserId, requesterName: name, createdAt: nowIso,
            });
        });
        await reply([buildTicketFlex({ code, title: cmd.title, requesterName: name, createdLabel: vnLabel(nowIso) })]);
        return true;
    }

    if (cmd.kind === 'ticket_list') {
        const snap = await botRef(db, ctx.uid).collection('tickets').where('status', '==', 'open').limit(30).get();
        const open = snap.docs.map((d: any) => d.data()).sort((a: any, b: any) => String(a.createdAt).localeCompare(String(b.createdAt)));
        if (open.length === 0) {
            await reply([{ type: 'text', text: '🎫 Không có phiếu nào đang mở.' }]);
            return true;
        }
        const lines = open.map((t: any) => `• ${t.code} — ${clip(t.title, 60)} (${clip(t.requesterName, 20)})`);
        await reply([{ type: 'text', text: `🎫 PHIẾU ĐANG MỞ (${open.length})\n━━━━━━━━━━━━━━━━━━━━━\n${lines.join('\n')}\n\nHoàn tất: /yc xong <mã>` }]);
        return true;
    }

    if (cmd.kind === 'ticket_done') {
        await reply([{ type: 'text', text: await closeTicket(db, ctx.uid, cmd.code, ctx.senderUserId, nowIso) }]);
        return true;
    }

    if (cmd.kind === 'approval_create') {
        if (!(await deps.hasApprover())) {
            await reply([{ type: 'text', text: '⚠️ Chưa có người duyệt nào trên bot. Vào Dashboard → Bot LINE → Admin, thêm người có vai trò "Duyệt đơn" rồi thử lại.' }]);
            return true;
        }
        const id = newShortId();
        const name = await senderName(db, ctx.uid, ctx.senderUserId);
        await botRef(db, ctx.uid).collection('approvals').doc(id).set({
            id, body: clip(cmd.body, 2000), status: 'pending', groupId: ctx.groupId || null,
            requesterId: ctx.senderUserId, requesterName: name, createdAt: nowIso,
        });
        await logApprovalEvent(db, ctx.uid, id, { action: 'created', actorId: ctx.senderUserId, actorName: name, source: 'line', at: nowIso });
        await reply([buildApprovalFlex({ id, body: cmd.body, requesterName: name })]);
        return true;
    }

    return false;
}

/** Đóng phiếu (dùng chung cho lệnh chữ và nút "Hoàn tất"). Trả nội dung phản hồi. */
export async function closeTicket(db: any, uid: string, code: string, byUserId: string, nowIso: string): Promise<string> {
    if (!code) return 'Mã phiếu không hợp lệ. Ví dụ: /yc xong YC-0001';
    const ref = botRef(db, uid).collection('tickets').doc(code);
    const byName = await senderName(db, uid, byUserId);
    return db.runTransaction(async (tx: any) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return `Không tìm thấy phiếu ${code}.`;
        const t = snap.data();
        if (!canCloseTicket(t.status)) return `Phiếu ${code} đã được hoàn tất trước đó.`;
        tx.update(ref, { status: 'done', closedAt: nowIso, closedBy: byUserId, closedByName: byName });
        return `✔ Đã hoàn tất phiếu ${code} — ${clip(t.title, 80)}`;
    });
}

/** Trả true nếu nút bấm là của tính năng làm việc nhóm (đã xử lý). */
export async function handleWorkflowPostback(deps: WorkflowDeps, ctx: WorkflowContext & { data: string }): Promise<boolean> {
    const pb = parseWorkflowPostback(ctx.data);
    if (!pb) return false;
    const { db, reply } = deps;
    const nowIso = deps.nowIso ? deps.nowIso() : new Date().toISOString();

    if (pb.w === 'ack') {
        const ref = botRef(db, ctx.uid).collection('acks').doc(pb.id);
        const name = await senderName(db, ctx.uid, ctx.senderUserId);
        const result = await db.runTransaction(async (tx: any) => {
            const a = await tx.get(ref);
            if (!a.exists) return { missing: true as const };
            // Firestore: mọi lượt ĐỌC trong transaction phải làm trước lượt GHI.
            const cRef = ref.collection('confirmations').doc(ctx.senderUserId);
            const c = await tx.get(cRef);
            const all = await tx.get(ref.collection('confirmations'));
            if (c.exists) return { missing: false as const, already: true as const, total: all.size };
            tx.set(cRef, { userId: ctx.senderUserId, name, at: nowIso });
            return { missing: false as const, already: false as const, total: all.size + 1 };
        });
        const text = result.missing ? 'Thông báo này không còn tồn tại.'
            : result.already ? `${name} đã nhận trước đó rồi.`
            : `✅ ${name} đã nhận (${result.total} người).`;
        await reply([{ type: 'text', text }]);
        return true;
    }

    if (pb.w === 'tdone') {
        await reply([{ type: 'text', text: await closeTicket(db, ctx.uid, pb.code, ctx.senderUserId, nowIso) }]);
        return true;
    }

    // pb.w === 'apr'
    const ref = botRef(db, ctx.uid).collection('approvals').doc(pb.id);
    const pre = await ref.get();
    if (!pre.exists) {
        await reply([{ type: 'text', text: 'Yêu cầu này không còn tồn tại.' }]);
        return true;
    }
    const deciderName = await senderName(db, ctx.uid, ctx.senderUserId);
    if (!(await deps.canApprove(ctx.senderUserId))) {
        await logApprovalEvent(db, ctx.uid, pb.id, { action: 'blocked_no_permission', actorId: ctx.senderUserId, actorName: deciderName, source: 'line', at: nowIso, attempted: pb.d });
        await reply([{ type: 'text', text: '⛔ Bạn không có quyền duyệt trên bot này.' }]);
        return true;
    }
    const outcome = await db.runTransaction(async (tx: any) => {
        const snap = await tx.get(ref);
        if (!snap.exists) return { ok: false as const, reason: 'missing' as const };
        const a = snap.data();
        const d = decideApproval(a, ctx.senderUserId, pb.d);
        if (!d.ok) return { ok: false as const, reason: d.reason, a };
        tx.update(ref, { status: d.status, decidedBy: ctx.senderUserId, decidedByName: deciderName, decidedAt: nowIso });
        return { ok: true as const, status: d.status, a };
    });
    if (outcome.reason !== 'missing') {
        const action = !outcome.ok ? (outcome.reason === 'already' ? 'already_decided' : 'blocked_self') : outcome.status;
        await logApprovalEvent(db, ctx.uid, pb.id, { action, actorId: ctx.senderUserId, actorName: deciderName, source: 'line', at: nowIso, attempted: pb.d });
    }
    let text: string;
    if (!outcome.ok && outcome.reason === 'missing') text = 'Yêu cầu này không còn tồn tại.';
    else if (!outcome.ok && outcome.reason === 'already') text = 'Yêu cầu này đã được xử lý trước đó.';
    else if (!outcome.ok && outcome.reason === 'self') text = '⛔ Không thể tự duyệt yêu cầu của chính mình.';
    else if (outcome.ok && outcome.status === 'approved') text = `✅ ${deciderName} đã DUYỆT yêu cầu ${pb.id} (${clip(outcome.a.body, 60)}).`;
    else text = `❌ ${deciderName} đã TỪ CHỐI yêu cầu ${pb.id} (${clip(outcome.a.body, 60)}).`;
    await reply([{ type: 'text', text }]);
    return true;
}
