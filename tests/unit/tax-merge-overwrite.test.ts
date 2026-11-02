import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedTaxRecord } from '../../features/tax-calculator/types/tax.types';
import { isSameTaxRecord } from '../../features/tax-calculator/services/taxHistoryGrouping';

let local: SavedTaxRecord[] = [];
let cloud: SavedTaxRecord[] = [];
let offline = false;
let failSave = false;
let nextId = 10;
const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
});
vi.mock('react-hot-toast', () => ({ default: Object.assign(vi.fn(), { error: vi.fn() }) }));
vi.mock('../../services/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'fixture' } } }));
vi.mock('firebase/firestore', () => ({
    doc: () => ({}), serverTimestamp: () => 'fixture',
    getDoc: async () => {
        if (offline) throw new Error('fixture offline');
        return { exists: () => true, data: () => ({ records: structuredClone(cloud) }) };
    },
    runTransaction: async (_db: unknown, fn: (tx: unknown) => Promise<void>) => {
        if (offline) throw new Error('fixture offline');
        await fn({
            get: async () => ({ exists: () => true, data: () => ({ records: structuredClone(cloud) }) }),
            set: (_ref: unknown, value: { records: SavedTaxRecord[] }) => { cloud = structuredClone(value.records); },
        });
    },
    setDoc: vi.fn(),
}));
// Boundary model matches native save behavior verified in tax-storage-atomicity.spec.ts:
// same person/month overwrites in place, preserving ID and removing extra duplicates.
vi.mock('../../features/tax-calculator/services/taxIndexedDbService', () => ({
    taxIndexedDbService: {
        getAll: async () => structuredClone(local),
        save: async (record: Omit<SavedTaxRecord, 'id'>) => {
            if (failSave) throw new Error('fixture aborted save');
            const existing = local.find(r => isSameTaxRecord(r, record));
            const id = existing?.id ?? nextId++;
            local = [...local.filter(r => !isSameTaxRecord(r, record)), { ...record, id }];
            return id;
        },
        delete: async (id: number) => { local = local.filter(r => r.id !== id); },
    },
}));
const { taxSyncService, docHangCho } = await import('../../features/tax-calculator/services/taxSyncService');
const record = (day: number, id: number, income = day): SavedTaxRecord => ({
    id, name: 'Audit Fixture', monthYear: '09/2026', createdAt: `2026-10-${String(day).padStart(2, '0')}T00:00:00Z`,
    totalIncome: income, dependents: 0, proxyAmount: 0, taxOnProxyAmount: 0,
});
beforeEach(() => { local = []; cloud = []; offline = false; failSave = false; nextId = 10; storage.clear(); });

describe('merge with overwrite-capable local storage', () => {
    it.each([[1, 2], [2, 1]])('local day%s/cloud day%s keeps latest both displayed and persisted', async (localDay, cloudDay) => {
        local = [record(localDay, 1)]; cloud = [record(cloudDay, 99)];
        const result = await taxSyncService.getAllRecords();
        expect(result.map(r => r.totalIncome)).toEqual([2]);
        expect(local.map(r => r.totalIncome)).toEqual([2]);
        expect(local[0].id).toBe(result[0].id);
    });
    it.each([[1, 2], [2, 1]])('cloud order%s/%s cannot change persisted winner', async (first, second) => {
        cloud = [record(first, 99), record(second, 88)];
        const result = await taxSyncService.getAllRecords();
        expect(result.map(r => r.totalIncome)).toEqual([2]);
        expect(local.map(r => r.totalIncome)).toEqual([2]);
    });
    it('failed cloud import preserves and returns existing local record', async () => {
        local = [record(1, 1)]; cloud = [record(2, 99)]; failSave = true;
        const result = await taxSyncService.getAllRecords();
        expect(result.map(r => r.totalIncome)).toEqual([1]);
        expect(local).toEqual([record(1, 1)]);
    });
    it('offline overwrite replay has same cloud replacement semantics as online save', async () => {
        local = [record(1, 1)]; cloud = [record(1, 99)]; offline = true;
        expect((await taxSyncService.saveRecord(record(2, 1))).cloud).toBe('pending');
        expect(docHangCho('fixture').upsert).toEqual([record(2, 1).createdAt]);
        offline = false;
        await taxSyncService.getAllRecords();
        expect(cloud.map(r => r.totalIncome)).toEqual([2]);
        expect(local.map(r => r.totalIncome)).toEqual([2]);
        expect(docHangCho('fixture').upsert).toEqual([]);
    });
});
