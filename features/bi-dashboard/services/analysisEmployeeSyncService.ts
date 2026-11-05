/**
 * Service đồng bộ danh sách nhân viên từ chức năng Phân Tích (Analysis)
 * sang Report BI, lưu trữ đồng thời vào IndexedDB và Firebase Firestore.
 */

import { db, auth } from '../../../services/firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getSetting, saveSetting, saveSettingFromCloud } from '../../../services/dbService';
import { standardizeEmployeeName, formatEmployeeName } from '../utils/nhanVienHelpers';

export const ANALYSIS_EMPLOYEES_KEY = 'analysis-employees-list';
const ANALYSIS_CLEARED_KEY = 'analysis-employees-cleared';

export interface AnalysisEmployeeItem {
    id: string;              // Mã nhân viên (ví dụ: '195025')
    name: string;            // Tên định dạng hiển thị
    originalName: string;    // Tên gốc (để so khớp với các báo cáo)
    department: string;      // Phòng ban (ví dụ: 'Kho Siêu Thị', 'Tư Vấn', 'Thu Ngân')
    supermarket?: string;    // Tên hoặc mã siêu thị nếu có
    maKho?: string;          // Mã kho (chuỗi số, ví dụ: '910', '1024')
}

/**
 * HỢP ĐỒNG DỮ LIỆU cầu nối Phân tích → Report BI (audit A29, 2026-09-30 — chủ dự án xác nhận thứ tự).
 * `schemaVersion`/`source` thêm từ v1; bản lưu CŨ (không có 2 trường này) vẫn đọc được — `docAnalysisEmployeesPayload`
 * nâng lên v1 khi đọc. Đơn vị: `updatedAt` = epoch mili-giây. Định danh ổn định: `id` = mã nhân viên (chuỗi số).
 * Đổi hình dạng → tăng ANALYSIS_EMPLOYEES_SCHEMA và viết nhánh nâng cấp trong adapter.
 */
export const ANALYSIS_EMPLOYEES_SCHEMA = 1;

export interface AnalysisEmployeesPayload {
    schemaVersion?: number;
    source?: 'phan-tich';
    /** epoch mili-giây */
    updatedAt: number;
    supermarket?: string;
    totalCount: number;
    employees: AnalysisEmployeeItem[];
}

const EXCLUDED_DEPT_KEYWORDS = [
    'chưa xác định', 'chua xac dinh',
    'không xác định', 'khong xac dinh',
    'chưa phân ca', 'chua phan ca',
    'không phân ca', 'khong phan ca',
    'chưa có bộ phận', 'chua co bo phan',
    'chưa phân bộ phận', 'chua phan bo phan',
    'chưa gán', 'chua gan',
    'chưa cài đặt', 'chua cai dat',
];

function stripVietnameseDiacritics(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, m => (m === 'đ' ? 'd' : 'D'))
        .toLowerCase()
        .trim();
}

/**
 * Kiểm tra xem một nhân viên có phải tài khoản hệ thống hoặc thuộc bộ phận chưa xác định / không hợp lệ cần loại bỏ không
 */
export function isSystemOrIgnoredEmployee(name: string | undefined, dept?: string): boolean {
    if (name) {
        const lowerName = name.toLowerCase().trim();
        if (
            lowerName.startsWith('yêu cầu xuất') ||
            lowerName.startsWith('mwg') ||
            lowerName.startsWith('bp ') ||
            lowerName.startsWith('hỗ trợ bi') ||
            lowerName.startsWith('nnh ') ||
            lowerName.startsWith('đml_str_str') ||
            lowerName.includes('online')
        ) {
            return true;
        }
    }
    // Nếu không có bộ phận hoặc bộ phận rỗng -> Bắt buộc loại bỏ
    if (!dept || typeof dept !== 'string') return true;
    const cleanDept = dept.trim();
    if (!cleanDept) return true;
    const lowerDept = cleanDept.toLowerCase();
    const strippedDept = stripVietnameseDiacritics(cleanDept);
    if (EXCLUDED_DEPT_KEYWORDS.some(kw => lowerDept.includes(kw) || strippedDept.includes(kw))) {
        return true;
    }
    return false;
}

/**
 * Adapter ĐỌC ở biên (IndexedDB / Firestore → Report BI). Trả null nếu dữ liệu hỏng/không đúng hình
 * dạng (thay vì để màn BI vỡ khi gặp `employees` không phải mảng…). Bản cũ → nâng lên v1.
 * Chỉ giữ lại các nhân viên CÓ BỘ PHẬN ĐƯỢC KHAI BÁO (bộ phận chưa xác định sẽ bị loại bỏ).
 */
