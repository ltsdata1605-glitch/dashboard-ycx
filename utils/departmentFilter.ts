import type { DepartmentMap } from '../services/dataService';

const normalizeDept = (raw: string): string =>
    raw
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[đĐ]/g, 'd')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

/** "BP All In One", "BP ALL IN ONE - DMX", "BP All-In-One (ĐMX)" … đều tính là All In One */
export const isAllInOneDepartment = (dept?: string | null): boolean =>
    normalizeDept(String(dept || '')).includes('allinone');

export interface DepartmentFilterResult {
    map: DepartmentMap;
    keptCount: number;
    skippedCount: number;
    /** Tên các bộ phận đã bị bỏ qua, để báo rõ cho người dùng */
    skippedDepartments: string[];
}

/** Lọc DepartmentMap ("mã NV" -> "Bộ phận;;Tên") chỉ giữ nhân viên BP All In One */
export const keepOnlyAllInOne = (map: DepartmentMap | null | undefined): DepartmentFilterResult => {
    const result: DepartmentMap = {};
    const skipped = new Set<string>();
    let keptCount = 0;
    let skippedCount = 0;

    Object.entries(map || {}).forEach(([id, raw]) => {
        const dept = String(raw || '').split(';;')[0].trim();
        if (isAllInOneDepartment(dept)) {
            result[id] = raw;
            keptCount += 1;
        } else {
            skippedCount += 1;
            if (dept) skipped.add(dept);
        }
    });

    return {
        map: result,
        keptCount,
        skippedCount,
        skippedDepartments: Array.from(skipped).sort(),
    };
};
