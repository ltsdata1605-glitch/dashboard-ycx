import { describe, expect, it } from 'vitest';
import {
    parseWorkflowCommand, normalizeTicketCode, decideApproval, parseWorkflowPostback,
    formatConfirmedNames, buildAckFlex, buildTicketFlex, buildApprovalFlex,
    handleWorkflowText, handleWorkflowPostback, closeTicket,
} from '../../functions/src/lineWorkflows';

// ───────── Firestore giả trong bộ nhớ (đủ cho get/set/update/where/limit/transaction) ─────────
class FakeDb {
    store = new Map<string, any>();
    collection(name: string): any { return new ColRef(this, name); }
    async runTransaction(fn: (tx: any) => Promise<any>) {
        const tx = {
            get: (x: any) => x.get(),
            set: (ref: any, data: any, opts?: any) => ref.set(data, opts),
            update: (ref: any, data: any) => ref.update(data),
        };
        return fn(tx);
    }
}
class ColRef {
    constructor(private db: FakeDb, public path: string) {}
    doc(id: string) { return new DocRef(this.db, `${this.path}/${id}`); }
    where(field: string, op: string, value: any) { return new Query(this.db, this.path, [[field, op, value]], null); }
    orderBy(_f: string) { return new Query(this.db, this.path, [], null); }
    limit(n: number) { return new Query(this.db, this.path, [], n); }
    async get() { return new Query(this.db, this.path, [], null).get(); }
}
class DocRef {
    constructor(private db: FakeDb, public path: string) {}
    get id() { return this.path.split('/').pop()!; }
    collection(name: string) { return new ColRef(this.db, `${this.path}/${name}`); }
    async get() {
        const has = this.db.store.has(this.path);
        return { exists: has, id: this.id, data: () => (has ? { ...this.db.store.get(this.path) } : undefined) };
    }
    async set(data: any, opts?: { merge?: boolean }) {
        const prev = opts?.merge ? (this.db.store.get(this.path) || {}) : {};
        this.db.store.set(this.path, { ...prev, ...data });
    }
    async update(data: any) {
        if (!this.db.store.has(this.path)) throw new Error('NOT_FOUND ' + this.path);
        this.db.store.set(this.path, { ...this.db.store.get(this.path), ...data });
    }
}
class Query {
    constructor(private db: FakeDb, private col: string, private filters: [string, string, any][], private max: number | null) {}
    where(field: string, op: string, value: any) { return new Query(this.db, this.col, [...this.filters, [field, op, value]], this.max); }
    orderBy(_f: string) { return this; }
    limit(n: number) { return new Query(this.db, this.col, this.filters, n); }
    async get() {
        const prefix = this.col + '/';
        let docs = [...this.db.store.entries()]
            .filter(([p]) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
            .map(([p, d]) => ({ id: p.slice(prefix.length), data: () => ({ ...d }) }));
        for (const [f, op, v] of this.filters) {
            if (op === '==') docs = docs.filter(d => d.data()[f] === v);
        }
        if (this.max !== null) docs = docs.slice(0, this.max);
        return { docs, size: docs.length };
    }
}

const NOW = '2026-11-03T03:00:00.000Z';
const UID = 'bot-1';

function setup() {
    const db = new FakeDb();
    db.store.set(`line_bots/${UID}/interacted_users/U_AN`, { displayName: 'Nguyễn An' });
    db.store.set(`line_bots/${UID}/interacted_users/U_BINH`, { displayName: 'Trần Bình' });
    const sent: any[][] = [];
    const deps = (approver = true) => ({
        db,
        reply: async (m: any[]) => { sent.push(m); return true; },
        canApprove: async () => approver,
        nowIso: () => NOW,
    });
    const last = () => sent[sent.length - 1];
    return { db, sent, deps, last };
}
const ctx = (senderUserId: string, text: string) => ({ uid: UID, senderUserId, groupId: 'G1', text });

describe('phân tích lệnh làm việc nhóm', () => {
    it('nhận diện /xacnhan và xác nhận có dấu', () => {
        expect(parseWorkflowCommand('/xacnhan Họp 8h sáng mai')).toEqual({ kind: 'ack_create', body: 'Họp 8h sáng mai' });
        expect(parseWorkflowCommand('!xác nhận Kiểm kê kho')).toEqual({ kind: 'ack_create', body: 'Kiểm kê kho' });
        expect(parseWorkflowCommand('.xacnhan ds ab12CD3f')).toEqual({ kind: 'ack_list', ackId: 'ab12CD3f' });
    });
    it('"/xacnhan" trơ trọi không phải lệnh (tránh bắt nhầm)', () => {
        expect(parseWorkflowCommand('/xacnhan')).toBeNull();
        expect(parseWorkflowCommand('/yc')).toBeNull();
        expect(parseWorkflowCommand('/xinphep   ')).toBeNull();
    });
    it('phiếu: tạo, liệt kê, hoàn tất', () => {
        expect(parseWorkflowCommand('/yc Sửa máy lạnh kho 2')).toEqual({ kind: 'ticket_create', title: 'Sửa máy lạnh kho 2' });
        expect(parseWorkflowCommand('/yc ds')).toEqual({ kind: 'ticket_list' });
        expect(parseWorkflowCommand('/yc xong 7')).toEqual({ kind: 'ticket_done', code: 'YC-0007' });
        expect(parseWorkflowCommand('/yc xong yc-0012')).toEqual({ kind: 'ticket_done', code: 'YC-0012' });
    });
    it('xin duyệt: /xinphep', () => {
        expect(parseWorkflowCommand('/xinphep nghỉ 1 ngày 5/11')).toEqual({ kind: 'approval_create', body: 'nghỉ 1 ngày 5/11' });
    });
    it('không ăn nhầm tin thường / lệnh cũ', () => {
        for (const t of ['yc', 'hôm nay yc gì', 'csd', 'id', 'dsbc', 'xacnhan nhưng không có dấu /', 'Xin chào']) {
            expect(parseWorkflowCommand(t), t).toBeNull();
        }
    });
    it('chuẩn hoá mã phiếu', () => {
        expect(normalizeTicketCode('1')).toBe('YC-0001');
        expect(normalizeTicketCode('YC-1234')).toBe('YC-1234');
        expect(normalizeTicketCode('abc')).toBe('');
    });
});

describe('nút bấm & chuyển trạng thái', () => {
    it('đọc đúng dữ liệu nút của 3 tính năng, bỏ qua dữ liệu của tính năng khác', () => {
        expect(parseWorkflowPostback(JSON.stringify({ w: 'ack', id: 'x1' }))).toEqual({ w: 'ack', id: 'x1' });
        expect(parseWorkflowPostback(JSON.stringify({ w: 'tdone', c: 'YC-0003' }))).toEqual({ w: 'tdone', code: 'YC-0003' });
        expect(parseWorkflowPostback(JSON.stringify({ w: 'apr', id: 'a1', d: 'no' }))).toEqual({ w: 'apr', id: 'a1', d: 'no' });
        expect(parseWorkflowPostback(JSON.stringify({ w: 'apr', id: 'a1', d: 'maybe' }))).toBeNull();
        expect(parseWorkflowPostback('action=claim_pmh&prod=X')).toBeNull();
        expect(parseWorkflowPostback('{"action":"claim_pmh"}')).toBeNull();
    });
    it('duyệt: chỉ khi đang chờ; không tự duyệt yêu cầu của mình', () => {
        expect(decideApproval({ status: 'pending', requesterId: 'U1' }, 'U2', 'ok')).toEqual({ ok: true, status: 'approved' });
        expect(decideApproval({ status: 'pending', requesterId: 'U1' }, 'U2', 'no')).toEqual({ ok: true, status: 'rejected' });
        expect(decideApproval({ status: 'pending', requesterId: 'U1' }, 'U1', 'ok')).toEqual({ ok: false, reason: 'self' });
        expect(decideApproval({ status: 'approved', requesterId: 'U1' }, 'U2', 'no')).toEqual({ ok: false, reason: 'already' });
    });
    it('danh sách người đã nhận: cắt bớt khi quá dài, không vỡ khi rỗng', () => {
        expect(formatConfirmedNames([])).toMatch(/Chưa có ai/);
        const many = Array.from({ length: 35 }, (_, i) => `NV ${i + 1}`);
        const out = formatConfirmedNames(many);
        expect(out).toContain('… và 5 người khác');
        expect(out.split('\n').filter(l => /^\d+\./.test(l))).toHaveLength(30);
    });
});

describe('dựng tin Flex', () => {
    it('nút Đã nhận / Hoàn tất / Duyệt-Từ chối có postback đúng định dạng và nhãn ≤ 20 ký tự', () => {
        const ack = buildAckFlex('ab12CD3f', 'Họp sáng', 'An');
        const ackBtn = ack.contents.footer.contents[0].action;
        expect(JSON.parse(ackBtn.data)).toEqual({ w: 'ack', id: 'ab12CD3f' });
        const tk = buildTicketFlex({ code: 'YC-0001', title: 'Sửa đèn', requesterName: 'An', createdLabel: 'x' });
        expect(JSON.parse(tk.contents.footer.contents[0].action.data)).toEqual({ w: 'tdone', c: 'YC-0001' });
        const ap = buildApprovalFlex({ id: 'a1', body: 'nghỉ', requesterName: 'An' });
        const [yes, no] = ap.contents.footer.contents;
        expect(JSON.parse(yes.action.data)).toEqual({ w: 'apr', id: 'a1', d: 'ok' });
        expect(JSON.parse(no.action.data)).toEqual({ w: 'apr', id: 'a1', d: 'no' });
        for (const b of [ackBtn, tk.contents.footer.contents[0].action, yes.action, no.action]) {
            expect(b.label.length).toBeLessThanOrEqual(20);
        }
        // Dữ liệu postback phải ≤ 300 byte theo giới hạn LINE
        for (const b of [ackBtn, yes.action, no.action]) {
            expect(new TextEncoder().encode(b.data).length).toBeLessThanOrEqual(300);
        }
    });
});

describe('luồng xử lý (Firestore giả)', () => {
    it('xác nhận Đã nhận: mỗi người một lần, đếm đúng, xem danh sách', async () => {
        const { db, deps, last } = setup();
        expect(await handleWorkflowText(deps(), ctx('U_AN', '/xacnhan Kiểm kê 6h'))).toBe(true);
        const ackId = last()[0].contents.footer.contents[0].action.data;
        const id = JSON.parse(ackId).id;

        await handleWorkflowPostback(deps(), { ...ctx('U_AN', ''), data: ackId });
        expect(last()[0].text).toBe('✅ Nguyễn An đã nhận (1 người).');

        await handleWorkflowPostback(deps(), { ...ctx('U_BINH', ''), data: ackId });
        expect(last()[0].text).toBe('✅ Trần Bình đã nhận (2 người).');

        await handleWorkflowPostback(deps(), { ...ctx('U_AN', ''), data: ackId });
        expect(last()[0].text).toBe('Nguyễn An đã nhận trước đó rồi.');

        await handleWorkflowText(deps(), ctx('U_AN', `/xacnhan ds ${id}`));
        expect(last()[0].text).toContain('ĐÃ NHẬN (2)');
        expect(last()[0].text).toContain('Nguyễn An');
        expect(db.store.has(`line_bots/${UID}/acks/${id}`)).toBe(true);
    });

    it('nút Đã nhận của thông báo không tồn tại', async () => {
        const { deps, last } = setup();
        await handleWorkflowPostback(deps(), { ...ctx('U_AN', ''), data: JSON.stringify({ w: 'ack', id: 'khongco' }) });
        expect(last()[0].text).toBe('Thông báo này không còn tồn tại.');
    });

    it('phiếu: đánh số tăng dần, liệt kê phiếu mở, đóng một lần', async () => {
        const { db, deps, last } = setup();
        await handleWorkflowText(deps(), ctx('U_AN', '/yc Sửa máy lạnh'));
        expect(last()[0].altText).toContain('YC-0001');
        await handleWorkflowText(deps(), ctx('U_BINH', '/yc Thay bóng đèn'));
        expect(last()[0].altText).toContain('YC-0002');

        await handleWorkflowText(deps(), ctx('U_AN', '/yc ds'));
        expect(last()[0].text).toContain('PHIẾU ĐANG MỞ (2)');

        await handleWorkflowText(deps(), ctx('U_AN', '/yc xong 1'));
        expect(last()[0].text).toBe('✔ Đã hoàn tất phiếu YC-0001 — Sửa máy lạnh');
        await handleWorkflowText(deps(), ctx('U_AN', '/yc xong YC-0001'));
        expect(last()[0].text).toBe('Phiếu YC-0001 đã được hoàn tất trước đó.');

        await handleWorkflowText(deps(), ctx('U_AN', '/yc ds'));
        expect(last()[0].text).toContain('PHIẾU ĐANG MỞ (1)');
        expect(last()[0].text).not.toContain('YC-0001');

        await handleWorkflowText(deps(), ctx('U_AN', '/yc xong YC-0099'));
        expect(last()[0].text).toBe('Không tìm thấy phiếu YC-0099.');
        expect(db.store.get(`line_bots/${UID}/workflow_meta/counters`)).toEqual({ ticketSeq: 2 });
    });

    it('đóng phiếu bằng nút Hoàn tất dùng chung logic với lệnh chữ', async () => {
        const { deps, last } = setup();
        await handleWorkflowText(deps(), ctx('U_AN', '/yc Việc A'));
        await handleWorkflowPostback(deps(), { ...ctx('U_BINH', ''), data: JSON.stringify({ w: 'tdone', c: 'YC-0001' }) });
        expect(last()[0].text).toContain('Đã hoàn tất phiếu YC-0001');
    });

    it('closeTicket: mã sai định dạng không gọi Firestore', async () => {
        const { db } = setup();
        expect(await closeTicket(db, UID, '', 'U_AN', NOW)).toMatch(/không hợp lệ/);
    });

    it('xin duyệt: chỉ người có quyền được duyệt; không tự duyệt; quyết định một lần', async () => {
        const { db, deps, last } = setup();
        await handleWorkflowText(deps(), ctx('U_BINH', '/xinphep nghỉ 1 ngày'));
        const approveData = last()[0].contents.footer.contents[0].action.data;
        const rejectData = last()[0].contents.footer.contents[1].action.data;
        const id = JSON.parse(approveData).id;

        // Người xin tự bấm duyệt — bị chặn
        await handleWorkflowPostback(deps(), { ...ctx('U_BINH', ''), data: approveData });
        expect(last()[0].text).toBe('⛔ Không thể tự duyệt yêu cầu của chính mình.');

        // Người không có quyền — bị chặn
        await handleWorkflowPostback(deps(false), { ...ctx('U_AN', ''), data: approveData });
        expect(last()[0].text).toBe('⛔ Bạn không có quyền duyệt trên bot này.');
        expect(db.store.get(`line_bots/${UID}/approvals/${id}`).status).toBe('pending');

        // Quản lý duyệt
        await handleWorkflowPostback(deps(), { ...ctx('U_AN', ''), data: approveData });
        expect(last()[0].text).toBe('✅ Nguyễn An đã DUYỆT yêu cầu ' + id + ' (nghỉ 1 ngày).');
        expect(db.store.get(`line_bots/${UID}/approvals/${id}`)).toMatchObject({ status: 'approved', decidedBy: 'U_AN' });

        // Bấm lại (từ chối) sau khi đã duyệt — không đổi được
        await handleWorkflowPostback(deps(), { ...ctx('U_AN', ''), data: rejectData });
        expect(last()[0].text).toBe('Yêu cầu này đã được xử lý trước đó.');
        expect(db.store.get(`line_bots/${UID}/approvals/${id}`).status).toBe('approved');
    });

    it('nút không thuộc tính năng này thì trả false (webhook xử lý tiếp)', async () => {
        const { deps, sent } = setup();
        expect(await handleWorkflowPostback(deps(), { ...ctx('U_AN', ''), data: 'action=claim_pmh&prod=X' })).toBe(false);
        expect(await handleWorkflowText(deps(), ctx('U_AN', 'csd'))).toBe(false);
        expect(sent).toHaveLength(0);
    });
});