export function docAnalysisEmployeesPayload(raw: unknown): AnalysisEmployeesPayload | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    if (!Array.isArray(r.employees)) return null;
    const version = typeof r.schemaVersion === 'number' ? r.schemaVersion : 0;
    if (version > ANALYSIS_EMPLOYEES_SCHEMA) {
        console.warn(`[AnalysisEmployeeSync] Dữ liệu schema v${version} mới hơn bản app (v${ANALYSIS_EMPLOYEES_SCHEMA}) — đọc các trường đã biết.`);
    }
    const employees: AnalysisEmployeeItem[] = [];
    for (const e of r.employees as unknown[]) {
        if (!e || typeof e !== 'object') continue;
        const x = e as Record<string, unknown>;
        if (typeof x.name !== 'string' || !x.name) continue;
        const origName = typeof x.originalName === 'string' ? x.originalName : x.name;
        const dept = typeof x.department === 'string' ? x.department.trim() : '';

        // Chỉ lấy nhân viên được khai báo bộ phận, nếu bộ phận chưa xác định sẽ không được tính
        if (!dept || isSystemOrIgnoredEmployee(origName, dept)) continue;

        const maKho = typeof x.maKho === 'string' ? x.maKho.trim().replace(/\D/g, '') : undefined;
        employees.push({
            id: typeof x.id === 'string' ? x.id : String(x.id ?? ''),
            name: x.name,
            originalName: origName,
            department: dept,
            supermarket: typeof x.supermarket === 'string' ? x.supermarket : undefined,
            maKho: maKho || undefined,
        });
    }
    return {
        schemaVersion: ANALYSIS_EMPLOYEES_SCHEMA,
        source: 'phan-tich',
        updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : 0,
        supermarket: typeof r.supermarket === 'string' ? r.supermarket : undefined,
        totalCount: employees.length,
        employees,
    };
}

/**
 * Chuẩn hoá danh sách nhân viên từ Phân Tích thành mảng sạch không trùng lặp
 */
export function normalizeAnalysisEmployees(
    rawEmployees: Array<{ name: string; department?: string; maKho?: string }>,
    supermarket?: string
): AnalysisEmployeeItem[] {
    const seen = new Set<string>();
    const result: AnalysisEmployeeItem[] = [];

    for (const emp of rawEmployees) {
        if (!emp || !emp.name) continue;
        const originalName = emp.name.trim();
        const dept = (emp.department || '').trim();

        // Bỏ qua nếu nhân viên không có bộ phận, hoặc thuộc bộ phận chưa xác định / bị loại trừ
        if (!dept || isSystemOrIgnoredEmployee(originalName, dept)) {
            continue;
        }

        const canonical = standardizeEmployeeName(originalName);
        let empId = '';
        if (canonical.includes(' - ')) {
            const parts = canonical.split(' - ').map(p => p.trim());
            empId = /^\d+$/.test(parts[1]) ? parts[1] : (/^\d+$/.test(parts[0]) ? parts[0] : canonical);
        } else if (/^\d+$/.test(canonical)) {
            empId = canonical;
        } else {
            empId = canonical;
        }

        const dedupKey = empId || canonical;
        const cleanMaKho = emp.maKho ? String(emp.maKho).trim().replace(/\D/g, '') : undefined;
        if (!seen.has(dedupKey)) {
            seen.add(dedupKey);
            result.push({
                id: empId,
                name: formatEmployeeName(originalName),
                originalName,
                department: dept,
                supermarket: supermarket || undefined,
                maKho: cleanMaKho || undefined,
            });
        }
    }

    return result;
}

/**
 * Hai danh sách có cùng nội dung không — KHÔNG phụ thuộc thứ tự. Thứ tự đến từ `Object.entries(departmentMap)`: máy gốc giữ
 * thứ tự chèn, máy kéo departmentMap từ Firestore nhận khoá đã sắp xếp → so thẳng JSON là máy mới luôn thấy "khác" và ghi lại.
 */
export function cungDanhSachNhanVien(a: AnalysisEmployeeItem[], b: AnalysisEmployeeItem[], boQuaSieuThi = false): boolean {
    if (a.length !== b.length) return false;
    const khoa = (list: AnalysisEmployeeItem[]) => list
        .map(e => JSON.stringify([e.id, e.name, e.originalName, e.department, boQuaSieuThi ? '' : (e.supermarket || ''), e.maKho || '']))
        .sort()
        .join('\n');
    return khoa(a) === khoa(b);
}

