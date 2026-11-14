import { expect, test } from '@playwright/test';
import { appPath, APP_BASE } from './helpers/appBase';

// Native IndexedDB in a fresh local browser context. No Firebase import or real records.
for (const operation of ['add', 'put'] as const) {
    test(`save rejects when native ${operation} transaction aborts`, async ({ page }) => {
        await page.goto(appPath('/tests/e2e/helpers/materialHarness.html'));
        const result = await page.evaluate(async ({ operation, B }) => {
            const path = B + 'features/tax-calculator/services/taxIndexedDbService.ts';
            const { taxIndexedDbService: service } = await import(/* @vite-ignore */ path);
            const record = { name: 'Audit Fixture', monthYear: '09/2026', createdAt: '2026-10-01T00:00:00Z', totalIncome: 100, dependents: 0, proxyAmount: 0, taxOnProxyAmount: 0 };
            if (operation === 'put') await service.save(record);
            const original = IDBObjectStore.prototype[operation];
            IDBObjectStore.prototype[operation] = function (...args: Parameters<typeof original>) {
                const request = original.apply(this, args);
                request.addEventListener('success', () => this.transaction.abort());
                return request;
            };
            let outcome = 'resolved';
            try { await service.save({ ...record, totalIncome: 200 }); }
            catch { outcome = 'rejected'; }
            finally { IDBObjectStore.prototype[operation] = original; }
            // A subsequent read transaction observes the completed rollback.
            const records = await service.getAll();
            return { outcome, incomes: records.map((r: { totalIncome: number }) => r.totalIncome) };
        }, { operation, B: APP_BASE });
        expect(result.incomes).toEqual(operation === 'put' ? [100] : []);
        expect(result.outcome).toBe('rejected');
    });
}

test('committed save retains overwrite behavior and stable local ID', async ({ page }) => {
    await page.goto(appPath('/tests/e2e/helpers/materialHarness.html'));
    const result = await page.evaluate(async (B) => {
        const path = B + 'features/tax-calculator/services/taxIndexedDbService.ts';
        const { taxIndexedDbService: service } = await import(/* @vite-ignore */ path);
        const record = { name: 'Audit Fixture', monthYear: '09/2026', createdAt: '2026-10-01T00:00:00Z', totalIncome: 100, dependents: 0, proxyAmount: 0, taxOnProxyAmount: 0 };
        const first = await service.save(record);
        const second = await service.save({ ...record, totalIncome: 200 });
        const rows = await service.getAll();
        return { first, second, incomes: rows.map((r: { totalIncome: number }) => r.totalIncome) };
    }, APP_BASE);
    expect(result.second).toBe(result.first);
    expect(result.incomes).toEqual([200]);
});

for (const method of ['delete', 'updateMonth', 'updateMonths', 'clearAll'] as const) {
    for (const abort of [true, false]) {
        test(`${method} reports ${abort ? 'abort and preserves all rows' : 'commit and persists changes'}`, async ({ page }) => {
            await page.goto(appPath('/tests/e2e/helpers/materialHarness.html'));
            const result = await page.evaluate(async ({ method, abort, B }) => {
                const path = B + 'features/tax-calculator/services/taxIndexedDbService.ts';
                const { taxIndexedDbService: service } = await import(/* @vite-ignore */ path);
                const record = { name: 'Audit A', monthYear: '09/2026', createdAt: '2026-10-01T00:00:00Z', totalIncome: 100, dependents: 0, proxyAmount: 0, taxOnProxyAmount: 0 };
                const a = await service.save(record);
                const b = await service.save({ ...record, name: 'Audit B', createdAt: '2026-10-02T00:00:00Z' });
                const original = { put: IDBObjectStore.prototype.put, delete: IDBObjectStore.prototype.delete, clear: IDBObjectStore.prototype.clear };
                const injectAbort = <T extends IDBRequest>(request: T, transaction: IDBTransaction): T => {
                    if (abort) request.addEventListener('success', () => transaction.abort(), { once: true });
                    return request;
                };
                IDBObjectStore.prototype.put = function (...args) { return injectAbort(original.put.apply(this, args), this.transaction); };
                IDBObjectStore.prototype.delete = function (...args) { return injectAbort(original.delete.apply(this, args), this.transaction); };
                IDBObjectStore.prototype.clear = function (...args) { return injectAbort(original.clear.apply(this, args), this.transaction); };
                let outcome = 'resolved';
                try {
                    if (method === 'delete') await service.delete(a);
                    else if (method === 'clearAll') await service.clearAll();
                    else if (method === 'updateMonth') await service.updateMonth(a, '10/2026');
                    else await service.updateMonths([a, '2026-10-02T00:00:00Z'], '10/2026');
                } catch { outcome = 'rejected'; }
                finally {
                    IDBObjectStore.prototype.put = original.put;
                    IDBObjectStore.prototype.delete = original.delete;
                    IDBObjectStore.prototype.clear = original.clear;
                }
                const rows = await service.getAll();
                return { outcome, rows: rows.map((r: { id: number; monthYear: string }) => ({ id: r.id, month: r.monthYear })).sort((x: { id: number }, y: { id: number }) => x.id - y.id), a, b };
            }, { method, abort, B: APP_BASE });
            const unchanged = [{ id: result.a, month: '09/2026' }, { id: result.b, month: '09/2026' }];
            const expected = abort ? unchanged : method === 'clearAll' ? [] : method === 'delete' ? unchanged.slice(1) : [
                { id: result.a, month: '10/2026' }, { id: result.b, month: method === 'updateMonths' ? '10/2026' : '09/2026' },
            ];
            expect(result.rows).toEqual(expected);
            expect(result.outcome).toBe(abort ? 'rejected' : 'resolved');
        });
    }
}
