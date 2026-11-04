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
// Bố cục theo thẻ PMH (functions/src/pmhFlexCard.ts): header màu + viên nhãn bo tròn bên phải, khối nội dung nền nhạt,
// nút bấm lớn bo góc. KHÁC thẻ PMH ở BẢNG MÀU (tím / chàm / hồng — PMH là xanh dương / xanh lá) để không lẫn.

export const WORKFLOW_COLORS = {
    ack: { header: '#7C3AED', soft: '#F5F3FF', ink: '#2E1065', accent: '#6D28D9' },      // tím — xác nhận
    ticket: { header: '#4338CA', soft: '#EEF2FF', ink: '#1E1B4B', accent: '#3730A3' },   // chàm — phiếu công việc
    approval: { header: '#A21CAF', soft: '#FDF4FF', ink: '#4A044E', accent: '#86198F' }, // hồng tím — xin duyệt
} as const;

/** Header màu + tiêu đề bên trái + viên nhãn trắng bên phải (cùng kiểu thẻ PMH). */
function workflowHeader(title: string, pill: string, color: string): any {
    return {
        type: 'box',
        layout: 'horizontal',
        backgroundColor: color,
        paddingAll: '10px',
        alignItems: 'center',
        contents: [
            { type: 'text', text: title, color: '#FFFFFF', weight: 'bold', size: 'sm', flex: 1, wrap: true },
            {
                type: 'box',
                layout: 'vertical',
                flex: 0,
                backgroundColor: '#FFFFFF',
                cornerRadius: '20px',
                paddingStart: '8px',
                paddingEnd: '8px',
                paddingTop: '2px',
                paddingBottom: '2px',
                contents: [{ type: 'text', text: clip(pill, 20), color, weight: 'bold', size: 'xs', align: 'center' }],
            },
        ],
    };
}

/** Dòng "nhãn: giá trị" kiểu thẻ PMH (baseline, nhãn xám, giá trị đậm). */
function workflowRow(label: string, value: string, color: string): any {
    return {
        type: 'box',
        layout: 'baseline',
        margin: 'xs',
        spacing: 'sm',
        contents: [
            { type: 'text', text: label, color: '#64748B', size: 'xxs', flex: 4 },
            { type: 'text', text: clip(value, 60), color, size: 'xs', weight: 'bold', flex: 6, wrap: true },
        ],
    };
}

/** Khối nội dung chính: nền nhạt bo góc, chữ đậm (như ô "PMH ICT100" của thẻ PMH). */
function workflowSoftBox(text: string, soft: string, ink: string): any {
    return {
        type: 'box',
        layout: 'vertical',
        backgroundColor: soft,
        cornerRadius: 'md',
        paddingAll: '8px',
        margin: 'sm',
        contents: [{ type: 'text', text: clip(text, 500), size: 'sm', weight: 'bold', color: ink, wrap: true }],
    };
}

/** Nút lớn bo góc, bấm được (box có action postback) — như nút "Chạm để copy" của thẻ PMH. */
function workflowButton(label: string, data: string, displayText: string, color: string, textColor = '#FFFFFF'): any {
    return {
        type: 'box',
        layout: 'vertical',
        backgroundColor: color,
        cornerRadius: 'lg',
        paddingTop: '10px',
        paddingBottom: '10px',
        paddingStart: '12px',
        paddingEnd: '12px',
        action: { type: 'postback', label, data, displayText },
        contents: [{ type: 'text', text: label, weight: 'bold', size: 'md', color: textColor, align: 'center' }],
    };
}

export function buildAckFlex(id: string, body: string, creatorName: string): any {
    const c = WORKFLOW_COLORS.ack;
    return {
        type: 'flex',
        altText: `Cần xác nhận: ${clip(body, 80)}`,
        contents: {
            type: 'bubble',
            size: 'mega',
            header: workflowHeader('📢 CẦN XÁC NHẬN', `#${id}`, c.header),
            body: {
                type: 'box',
                layout: 'vertical',
                paddingAll: '12px',
                contents: [
                    { type: 'text', text: `@${clip(creatorName, 40)}`, weight: 'bold', size: 'xs', color: c.accent, wrap: true },
                    workflowSoftBox(body, c.soft, c.ink),
                ],
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                paddingAll: '12px',
                contents: [workflowButton('✅ Đã nhận', JSON.stringify({ w: 'ack', id }), 'Đã nhận', c.header)],
            },
        },
    };
}

export function buildTicketFlex(t: { code: string; title: string; requesterName: string; createdLabel: string }): any {
    const c = WORKFLOW_COLORS.ticket;
    return {
        type: 'flex',
        altText: `Phiếu ${t.code}: ${clip(t.title, 60)}`,
        contents: {
            type: 'bubble',
            size: 'mega',
            header: workflowHeader('🎫 PHIẾU CÔNG VIỆC', t.code, c.header),
            body: {
                type: 'box',
                layout: 'vertical',
                paddingAll: '12px',
                contents: [
                    workflowSoftBox(t.title, c.soft, c.ink),
                    workflowRow('Người gửi:', `@${clip(t.requesterName, 40)}`, c.accent),
                    workflowRow('Gửi lúc:', t.createdLabel, c.ink),
                ],
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                paddingAll: '12px',
                contents: [workflowButton('✔ Hoàn tất', JSON.stringify({ w: 'tdone', c: t.code }), `Hoàn tất ${t.code}`, c.header)],
            },
        },
    };
}

