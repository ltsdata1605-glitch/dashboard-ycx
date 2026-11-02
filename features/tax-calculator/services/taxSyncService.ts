import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { toast } from '../../../components/shared/ui/toast';
import { db, auth } from '../../../services/firebase';
import { SavedTaxRecord } from '../types/tax.types';
import { taxIndexedDbService } from './taxIndexedDbService';
import { isSameTaxRecord } from './taxHistoryGrouping';

/**
 * Khử trùng danh sách lịch sử:
 * Giữ lại bản ghi mới nhất cho mỗi cặp (nhân viên, tháng lương), loại bỏ các bản ghi trùng cũ.
 */
function deduplicateTaxRecords(records: SavedTaxRecord[]): { deduplicated: SavedTaxRecord[]; removedIds: number[] } {
    const deduplicated: SavedTaxRecord[] = [];
    const removedIds: number[] = [];
    const sorted = [...records].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    for (const r of sorted) {
        const exists = deduplicated.some(d => isSameTaxRecord(d, r));
        if (!exists) {
            deduplicated.push(r);
        } else {
            if (typeof r.id === 'number') {
                removedIds.push(r.id);
            }
        }
    }
    return { deduplicated, removedIds };
}

const FIRESTORE_DOC_KEY = 'tax_calculator_history';
/**
 * Chủ dự án (2026-09-30): BỎ trần 100 bản ghi. Còn lại đúng 1 giới hạn KỸ THUẬT: cả lịch sử nằm trong
 * 1 document Firestore, mà document tối đa 1 MiB. Mỗi bản ghi ~0,5–1,5 KB → ~700–2.000 bản (một người
 * lưu mỗi tháng = hàng chục năm). Chỉ khi bản trên cloud chạm ngưỡng dưới đây mới bỏ bớt bản CŨ NHẤT
 * khỏi bản cloud (bản trên máy giữ đủ) và báo người dùng. Muốn không giới hạn tuyệt đối thì phải tách
 * mỗi bản ghi 1 document (di trú dữ liệu) — chưa làm.
 */
const CLOUD_MAX_BYTES = 900_000;
function catTheoDungLuong(records: SavedTaxRecord[]): SavedTaxRecord[] {
    let out = records;
    // Ước lượng theo độ dài JSON (UTF-8 của tiếng Việt ≤ 3 byte/ký tự → nhân 1,5 cho an toàn)
    while (out.length > 1 && JSON.stringify(out).length * 1.5 > CLOUD_MAX_BYTES) {
        out = out.slice(0, Math.floor(out.length * 0.95));
    }
    if (out.length < records.length) {
        toast(`Lịch sử Thuế trên cloud đã gần giới hạn 1 MB — ${records.length - out.length} bản cũ nhất chỉ còn lưu trên máy này.`, { id: 'tax-cloud-full', duration: 8000 });
    }
    return out;
}

/**
 * Audit A31 (2026-09-30): trước đây mọi thao tác là getDoc → sửa mảng → setDoc. Hai thiết bị (hoặc 2
 * lượt lưu liền nhau) chen giữa nhau thì lượt ghi sau GHI ĐÈ mảng mà lượt trước vừa thêm → mất bản
 * ghi. Nay đọc-sửa-ghi trong MỘT transaction: Firestore tự chạy lại `sua` với dữ liệu mới nhất nếu
 * có ai ghi chen vào. Cùng document, cùng định dạng — không đổi rules, không di trú.
 * `sua` trả null = không cần ghi. Trả về false nếu cloud lỗi (bản trên máy vẫn đã lưu).
 */
async function suaMangTrenCloud(uid: string, sua: (records: SavedTaxRecord[], exists: boolean) => SavedTaxRecord[] | null, imLang = false): Promise<boolean> {
    const docRef = doc(db, 'users', uid, 'setting', FIRESTORE_DOC_KEY);
    try {
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(docRef);
            const current: SavedTaxRecord[] = snap.exists() ? snap.data()?.records || [] : [];
            const next = sua(current, snap.exists());
            if (next) tx.set(docRef, { records: next, updatedAt: serverTimestamp() }, { merge: true });
        });
        return true;
    } catch (err) {
        console.error('[TaxSync] Lỗi đồng bộ Firestore:', err);
        // Trước đây chỉ log — người dùng tưởng đã lên cloud. Nay báo rõ.
        if (!imLang) toast.error('Đã lưu trên máy này nhưng CHƯA đồng bộ lên cloud (mất mạng?) — sẽ tự gửi lại lần mở Thuế sau.', { id: 'tax-cloud-sync', duration: 6000 });
        return false;
    }
}