/** Đọc bản trên cloud kèm MỐC của nó (null: chưa đăng nhập / không có / hỏng / quá 5 s). */
async function docBanCloud(): Promise<{ payload: AnalysisEmployeesPayload; moc: number } | null> {
    const user = auth.currentUser;
    if (!user) return null;
    const snap = await Promise.race([
        getDoc(doc(db, 'users', user.uid, 'configs', ANALYSIS_EMPLOYEES_KEY)),
        new Promise<null>(res => setTimeout(() => res(null), 5000)),
    ]);
    if (!snap || !snap.exists()) return null;
    const data = snap.data();
    if (data?.chunked) return null;
    const payload = docAnalysisEmployeesPayload(data?.value);
    if (!payload || payload.employees.length === 0) return null;
    // Cùng thứ tự với services/heavySyncPolicy.ts → extractCloudTimeMs (mốc server trước): lệch là listener khoá nặng thấy
    // "Cloud mới hơn" rồi ghi lại đúng bản này lần nữa.
    const ts = data?.updatedAt;
    const moc = ts && typeof ts.toMillis === 'function' ? ts.toMillis()
        : (typeof ts === 'number' ? ts : (typeof data?.savedAt === 'number' ? data.savedAt : 0));
    return moc ? { payload, moc } : null;
}

/**
 * Lưu bản VỪA ĐỌC TỪ CLOUD về máy bằng mốc của chính bản đó (`saveSettingFromCloud` — không phát sự kiện đẩy). Lưu bằng
 * `saveSetting` là đóng mốc "bây giờ" → useCloudSync + lượt đối chiếu lúc mở app đẩy ngược nguyên bản lên (cả khoá `bi_`).
 */
async function luuBanCloud(ban: { payload: AnalysisEmployeesPayload; moc: number }): Promise<void> {
    await saveSettingFromCloud(ANALYSIS_EMPLOYEES_KEY, ban.payload, ban.moc);
    await saveSettingFromCloud(`bi_${ANALYSIS_EMPLOYEES_KEY}`, ban.payload, ban.moc);
}

/**
 * Máy chưa có / có bản khác → xem bản trên cloud trước khi ghi (2026-10-28). Cloud đã đúng nội dung này (máy mới đăng nhập,
 * listener khoá nặng chưa kịp kéo về) thì lưu về máy theo mốc cloud, không ghi cloud.
 * `sieuThi === null`: đường Report BI tự làm mới bản đệm — không so siêu thị (cả của payload lẫn từng nhân viên, xem getAnalysisEmployees).
 */
async function layBanCloudTrung(cleanList: AnalysisEmployeeItem[], sieuThi: string | null): Promise<AnalysisEmployeesPayload | null> {
    try {
        const ban = await docBanCloud();
        if (!ban) return null;
        if (sieuThi !== null && (ban.payload.supermarket || '') !== sieuThi) return null;
        const fresh = docAnalysisEmployeesPayload({ employees: cleanList });
        if (!fresh || !cungDanhSachNhanVien(ban.payload.employees, fresh.employees, sieuThi === null)) return null;
        await luuBanCloud(ban);
        console.info(`[AnalysisEmployeeSync] Bản trên cloud cùng nội dung (${ban.payload.totalCount} NV) — lưu về máy theo mốc cloud, không ghi lên.`);
        return ban.payload;
    } catch (err) {
        console.warn('[AnalysisEmployeeSync] Không đọc được bản cloud để so:', err);
        return null;
    }
}

/**
 * Lưu danh sách nhân viên chuẩn vào IndexedDB và tự động trigger Firebase Cloud Sync
 */
