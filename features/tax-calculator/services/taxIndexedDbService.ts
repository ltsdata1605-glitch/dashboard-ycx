import { SavedTaxRecord } from '../types/tax.types';
import { isSameTaxRecord } from './taxHistoryGrouping';

const DB_NAME = 'TaxCalculatorDB';
const DB_VERSION = 1;
const STORE_NAME = 'calculations';

let dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (dbInstance) return resolve(dbInstance);

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error('Lỗi khởi tạo IndexedDB TaxCalculatorDB'));
        };

        request.onsuccess = (e) => {
            dbInstance = (e.target as IDBOpenDBRequest).result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

// A successful request can still be rolled back by a later request in the same transaction.
const transactionDone = (tx: IDBTransaction): Promise<void> => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('Giao dịch lịch sử tính thuế đã bị hủy'));
    tx.onerror = () => reject(tx.error || new Error('Lỗi ghi lịch sử tính thuế'));
});

export const taxIndexedDbService = {
    async getAll(): Promise<SavedTaxRecord[]> {
        try {
            const db = await getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const req = store.getAll();

                req.onsuccess = () => {
                    const list: SavedTaxRecord[] = req.result || [];
                    // Sắp xếp mới nhất lên đầu
                    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    resolve(list);
                };

                req.onerror = () => reject(new Error('Lỗi lấy danh sách lịch sử tính thuế'));
            });
        } catch {
            return [];
        }
    },

    async save(record: Omit<SavedTaxRecord, 'id'>): Promise<number> {
        const db = await getDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            let savedId: number;
            // Request success is not a commit: a later request can still abort this transaction.
            tx.oncomplete = () => resolve(savedId);
            tx.onabort = () => reject(tx.error || new Error('Giao dịch lưu lịch sử tính thuế đã bị hủy'));
            tx.onerror = () => reject(tx.error || new Error('Lỗi lưu bản ghi tính thuế'));
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();

            req.onsuccess = () => {
                const list: SavedTaxRecord[] = req.result || [];
                const duplicateIndex = list.findIndex(r => isSameTaxRecord(r, record));

                if (duplicateIndex !== -1) {
                    const existing = list[duplicateIndex];
                    const targetId = existing.id as number;
                    const updated: SavedTaxRecord = {
                        ...record,
                        id: targetId,
                    };
                    store.put(updated);

                    // Xóa các bản ghi trùng lặp dư thừa khác nếu có
                    for (let i = 0; i < list.length; i++) {
                        if (i !== duplicateIndex && isSameTaxRecord(list[i], record)) {
                            const extraId = list[i].id;
                            if (typeof extraId === 'number') {
                                store.delete(extraId);
                            }
                        }
                    }

                    savedId = targetId;
                } else {
                    const addReq = store.add(record);
                    addReq.onsuccess = () => {
                        savedId = Number(addReq.result);
                    };
                    addReq.onerror = () => reject(new Error('Lỗi lưu bản ghi tính thuế'));
                }
            };

            req.onerror = () => reject(new Error('Lỗi truy vấn bản ghi tính thuế'));
        });
    },

    async delete(id: number): Promise<void> {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const done = transactionDone(tx);
        tx.objectStore(STORE_NAME).delete(id);
        return done;
    },

    async updateMonth(idOrCreatedAt: number | string, newMonthYear: string): Promise<void> {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const done = transactionDone(tx);
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
            const list: SavedTaxRecord[] = req.result || [];
            const target = list.find(r => r.id === idOrCreatedAt || r.createdAt === idOrCreatedAt);
            if (target) {
                target.monthYear = newMonthYear;
                store.put(target);
            }
        };
        return done;
    },

    /** Cập nhật kỳ lương (tháng/năm) cho nhiều bản ghi cùng lúc. */
    async updateMonths(idOrCreatedAts: (number | string)[], newMonthYear: string): Promise<void> {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const done = transactionDone(tx);
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
            const list: SavedTaxRecord[] = req.result || [];
            const keySet = new Set(idOrCreatedAts);
            list.forEach(r => {
                if (keySet.has(r.id as number) || keySet.has(r.createdAt)) {
                    r.monthYear = newMonthYear;
                    store.put(r);
                }
            });
        };
        return done;
    },

    async clearAll(): Promise<void> {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const done = transactionDone(tx);
        tx.objectStore(STORE_NAME).clear();
        return done;
    }
};