/**
 * Audit D11 (2026-10-08) — HÀNG CHỜ gửi lại lên cloud. Firestore của app gốc không bật bộ đệm offline và
 * `runTransaction` luôn cần mạng, nên mất mạng = lượt ghi cloud hỏng ngay. Trước đây hỏng là thôi: bản ghi mới
 * không bao giờ lên cloud; tệ hơn, xoá / đổi tháng hỏng thì lần mở sau getAllRecords lấy bản CLOUD đè lại máy
 * → bản đã xoá hiện về, tháng vừa sửa trở lại tháng cũ. Nay ghi lại createdAt của thao tác hỏng; lần
 * getAllRecords sau gửi lại trước khi hợp nhất, và lúc hợp nhất tôn trọng thao tác còn chờ.
 * Lưu localStorage theo uid (vài chục chuỗi createdAt — nhỏ), không lẫn giữa các tài khoản.
 */
type HangCho = { upsert: string[]; del: string[]; clearAll: boolean };
const khoaHangCho = (uid: string) => `taxCloudOutbox_v1:${uid}`;
export function docHangCho(uid: string): HangCho {
    try {
        const v = JSON.parse(localStorage.getItem(khoaHangCho(uid)) || 'null');
        if (v && Array.isArray(v.upsert) && Array.isArray(v.del)) return { upsert: v.upsert, del: v.del, clearAll: !!v.clearAll };
    } catch { /* hỏng thì coi như trống */ }
    return { upsert: [], del: [], clearAll: false };
}
function ghiHangCho(uid: string, h: HangCho) {
    try {
        if (!h.upsert.length && !h.del.length && !h.clearAll) localStorage.removeItem(khoaHangCho(uid));
        else localStorage.setItem(khoaHangCho(uid), JSON.stringify(h));
    } catch { /* localStorage đầy/bị chặn — mất hàng chờ, chỉ còn bản trên máy */ }
}
function themVaoHangCho(uid: string, loai: 'upsert' | 'del', createdAts: Iterable<string>) {
    const h = docHangCho(uid);
    for (const c of createdAts) {
        if (loai === 'del') { h.upsert = h.upsert.filter(x => x !== c); if (!h.del.includes(c)) h.del.push(c); }
        else if (!h.del.includes(c) && !h.upsert.includes(c)) h.upsert.push(c);
    }
    ghiHangCho(uid, h);
}

/** Same replacement rule for immediate saves and offline replay; local IDs are not cloud identities. */
function replaceCloudRecord(records: SavedTaxRecord[], record: SavedTaxRecord): SavedTaxRecord[] {
    return [record, ...records.filter(r => r.createdAt !== record.createdAt && !isSameTaxRecord(r, record))];
}

/** Gửi lại hàng chờ. Trả về hàng chờ CÒN LẠI (rỗng nếu đã gửi xong). */
async function guiHangCho(uid: string): Promise<HangCho> {
    const h = docHangCho(uid);
    if (!h.upsert.length && !h.del.length && !h.clearAll) return h;
    const local = await taxIndexedDbService.getAll();
    const banMay = new Map(local.map(r => [r.createdAt, r]));
    const ok = await suaMangTrenCloud(uid, current => {
        let next = h.clearAll ? [] : current;
        if (h.del.length) next = next.filter(r => !h.del.includes(r.createdAt));
        for (const c of h.upsert) {
            const r = banMay.get(c);
            if (!r) continue; // đã xoá trên máy sau đó
            next = replaceCloudRecord(next, { ...r, syncedToCloud: true });
        }
        return catTheoDungLuong(next);
    }, true);
    if (!ok) return h;
    const trong: HangCho = { upsert: [], del: [], clearAll: false };
    ghiHangCho(uid, trong);
    return trong;
}

/**
 * Đổi khoá (id cục bộ hoặc createdAt) sang createdAt — CHỈ createdAt mới so được với bản trên cloud
 * (id là khoá tự tăng riêng từng máy, audit D08).
 */
async function toCreatedAts(keys: (number | string)[]): Promise<Set<string>> {
    const out = new Set<string>(keys.filter((k): k is string => typeof k === 'string'));
    const numeric = keys.filter((k): k is number => typeof k === 'number');
    if (numeric.length > 0) {
        const local = await taxIndexedDbService.getAll();
        for (const r of local) if (numeric.includes(r.id as number)) out.add(r.createdAt);
    }
    return out;
}