export async function saveAnalysisEmployees(
    rawEmployees: Array<{ name: string; department?: string; maKho?: string }>,
    supermarket?: string,
    /** Nút "Đồng bộ Report BI" bấm tay: luôn ghi + đẩy lên, kể cả khi danh sách không đổi. */
    batBuoc = false
): Promise<AnalysisEmployeesPayload> {
    await saveSetting(ANALYSIS_CLEARED_KEY, null);
    const cleanList = normalizeAnalysisEmployees(rawEmployees, supermarket);

    // Danh sách KHÔNG đổi so với bản đang lưu → không ghi gì. Hàm này chạy sau MỖI lần xử lý dữ liệu
    // Phân tích (mỗi lần đổi bộ lọc); trước đây mỗi lần như vậy = 2 lượt ghi IndexedDB + 1 setDoc thẳng
    // lên Firestore + 2 lượt đẩy khoá nặng, dù nội dung y hệt (đo trên dữ liệu thật 2026-09-28).
    // So qua adapter + không phụ thuộc thứ tự; siêu thị chuẩn về '' (bản lưu ghi `supermarket || ''`, tham số có thể là undefined —
    // so thẳng thì không bao giờ bằng khi không lọc đúng 1 kho → ghi lại mỗi lần).
    const sieuThi = supermarket || '';
    const dangLuu = docAnalysisEmployeesPayload(await getSetting<unknown>(ANALYSIS_EMPLOYEES_KEY).catch(() => null));
    if (!batBuoc && dangLuu && (dangLuu.supermarket || '') === sieuThi) {
        const fresh = docAnalysisEmployeesPayload({ employees: cleanList });
        if (fresh && cungDanhSachNhanVien(dangLuu.employees, fresh.employees)) return dangLuu;
    }
    if (!batBuoc) {
        const tuCloud = await layBanCloudTrung(cleanList, sieuThi);
        if (tuCloud) {
            window.dispatchEvent(new CustomEvent('analysis-employees-updated', { detail: tuCloud }));
            return tuCloud;
        }
    }

    const payload: AnalysisEmployeesPayload = {
        schemaVersion: ANALYSIS_EMPLOYEES_SCHEMA,
        source: 'phan-tich',
        updatedAt: Date.now(),
        supermarket: supermarket || '',
        totalCount: cleanList.length,
        employees: cleanList
    };

    // 1. Lưu vào IndexedDB (saveSetting tự động phát event 'ycx-setting-changed' cho useCloudSync)
    await saveSetting(ANALYSIS_EMPLOYEES_KEY, payload);

    // 2. Đồng thời lưu bản sao với prefix 'bi_' để module BI nội bộ đọc trực tiếp
    await saveSetting(`bi_${ANALYSIS_EMPLOYEES_KEY}`, payload);

    // 3. Nếu người dùng đang đăng nhập Firebase, chủ động đẩy ngay lên user configs để multi-device sync
    const user = auth.currentUser;
    if (user) {
        try {
            const cleanPayload = JSON.parse(JSON.stringify(payload, (k, v) => v === undefined ? null : v));
            const docRef = doc(db, 'users', user.uid, 'configs', ANALYSIS_EMPLOYEES_KEY);
            await setDoc(docRef, {
                value: cleanPayload,
                updatedAt: serverTimestamp(),
                savedAt: Date.now()
            }, { merge: false });
        } catch (err) {
            console.warn('[AnalysisEmployeeSync] Đẩy trực tiếp lên Firestore thất bại (sẽ được retry bởi useCloudSync):', err);
        }
    }

    // Bắn event để các hook đang lắng nghe cập nhật ngay
    window.dispatchEvent(new CustomEvent('indexeddb-change', { detail: { key: ANALYSIS_EMPLOYEES_KEY } }));
    window.dispatchEvent(new CustomEvent('analysis-employees-updated', { detail: payload }));

    return payload;
}

/**
 * Chuyển đổi DepartmentMap ("mã NV" -> "Bộ phận;;Tên;;Mã kho") từ chức năng Phân Tích
 * sang mảng danh sách nhân viên chuẩn để chuẩn hóa cho Report BI
 */
export function convertDepartmentMapToEmployees(map: Record<string, string>): Array<{ id?: string; name: string; department: string; maKho?: string }> {
    return Object.entries(map || {}).map(([id, raw]) => {
        const [dept, name, rawMaKho] = String(raw || '').split(';;');
        const cleanName = (name || '').trim();
        const cleanId = id.trim();
        const cleanMaKho = (rawMaKho || '').trim().replace(/\D/g, '');
        const alreadyHasId = cleanName.startsWith(`${cleanId} -`) || cleanName.startsWith(`${cleanId}-`);
        const fullName = !cleanName ? cleanId : alreadyHasId ? cleanName : `${cleanId} - ${cleanName}`;
        return {
            id: cleanId,
            name: fullName,
            department: (dept || '').trim(),
            maKho: cleanMaKho || undefined
        };
    });
}

/**
 * Đọc danh sách nhân viên phân tích từ IndexedDB (ưu tiên tối cao từ departmentMap của Phân Tích, fallback Firebase nếu trên thiết bị mới)
 */
