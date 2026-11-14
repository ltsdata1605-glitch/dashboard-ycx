import { expect, test } from '@playwright/test';
import { appPath, APP_BASE } from './helpers/appBase';

// Real service + real browser IndexedDB; only Firebase boundary is replaced.
// Every test gets a fresh profile; the audit config blocks external traffic.
for (const scenario of ['local-newer', 'cloud-newer', 'cloud-ascending', 'cloud-descending']) {
    test(`${scenario}: displayed and durable history keep the same latest record`, async ({ page }) => {
        let cloudBoundaryHits = 0;
        await page.route('**/services/firebase.ts*', route => route.fulfill({
            contentType: 'application/javascript', body: 'export const db = {}; export const auth = {currentUser:{uid:"audit-fixture"}};',
        }));
        await page.route('**/*firebase_firestore*', route => {
            cloudBoundaryHits++;
            return route.fulfill({ contentType: 'application/javascript', body: `
                export const doc = () => ({});
                export const serverTimestamp = () => 'fixture';
                const snap = () => ({exists: () => true, data: () => ({records: structuredClone(globalThis.__auditCloud)})});
                export const getDoc = async () => snap();
                export const setDoc = async (_ref, value) => {globalThis.__auditCloud = structuredClone(value.records);};
                export const runTransaction = async (_db, fn) => fn({get: async () => snap(), set: (_ref, value) => {globalThis.__auditCloud = structuredClone(value.records);}});
            ` });
        });
        await page.goto(appPath('/tests/e2e/helpers/materialHarness.html'));
        const result = await page.evaluate(async ({ scenario, B }) => {
            const dbPath = B + 'features/tax-calculator/services/taxIndexedDbService.ts';
            const syncPath = B + 'features/tax-calculator/services/taxSyncService.ts';
            const { taxIndexedDbService: local } = await import(/* @vite-ignore */ dbPath);
            const record = (day: number, id?: number) => ({ id, name: 'Audit Fixture', monthYear: '09/2026', createdAt: `2026-10-0${day}T00:00:00Z`, totalIncome: day, dependents: 0, proxyAmount: 0, taxOnProxyAmount: 0 });
            let records;
            if (scenario === 'local-newer' || scenario === 'cloud-newer') {
                const localDay = scenario === 'local-newer' ? 2 : 1;
                const { id: _id, ...input } = record(localDay);
                await local.save(input);
                records = [record(3 - localDay, 99)];
            } else records = scenario === 'cloud-ascending' ? [record(1, 99), record(2, 88)] : [record(2, 88), record(1, 99)];
            (globalThis as unknown as { __auditCloud: unknown }).__auditCloud = records;
            const { taxSyncService: sync } = await import(/* @vite-ignore */ syncPath);
            const displayed = await sync.getAllRecords();
            const durable = await local.getAll();
            return { displayed: displayed.map((r: { totalIncome: number }) => r.totalIncome), durable: durable.map((r: { totalIncome: number }) => r.totalIncome), id: displayed[0]?.id, localId: durable[0]?.id };
        }, { scenario, B: APP_BASE });
        expect(cloudBoundaryHits).toBeGreaterThan(0);
        expect(result.displayed).toEqual([2]);
        expect(result.durable).toEqual([2]);
        expect(result.id).toBe(result.localId);
    });
}