export function buildApprovalFlex(a: { id: string; body: string; requesterName: string }): any {
    const c = WORKFLOW_COLORS.approval;
    return {
        type: 'flex',
        altText: `Xin duyệt: ${clip(a.body, 80)}`,
        contents: {
            type: 'bubble',
            size: 'mega',
            header: workflowHeader('📝 XIN DUYỆT', `#${a.id}`, c.header),
            body: {
                type: 'box',
                layout: 'vertical',
                paddingAll: '12px',
                contents: [
                    workflowRow('Người xin:', `@${clip(a.requesterName, 40)}`, c.accent),
                    workflowSoftBox(a.body, c.soft, c.ink),
                ],
            },
            footer: {
                type: 'box',
                layout: 'horizontal',
                spacing: 'sm',
                paddingAll: '12px',
                contents: [
                    workflowButton('Duyệt', JSON.stringify({ w: 'apr', id: a.id, d: 'ok' }), 'Duyệt', c.header),
                    workflowButton('Từ chối', JSON.stringify({ w: 'apr', id: a.id, d: 'no' }), 'Từ chối', '#E2E8F0', '#334155'),
                ],
            },
        },
    };
}

// ───────────────────────── TAG THEO NHÓM VAI TRÒ (@ca-sáng, @kho, @thu-ngân) ─────────────────────────
// Nhóm vai trò lưu ở `line_bots/{uid}/tag_groups/{mã nhóm}` = { name, members: [{userId, name}] }.
// Thành viên TỰ THAM GIA bằng `/nhom vao <tên nhóm>` (không cần nhập ID tay); `/nhom ra` để rời nhóm.
// Gõ `@ca-sáng <nội dung>` trong nhóm chat → bot tag tất cả thành viên bằng mention chính thức của LINE.
// Chỉ phản hồi bằng replyToken → không tính hạn mức tin push.

/** Tối đa số người được tag trong một tin (tránh tin quá dài / quá nhiều mention). */
export const MAX_TAG_MEMBERS = 50;

