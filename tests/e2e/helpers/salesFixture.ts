import * as fs from 'node:fs';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as XLSX from 'xlsx';

// xlsx >= 0.19 (bản ESM .mjs, dùng khi package.json có "type": "module") không tự dò `fs` của
// Node như bản CJS cũ — phải gọi set_fs() tường minh trước khi dùng XLSX.writeFile() trong script
// Node, nếu không sẽ ném "cannot save file". Chỉ cần cho script test này (chạy trong Node) — code
// React trong app luôn chạy ở trình duyệt, dùng nhánh Blob/download có sẵn của thư viện, không cần.
// `set_fs` chỉ có từ xlsx 0.19 — bản 0.18.x (npm registry, dùng khi không tải được bản CDN của
// package.json) tự dò `fs` như bản CJS cũ nên không cần. Gọi có điều kiện để helper chạy được cả 2.
if (typeof (XLSX as { set_fs?: unknown }).set_fs === 'function') XLSX.set_fs(fs);

export const TEST_EMPLOYEE = '195025 - Nguyễn Thị Mỹ Linh';
const TEST_KHO = '99999';

const today = new Date();
const d = (day: Date) => `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}/${day.getFullYear()} 09:30`;

type Row = {
    order: string; product: string; customer: string; qty: number; price: number;
    industry: string; group: string; code: string;
};

/**
 * `Nhóm Hàng` phải là MÃ nhóm hàng theo cấu hình thật (productConfig.childToParentMap dùng mã số
 * làm khoá — tên tiếng Việt sẽ rơi vào "nhóm hàng mới chưa cấu hình" và bị bỏ qua hết).
 * Các mã dưới đây đọc trực tiếp từ cấu hình app tải về: 1491=Smartphone(ICT), 4219=Camera(Phụ kiện),
 * 12=Pin SDP(Phụ kiện), 1031=Loa(Phụ kiện), 4171=Máy lọc nước(Gia dụng), 4156=Nồi cơm(Gia dụng).
 */
const ROWS: Row[] = [
    { order: 'SO001', product: 'Điện thoại iPhone 17 Pro Max 256GB', customer: 'LÂM THỊ CẨM YẾN', qty: 1, price: 31_000_000, industry: 'ICT', group: '1491', code: 'SP001' },
    { order: 'SO001', product: 'Pin sạc dự phòng Polymer 20000mAh Type C PD QC 3.0 22.5W Xmobile CarryOn Y112 Xám kèm Cáp Lightning và Type C', customer: 'LÂM THỊ CẨM YẾN', qty: 1, price: 602_000, industry: 'Phụ kiện', group: '12', code: 'SP002' },
    { order: 'SO002', product: 'Camera EZVIZ C6N', customer: 'TRƯƠNG NHƯ QUỲNH', qty: 2, price: 1_500_000, industry: 'Phụ kiện', group: '4219', code: 'SP003' },
    { order: 'SO003', product: 'Máy lọc nước RO Toshiba TWP-W2396SVN', customer: 'TRẦN THỊ THÚY AN', qty: 1, price: 7_000_000, industry: 'Gia dụng', group: '4171', code: 'SP004' },
    { order: 'SO004', product: 'Nồi cơm điện Sharp KS-223TJV', customer: 'LÊ THỊ Ý', qty: 1, price: 708_000, industry: 'Gia dụng', group: '4156', code: 'SP005' },
    { order: 'SO005', product: 'Loa Bluetooth Alpha Works Sonik 120 Đen', customer: 'TRẦN NAM LÀO', qty: 1, price: 3_000_000, industry: 'Phụ kiện', group: '1031', code: 'SP006' },
];

/** Tạo file Excel dữ liệu bán hàng tối thiểu cho module Phân Tích, trả về đường dẫn file tạm.
 *  `chuaXuat`: mã đơn để "Chưa xuất" (đơn chờ xuất — mở được hộp Chi tiết đơn hàng); mặc định mọi đơn "Đã xuất".
 *  `ngay`: ngày tạo đơn (mặc định hôm nay) — 2 tệp KHÁC ngày nạp liên tiếp không bật hộp "trùng khoảng ngày" (UploadConflictModal). */