/**
 * Service đồng bộ dữ liệu tính thuế 3 lớp:
 * 1. IndexedDB (Lưu trữ cục bộ nhanh, hoạt động offline)
 * 2. LocalStorage (Lưu state form nhập gần nhất)
 * 3. Firebase Firestore (Lưu trữ cloud theo tài khoản người dùng)
 */
export const taxSyncService = {
    /**
     * Kiểm tra trạng thái kết nối Cloud
     */
    isCloudReady(): boolean {
        return !!auth.currentUser;
    },

    /**
     * Lấy toàn bộ lịch sử: ưu tiên IndexedDB kết hợp đồng bộ Firestore
     */
    async getAllRecords(): Promise<SavedTaxRecord[]> {
        const localRecords = await taxIndexedDbService.getAll();

        const user = auth.currentUser;
        if (!user) {
            return localRecords;
        }

        try {
            const conCho = await guiHangCho(user.uid);
            const choXoa = new Set(conCho.del);
            const choGhi = new Set(conCho.upsert);
            const docRef = doc(db, 'users', user.uid, 'setting', FIRESTORE_DOC_KEY);
            const snap = await getDoc(docRef);

            if (snap.exists()) {
                const cloudData = snap.data();
                // Thao tác còn chờ gửi thắng bản cloud: đã xoá trên máy → không kéo về lại; đã sửa trên máy → giữ bản máy.
                const cloudRecords: SavedTaxRecord[] = conCho.clearAll ? [] : (cloudData?.records || [])
                    .filter((r: SavedTaxRecord) => !choXoa.has(r.createdAt) && !choGhi.has(r.createdAt));

                // Hợp nhất theo `createdAt` — danh tính DUY NHẤT xuyên thiết bị (audit D08). `id` là khoá
                // tự tăng của IndexedDB TỪNG MÁY: máy A và máy B đều có id 1 cho 2 bản ghi khác nhau. Trước
                // đây bản cloud giữ nguyên id của máy khác → danh sách có 2 dòng cùng id, chọn/xoá/sửa
                // tháng theo id chạm nhầm bản ghi. Nay bản chỉ có trên cloud được LƯU VÀO MÁY này (nhận id
                // cục bộ riêng) — vừa hết trùng id, vừa xem lại được khi mất mạng.
                const localByCreatedAt = new Map(localRecords.map(r => [r.createdAt, r]));
                const candidates = new Map<string, SavedTaxRecord>();
                for (const r of localRecords) candidates.set(r.createdAt, { ...r, syncedToCloud: false });
                for (const cr of cloudRecords) {
                    candidates.set(cr.createdAt, {
                        ...cr, id: localByCreatedAt.get(cr.createdAt)?.id, syncedToCloud: true,
                    });
                }

                // Select before writing: save overwrites matching person/month in place.
                // Saving losers first can replace the winner's ID and cleanup can then delete it.
                const winners = deduplicateTaxRecords([...candidates.values()]).deduplicated;
                const persisted: SavedTaxRecord[] = [];
                for (const winner of winners) {
                    if (localByCreatedAt.has(winner.createdAt)) {
                        persisted.push(winner);
                        continue;
                    }
                    const { id: _cloudId, ...rest } = winner;
                    try {
                        const localId = await taxIndexedDbService.save(rest);
                        persisted.push({ ...rest, id: localId });
                    } catch (saveErr) {
                        console.warn('[TaxSync] Không lưu được bản cloud vào máy, giữ bản local:', saveErr);
                        // A failed import must not remove the only durable local version.
                        persisted.push(...deduplicateTaxRecords(
                            localRecords.filter(r => isSameTaxRecord(r, winner))
                        ).deduplicated);
                    }
                }

                const retainedIds = new Set(persisted.map(r => r.id));
                for (const old of localRecords) {
                    if (typeof old.id === 'number' && !retainedIds.has(old.id) &&
                        persisted.some(r => isSameTaxRecord(r, old))) {
                        try { await taxIndexedDbService.delete(old.id); }
                        catch (deleteErr) { console.warn('[TaxSync] Không dọn được bản local trùng:', deleteErr); }
                    }
                }
                return persisted;
            }
        } catch (err) {
            console.warn('[TaxSync] Không thể tải từ Firestore, sử dụng IndexedDB:', err);
        }

        const { deduplicated, removedIds } = deduplicateTaxRecords(localRecords);
        if (removedIds.length > 0) {
            for (const id of removedIds) taxIndexedDbService.delete(id).catch(() => {});
        }
        return deduplicated;
    },

    /**
     * Lưu một bản ghi tính thuế mới: lưu vào IndexedDB và đẩy lên Firestore (tự động ghi đè nếu trùng)
     */
    async saveRecord(record: Omit<SavedTaxRecord, 'id'>): Promise<{ id: number; cloud: 'ok' | 'pending' | 'none'; overwritten: boolean }> {
        // Kiểm tra xem trước đó đã có bản ghi trùng dữ liệu hay chưa
        const localRecords = typeof taxIndexedDbService.getAll === 'function' ? await taxIndexedDbService.getAll() : [];
        const overwritten = localRecords.some(r => isSameTaxRecord(r, record));

        // 1. Lưu vào IndexedDB (tự động phát hiện trùng và ghi đè)
        const localId = await taxIndexedDbService.save(record);

        // 2. Lưu vào Firestore nếu đã đăng nhập
        const user = auth.currentUser;
        if (user) {
            const newCloudRecord: SavedTaxRecord = { ...record, id: localId, syncedToCloud: true };
            const ok = await suaMangTrenCloud(user.uid, current => {
                return catTheoDungLuong(replaceCloudRecord(current, newCloudRecord));
            });
            if (!ok) themVaoHangCho(user.uid, 'upsert', [record.createdAt]);
            return { id: localId, cloud: ok ? 'ok' : 'pending', overwritten };
        }

        return { id: localId, cloud: 'none', overwritten };
    },

    /**
     * Xóa một bản ghi tính thuế
     */
    async deleteRecord(id: number, createdAt?: string): Promise<void> {
        await taxIndexedDbService.delete(id);

        const user = auth.currentUser;
        if (user && createdAt) {
            const ok = await suaMangTrenCloud(user.uid, (current, exists) => exists ? current.filter(r => r.createdAt !== createdAt) : null);
            if (!ok) themVaoHangCho(user.uid, 'del', [createdAt]);
        }
    },

    /**
     * Cập nhật kỳ lương (tháng/năm) cho một bản ghi tính thuế đã lưu
     */
    async updateRecordMonth(idOrCreatedAt: number | string, newMonthYear: string): Promise<void> {
        await taxIndexedDbService.updateMonth(idOrCreatedAt, newMonthYear);

        const user = auth.currentUser;
        if (user) {
            const createdAts = await toCreatedAts([idOrCreatedAt]);
            const ok = await suaMangTrenCloud(user.uid, (current, exists) => exists ? current.map(r =>
                createdAts.has(r.createdAt) ? { ...r, monthYear: newMonthYear } : r) : null);
            if (!ok) themVaoHangCho(user.uid, 'upsert', createdAts);
        }
    },

    /**
     * Cập nhật kỳ lương (tháng/năm) cho nhiều bản ghi cùng lúc
     */
    async updateRecordsMonth(idOrCreatedAts: (number | string)[], newMonthYear: string): Promise<void> {
        await taxIndexedDbService.updateMonths(idOrCreatedAts, newMonthYear);

        const user = auth.currentUser;
        if (user) {
            const createdAts = await toCreatedAts(idOrCreatedAts);
            const ok = await suaMangTrenCloud(user.uid, (current, exists) => exists ? current.map(r =>
                createdAts.has(r.createdAt) ? { ...r, monthYear: newMonthYear } : r) : null);
            if (!ok) themVaoHangCho(user.uid, 'upsert', createdAts);
        }
    },

    /**
     * Xóa toàn bộ lịch sử
     */
    async clearAll(): Promise<void> {
        await taxIndexedDbService.clearAll();

        const user = auth.currentUser;
        if (user) {
            try {
                const docRef = doc(db, 'users', user.uid, 'setting', FIRESTORE_DOC_KEY);
                await setDoc(docRef, {
                    records: [],
                    updatedAt: serverTimestamp()
                }, { merge: true });
                ghiHangCho(user.uid, { upsert: [], del: [], clearAll: false });
            } catch (err) {
                console.error('[TaxSync] Lỗi xóa Firestore:', err);
                // Trước chỉ log: mở lại thì getAllRecords kéo cả lịch sử cloud về lại máy. Nay xếp hàng xoá.
                ghiHangCho(user.uid, { upsert: [], del: [], clearAll: true });
                toast.error('Đã xoá trên máy này nhưng CHƯA xoá được trên cloud — sẽ tự xoá lại lần mở Thuế sau.', { id: 'tax-cloud-sync', duration: 6000 });
            }
        }
    }
};