/** Mã nhóm không phân biệt hoa-thường, dấu và khoảng trắng: "Ca Sáng" = "ca-sáng" = "ca-sang". */
export function toTagId(name: string): string {
    return String(name || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .trim().toLowerCase().replace(/[\s_]+/g, '-');
}

export type TagCommand =
    | { kind: 'tag'; group: string; body: string }
    | { kind: 'nhom_vao'; group: string }
    | { kind: 'nhom_ra'; group: string }
    | { kind: 'nhom_ds'; group?: string };

/** Nhận diện "@tên-nhóm [nội dung]" và "/nhom vao|ra|ds [tên nhóm]". Trả null nếu không phải. */
export function parseTagCommand(raw: string): TagCommand | null {
    const text = String(raw || '').trim().replace(/\s+/g, ' ');
    const tag = /^@(\S+)(?:\s+([\s\S]*))?$/.exec(text);
    if (tag) {
        const group = tag[1].replace(/^[.,:;!?]+|[.,:;!?]+$/g, '');
        if (!group || toTagId(group) === '') return null;
        return { kind: 'tag', group, body: (tag[2] || '').trim() };
    }
    const nhom = /^[./!#]nhom\s+(vao|ra|ds)(?:\s+(.+))?$/i.exec(text);
    if (nhom) {
        const action = nhom[1].toLowerCase();
        const group = (nhom[2] || '').trim();
        if (action === 'ds') return { kind: 'nhom_ds', group: group || undefined };
        if (!group) return null;
        return action === 'vao' ? { kind: 'nhom_vao', group } : { kind: 'nhom_ra', group };
    }
    return null;
}

/**
 * Dựng tin tag: "📣 Ca sáng: @An @Bình …" + nội dung. Vị trí mention tính theo UTF-16 (đúng cách LINE đếm).
 * Trả null nếu nhóm không có thành viên.
 */
export function buildTagMessage(displayName: string, members: Array<{ userId: string; name: string }>, body: string): any | null {
    const list = members.filter(m => m && m.userId).slice(0, MAX_TAG_MEMBERS);
    if (list.length === 0) return null;
    let text = `📣 ${clip(displayName, 40)}: `;
    const mentionees: Array<{ index: number; length: number; userId: string }> = [];
    list.forEach((m, i) => {
        if (i > 0) text += ' ';
        const tag = `@${clip(m.name || 'Thành viên', 40)}`;
        mentionees.push({ index: text.length, length: tag.length, userId: m.userId });
        text += tag;
    });
    if (body) text += `\n${clip(body, 2000)}`;
    if (members.length > MAX_TAG_MEMBERS) text += `\n(… còn ${members.length - MAX_TAG_MEMBERS} người chưa được tag trong tin này)`;
    return { type: 'text', text, mention: { mentionees } };
}

export interface TagDeps {
    db: any;
    reply: (messages: any[]) => Promise<unknown>;
    nowIso?: () => string;
}

/** Trả true nếu đã xử lý. "@tên" không khớp nhóm nào thì trả false để webhook xử lý tiếp như cũ. */
export async function handleTagText(deps: TagDeps, ctx: { uid: string; senderUserId: string; groupId?: string; text: string }): Promise<boolean> {
    const cmd = parseTagCommand(ctx.text);
    if (!cmd) return false;
    const { db, reply } = deps;
    const nowIso = deps.nowIso ? deps.nowIso() : new Date().toISOString();
    const groupsCol = botRef(db, ctx.uid).collection('tag_groups');

    if (cmd.kind === 'tag') {
        if (!ctx.groupId) return false; // tag chỉ có nghĩa trong nhóm chat
        const snap = await groupsCol.doc(toTagId(cmd.group)).get();
        if (!snap.exists) return false;
        const g = snap.data() || {};
        const msg = buildTagMessage(String(g.name || cmd.group), Array.isArray(g.members) ? g.members : [], cmd.body);
        if (!msg) {
            await reply([{ type: 'text', text: `Nhóm ${cmd.group} chưa có thành viên. Gõ /nhom vao ${cmd.group} để tham gia.` }]);
            return true;
        }
        await reply([msg]);
        return true;
    }

    if (cmd.kind === 'nhom_vao' || cmd.kind === 'nhom_ra') {
        const id = toTagId(cmd.group);
        if (!id) return false;
        const ref = groupsCol.doc(id);
        const name = await senderName(db, ctx.uid, ctx.senderUserId);
        const outcome = await db.runTransaction(async (tx: any) => {
            const snap = await tx.get(ref);
            const g = snap.exists ? (snap.data() || {}) : {};
            const members: Array<{ userId: string; name: string }> = Array.isArray(g.members) ? g.members : [];
            const has = members.some(m => m.userId === ctx.senderUserId);
            if (cmd.kind === 'nhom_vao') {
                if (has) return { changed: false, count: members.length };
                const next = [...members, { userId: ctx.senderUserId, name }];
                tx.set(ref, { id, name: g.name || cmd.group, members: next, updatedAt: nowIso }, { merge: true });
                return { changed: true, count: next.length };
            }
            if (!has) return { changed: false, count: members.length, missing: true };
            const next = members.filter(m => m.userId !== ctx.senderUserId);
            tx.set(ref, { members: next, updatedAt: nowIso }, { merge: true });
            return { changed: true, count: next.length };
        });
        const display = cmd.group;
        let text: string;
        if (cmd.kind === 'nhom_vao') {
            text = outcome.changed
                ? `✅ ${name} đã vào nhóm @${display} (${outcome.count} người).`
                : `${name} đã ở trong nhóm @${display} rồi.`;
        } else {
            text = outcome.changed
                ? `✅ ${name} đã rời nhóm @${display} (còn ${outcome.count} người).`
                : `${name} chưa ở trong nhóm @${display}.`;
        }
        await reply([{ type: 'text', text }]);
        return true;
    }

    // nhom_ds
    if (cmd.group) {
        const snap = await groupsCol.doc(toTagId(cmd.group)).get();
        if (!snap.exists) {
            await reply([{ type: 'text', text: `Chưa có nhóm ${cmd.group}. Gõ /nhom vao ${cmd.group} để tạo và tham gia.` }]);
            return true;
        }
        const g = snap.data() || {};
        const members: Array<{ name: string }> = Array.isArray(g.members) ? g.members : [];
        const lines = members.map((m, i) => `${i + 1}. ${clip(m.name, 40)}`);
        await reply([{ type: 'text', text: `👥 @${g.name || cmd.group} (${members.length} người)\n━━━━━━━━━━━━━━━━━━━━━\n${lines.join('\n') || 'Chưa có thành viên.'}` }]);
        return true;
    }
    const all = await groupsCol.get();
    const groups = all.docs.map((d: any) => d.data()).filter((g: any) => g && g.name);
    if (groups.length === 0) {
        await reply([{ type: 'text', text: 'Chưa có nhóm vai trò nào. Gõ /nhom vao <tên nhóm> để tạo, ví dụ /nhom vao ca-sáng' }]);
        return true;
    }
    const lines = groups.map((g: any) => `• @${g.name} — ${Array.isArray(g.members) ? g.members.length : 0} người`);
    await reply([{ type: 'text', text: `👥 NHÓM VAI TRÒ\n━━━━━━━━━━━━━━━━━━━━━\n${lines.join('\n')}\n\nGọi nhóm: @tên-nhóm nội dung` }]);
    return true;
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