export async function getAnalysisEmployees(): Promise<AnalysisEmployeesPayload | null> {
    // 0. Người dùng đã bấm "Xoá danh sách" → trả rỗng cho đến khi có dữ liệu mới
    const cleared = await getSetting<number>(ANALYSIS_CLEARED_KEY);
    if (cleared) return null;

    // 1. Đọc trực tiếp từ departmentMap của Phân Tích (nguồn chuẩn gốc duy nhất)
    try {
        const deptMap = await getSetting<Record<string, string>>('departmentMap');
        if (deptMap && Object.keys(deptMap).length > 0) {
            const rawEmployees = convertDepartmentMapToEmployees(deptMap);
            const cleanList = normalizeAnalysisEmployees(rawEmployees);
            if (cleanList.length > 0) {
                // CHỈ ghi cache khi danh sách thật sự đổi. Ghi vô điều kiện tạo VÒNG LẶP VÔ HẠN:
                // saveSetting('bi_…') phát 'indexeddb-change' (key analysis-employees-list) →
                // useNhanVienData gọi lại hàm này → ghi tiếp… Hàng trăm giao dịch dồn ứ làm
                // getSetting('departmentMap') hết 10s ("[IDB] getSetting timeout", ~170 lần/phiên,
                // gặp thật 2026-10-09) và mỗi vòng còn kích useCloudSync đẩy lên cloud.
                const cached = docAnalysisEmployeesPayload(await getSetting<unknown>(ANALYSIS_EMPLOYEES_KEY));
                // So qua CÙNG adapter ở cả 2 phía để thứ tự trường giống nhau.
                const fresh = docAnalysisEmployeesPayload({ employees: cleanList });
                // Bỏ qua siêu thị từng NV: danh sách dựng từ departmentMap ở đây KHÔNG có siêu thị, còn bản Phân tích lưu
                // (saveAnalysisEmployees) gắn siêu thị đang lọc → so cả trường đó là luôn "khác" → ghi lại mốc "bây giờ" và
                // đẩy bi_analysis-employees-list lên lúc mở app (bắt được ở dong-bo-hai-may-du-lieu-that, 2026-10-28).
                if (cached && fresh && cungDanhSachNhanVien(cached.employees, fresh.employees, true)) {
                    return cached;
                }
                const tuCloud = await layBanCloudTrung(cleanList, null);
                if (tuCloud) return tuCloud;
                const payload: AnalysisEmployeesPayload = {
                    schemaVersion: ANALYSIS_EMPLOYEES_SCHEMA,
                    source: 'phan-tich',
                    updatedAt: Date.now(),
                    totalCount: cleanList.length,
                    employees: cleanList,
                };
                // Đồng bộ ngầm vào key ANALYSIS_EMPLOYEES_KEY để lưu cache nhanh
                saveSetting(ANALYSIS_EMPLOYEES_KEY, payload).catch(() => {});
                saveSetting(`bi_${ANALYSIS_EMPLOYEES_KEY}`, payload).catch(() => {});
                return payload;
            }
        }
    } catch (err) {
        console.warn('[AnalysisEmployeeSync] Không thể đọc trực tiếp từ departmentMap:', err);
    }

    // 2. Đọc từ IndexedDB — qua adapter (A29): bản cũ nâng lên v1, bản hỏng bỏ qua
    let local = docAnalysisEmployeesPayload(await getSetting<unknown>(ANALYSIS_EMPLOYEES_KEY));
    if (!local) {
        local = docAnalysisEmployeesPayload(await getSetting<unknown>(`bi_${ANALYSIS_EMPLOYEES_KEY}`));
    }

    if (local && Array.isArray(local.employees) && local.employees.length > 0) {
        return local;
    }

    // 3. Nếu local chưa có (ví dụ: vừa mở trên thiết bị mới), thử đọc từ Cloud Firestore
    try {
        const ban = await docBanCloud();
        if (ban) {
            await luuBanCloud(ban);
            return ban.payload;
        }
    } catch (err) {
        console.warn('[AnalysisEmployeeSync] Không thể kéo danh sách nhân viên từ Firestore:', err);
    }

    return null;
}

/**
 * Xoá danh sách nhân viên Phân tích khỏi IndexedDB VÀ Cloud Firestore.
 * Đặt cờ ANALYSIS_CLEARED_KEY để `getAnalysisEmployees()` trả null ngay lập tức — không
 * rebuild từ departmentMap (bước 1) hay kéo lại từ cloud (bước 3). Cờ tự gỡ khi
 * `saveAnalysisEmployees()` lưu dữ liệu mới.
 */
export async function clearAnalysisEmployees(): Promise<void> {
    await saveSetting(ANALYSIS_CLEARED_KEY, Date.now());
    await saveSetting(ANALYSIS_EMPLOYEES_KEY, null);
    await saveSetting(`bi_${ANALYSIS_EMPLOYEES_KEY}`, null);
    try {
        const user = auth.currentUser;
        if (user) {
            await deleteDoc(doc(db, 'users', user.uid, 'configs', ANALYSIS_EMPLOYEES_KEY));
        }
    } catch (_) { /* cloud lỗi không chặn xoá local */ }
}