export function createSalesXlsx(opts: { chuaXuat?: string[]; ngay?: Date } = {}): string {
    const rows = ROWS.map(r => ({
        'Mã Đơn Hàng': r.order,
        'Tên Sản Phẩm': r.product,
        'Tên Khách Hàng': r.customer,
        'Số Lượng': r.qty,
        'Giá bán_1': r.price,
        'Giá bán': r.price,
        'Mã kho tạo': TEST_KHO,
        'Kho tạo': `Kho ${TEST_KHO}`,
        'Người tạo': TEST_EMPLOYEE,
        'Trạng thái xuất': opts.chuaXuat?.includes(r.order) ? 'Chưa xuất' : 'Đã xuất',
        'Ngày tạo': d(opts.ngay ?? today),
        'Thời gian hẹn giao': d(opts.ngay ?? today),
        'Hình thức xuất': 'Xuất bán hàng tại siêu thị',
        'Tình trạng nhập trả của sản phẩm đổi với sản phẩm chính': 'Chưa trả',
        'Trạng thái thu tiền': 'Đã thu',
        'Trạng thái hủy': 'Chưa hủy',
        // Bộ lọc mặc định của app là trangThai = ['1 - Mới'] (hooks/useFilterState.ts) — để giá trị
        // khác thì toàn bộ dòng bị lọc ra và mọi KPI về 0.
        'Trạng thái hồ sơ': '1 - Mới',
        'Ngành Hàng': r.industry,
        'Nhóm Hàng': r.group,
        'Nhà sản xuất': 'Khác',
        'Mã sản phẩm': r.code,
    }));

    const dir = mkdtempSync(join(tmpdir(), 'ycx-e2e-'));
    const file = join(dir, 'sales.xlsx');
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Data');
    XLSX.writeFile(wb, file);
    if (!existsSync(file)) throw new Error('Không tạo được file Excel test');
    return file;
}

export const DEFAULT_TEST_PRODUCT_CONFIG = {
    groups: {
        'ICT': ['1491'],
        'Phụ kiện': ['12', '4219', '1031'],
        'Gia dụng': ['4171', '4156'],
    },
    subgroups: {
        'ICT': { 'Điện thoại': ['1491'] },
        'Phụ kiện': { 'Pin SDP': ['12'], 'Camera': ['4219'], 'Loa': ['1031'] },
        'Gia dụng': { 'Máy lọc nước': ['4171'], 'Nồi cơm': ['4156'] },
    },
    childToParentMap: {
        '1491': 'ICT',
        '12': 'Phụ kiện',
        '4219': 'Phụ kiện',
        '4171': 'Gia dụng',
        '4156': 'Gia dụng',
        '1031': 'Phụ kiện',
    },
    childToSubgroupMap: {
        '1491': 'Điện thoại',
        '12': 'Pin SDP',
        '4219': 'Camera',
        '4171': 'Máy lọc nước',
        '4156': 'Nồi cơm',
        '1031': 'Loa',
    },
    quantityMultiplierMap: {},
    vasMultiplierMap: {},
    vasNameMultiplierMap: {},
    revenueEligibleHTX: [
        'xuất bán hàng tại siêu thị',
        'bán lẻ',
        'xuất bán lẻ',
        'bán hàng',
        'bán online',
        'xuất bán online',
    ],
    nonRevenueEligibleHTX: [],
    htxClassification: {
        'xuất bán hàng tại siêu thị': 'tien_mat',
    },
};

/**
 * Nạp cấu hình ngành hàng hợp lệ vào IndexedDB (boundary DB thật, không chèn DOM giả).
 * Phục vụ các bài test E2E cần baseline layout dữ liệu trong môi trường sandbox chặn mạng ngoài.
 */
export async function seedProductConfigFixture(page: { evaluate: <T, R>(fn: (arg: T) => Promise<R> | R, arg: T) => Promise<R> }, config = DEFAULT_TEST_PRODUCT_CONFIG): Promise<void> {
    await page.evaluate(async (cfg) => {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const req = indexedDB.open('BI_HUB_DATABASE_V2', 3);
            req.onupgradeneeded = () => {
                const d = req.result;
                if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings');
                if (!d.objectStoreNames.contains('appStorage')) d.createObjectStore('appStorage');
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });

        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(['settings'], 'readwrite');
            const store = tx.objectStore('settings');
            store.put({ config: cfg, url: 'cloud://global_product_config', fetchedAt: new Date() }, 'productConfig');
            store.put(new Date().toISOString(), 'global_product_config_updated_at');
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
        db.close();

        window.dispatchEvent(new CustomEvent('ycx-product-config-changed', { detail: cfg }));
        window.dispatchEvent(new CustomEvent('indexeddb-change', { detail: { key: 'productConfig' } }));
    }, config);
}

