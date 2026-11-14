import { readFileSync } from 'node:fs';
import { expect, test, type Download, type Page } from '@playwright/test';
import { chanGhiCloud } from './helpers/customTokenLogin';
import { APP_BASE } from './helpers/appBase';

/**
 * Stub đăng nhập + gieo dữ liệu thẳng vào IndexedDB: cùng cách với `sticker-nut-va-quet-ma.spec.ts`
 * (không có tài khoản In Sticker thật trong Playwright).
 *
 * Stub đưa ra `user` giả nên app vẫn gửi lượt đọc lên Firestore thật và bị rules từ chối, vì trình
 * duyệt test không có phiên đăng nhập. `chanGhiCloud` chặn mọi lượt ghi (đo 2026-11-06: 0 lượt ghi).
 */
const AUTH_HOOK_STUB = `
const FAKE_USER = { uid: 'u-audit', email: 'audit@test.local' };
const FAKE_DATA = { uid: 'u-audit', username: 'admin', role: 'admin', storeId: '910', storeHasAdmin: true };
export function useStickerEventAuth() {
  return {
    user: FAKE_USER, setUser: () => {},
    userData: FAKE_DATA, setUserData: () => {},
    isInitializing: false, setIsInitializing: () => {},
    handleLoginSuccess: () => {},
  };
}
`;

/** 55 sản phẩm = 2 ảnh: một ảnh đủ 50 dòng (trường hợp cao nhất) và một ảnh 5 dòng. */
const PRODUCTS_55 = Array.from({ length: 55 }, (_, i) => ({
    msp: `20012${String(i + 1).padStart(2, '0')}`,
    sanPham: i % 7 === 0
        ? `Tủ lạnh Samsung Inverter 460 lít ngăn đá trên thiết kế mới, kính cường lực phiên bản giới hạn ${i + 1}`
        : `Sản phẩm mẫu thứ ${i + 1}`,
    thuongERP: 150000, thuongNong: 50000, tongThuong: 200000,
    giaGoc: '12.990.000', giaGiam: '9.990.000',
    khuyenMai: i % 5 === 0 ? 'Tặng loa thanh' : '',
    ngayIn: '04/11/2026', selected: false, quantity: 1,
}));

async function moInStickerCoSanPham(page: Page) {
    await chanGhiCloud(page);
    await page.route('**/features/sticker-event/hooks/useStickerEventAuth.ts*', r =>
        r.fulfill({ status: 200, contentType: 'application/javascript', body: AUTH_HOOK_STUB }));

    await page.goto('/?tab=tools-print-sticker&sub=event');
    // Dev server mở lần đầu có thể mất nhiều giây: chờ màn đăng nhập hiện hẳn, không đoán bằng thời gian.
    const demo = page.getByRole('button', { name: /Kích hoạt Chế độ Dùng Thử/i }).first();
    await demo.waitFor({ state: 'visible', timeout: 60_000 });

    // Gieo TRƯỚC khi bấm Dùng Thử: AuthContext xoá cờ Dùng Thử sau mỗi lần nạp trang, nên tải lại trang
    // sau khi đã vào app là quay về màn đăng nhập.
    await page.evaluate(async (products) => {
        const db = await new Promise<IDBDatabase>((res, rej) => {
            const r = indexedDB.open('ProductSearchDB', 1);
            r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('appData')) r.result.createObjectStore('appData'); };
            r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
        });
        await new Promise<void>((res, rej) => {
            const tx = db.transaction(['appData'], 'readwrite');
            tx.objectStore('appData').put(products, 'products');
            // Nút Xuất ảnh xuất danh sách ĐANG HIỂN THỊ, không phải toàn bộ bảng giá.
            tx.objectStore('appData').put(products, 'displayedProducts');
            tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
        });
        db.close();
    }, PRODUCTS_55);

    await demo.click();
    await page.getByRole('button', { name: 'Xuất ảnh' }).first().waitFor({ state: 'visible', timeout: 60_000 });
    await expect(page.getByText('Sản phẩm mẫu thứ 2', { exact: true }).first()).toBeVisible({ timeout: 30_000 });
}

/**
 * Giải mã ảnh trong trình duyệt rồi đo từng điểm ảnh. "Mực" = điểm ảnh khác nền trắng (kể cả viền
 * thẻ xám nhạt #e2e8f0). Lề trả về theo px CSS (ảnh xuất rộng 968px CSS × tỉ lệ chụp).
 */
async function doDiemAnh(page: Page, download: Download) {
    const base64 = readFileSync(await download.path()).toString('base64');
    return page.evaluate(async (b64) => {
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        const bmp = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
        const { width, height } = bmp;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(bmp, 0, 0);

        let muc = 0, doGia = 0, minX = width, maxX = -1, minY = height, maxY = -1;
        const DAI = 512; // đọc từng dải: ảnh 50 dòng ~ 40 triệu điểm ảnh
        for (let y0 = 0; y0 < height; y0 += DAI) {
            const h = Math.min(DAI, height - y0);
            const { data } = ctx.getImageData(0, y0, width, h);
            for (let i = 0; i < data.length; i += 4) {
                const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
                if (r >= 250 && g >= 250 && b >= 250) continue;
                muc++;
                // Màu giá giảm #e11d48: có màu này mới chắc là chữ trong thẻ sản phẩm, không phải vệt lạ
                if (r > 200 && g < 60 && b < 100) doGia++;
                const x = (i / 4) % width;
                const y = y0 + Math.floor(i / 4 / width);
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
        const tiLe = width / 968;
        return {
            width, height, muc, doGia,
            tiLeMuc: muc / (width * height),
            leTrai: minX / tiLe,
            lePhai: (width - 1 - maxX) / tiLe,
            leTren: minY / tiLe,
            leDuoi: (height - 1 - maxY) / tiLe,
        };
    }, base64);
}

/**
 * Lỗi 2026-11-04: nút Xuất ảnh ra ảnh TRẮNG TINH (3388×1249, 0 điểm ảnh khác nền) mà file vẫn nặng,
 * bảng tiến trình vẫn báo xong — test chỉ nhìn số file/dung lượng không thấy gì. Ở đây bấm đúng nút
 * trên giao diện, lấy file tải về thật rồi đo điểm ảnh của từng file.
 */
test('Sticker: nút Xuất ảnh ra ảnh có nội dung thật, đủ lề, không cắt mép', async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await moInStickerCoSanPham(page);

    const downloads: Download[] = [];
    page.on('download', d => downloads.push(d));
    await page.getByRole('button', { name: 'Xuất ảnh' }).first().click();
    await expect.poll(() => downloads.length, { timeout: 120_000 }).toBe(2);

    const kq = [];
    for (const d of downloads) {
        await d.saveAs(test.info().outputPath(d.suggestedFilename())); // để mở xem bằng mắt khi cần
        kq.push({ file: d.suggestedFilename(), ...(await doDiemAnh(page, d)) });
    }
    console.log('ĐO ĐIỂM ẢNH XUẤT ẢNH STICKER:', JSON.stringify(kq, null, 1));

    expect(kq[0].file).toContain('Dong 1-50');
    expect(kq[1].file).toContain('Dong 51-55');
    for (const a of kq) {
        const ten = `${a.file}: `;
        expect(a.width, `${ten}khổ ảnh`).toBeGreaterThan(960);
        expect(a.muc, `${ten}ảnh trắng tinh`).toBeGreaterThan(0);
        expect(a.tiLeMuc, `${ten}quá ít nội dung`).toBeGreaterThan(0.01);
        expect(a.doGia, `${ten}không thấy chữ giá màu đỏ`).toBeGreaterThan(0);
        // Cột/hàng sát mép có mực = nội dung bị cắt. Lề hai bên phải cân: lệch là bị đẩy về một phía.
        expect(a.lePhai, `${ten}cắt/sát mép phải`).toBeGreaterThanOrEqual(16);
        expect(a.leTrai, `${ten}cắt/sát mép trái`).toBeGreaterThanOrEqual(16);
        expect(Math.abs(a.leTrai - a.lePhai), `${ten}lề trái/phải lệch nhau`).toBeLessThanOrEqual(2);
        // Hết ảnh phải là khoảng trắng, không phải một dòng chữ bị xén ngang.
        expect(a.leDuoi, `${ten}cắt/sát mép dưới`).toBeGreaterThanOrEqual(16);
        expect(a.leTren, `${ten}cắt/sát mép trên`).toBeGreaterThanOrEqual(16);
    }
    await expect(page.locator('.batch-export-container')).toHaveCount(0);
});

/**
 * Audit A02 (2026-09-29): In Sticker xuất ảnh hàng loạt — ảnh lỗi giữa chừng từng bị bỏ qua lặng
 * lẽ, cuối vòng vẫn trả `success:true, exportedCount: tổng` và app báo "Đã xuất thành công N file".
 *
 * Chạy THẲNG code thật trong Chromium (html-to-image thật, DOM thật). Lỗi được gây ra ở tầng thấp
 * nhất có thể — `HTMLCanvasElement.prototype.toBlob` trả null ở lượt chụp thứ 2 (giống trần canvas
 * của Safari iOS) — không giả lập hàm nào của app.
 */
test('Sticker: 1 ảnh lỗi giữa batch → báo đúng 2/3 ảnh, không còn DOM tạm', async ({ page }) => {
    await page.goto('/');

    const result = await page.evaluate(async (B) => {
        const modPath = B + 'features/sticker-event/services/batchImageExportService.ts';
        const mod = (await import(/* @vite-ignore */ modPath)) as typeof import('../../features/sticker-event/services/batchImageExportService');

        let calls = 0;
        const realToBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, ...rest: unknown[]) {
            calls++;
            if (calls === 2) { cb(null); return; }
            return realToBlob.call(this, cb, ...(rest as [string?, number?]));
        };

        const products = Array.from({ length: 125 }, (_, i) => ({
            msp: `10000${i + 1}`, sanPham: i === 3 ? 'Cáp <1m> & "sạc"' : `Sản phẩm ${i + 1}`,
            giaGiam: '100.000 đ', giaGoc: '150.000 đ', tongThuong: 5000, thuongERP: 3000, thuongNong: 2000,
            tonKho: 10, khuyenMai: '', ngayIn: '29/09/2026', selected: false, quantity: 1,
        }));

        const res = await mod.exportProductsInBatches(products as never, { chunkSize: 50, storeId: 'ST<1>' });
        HTMLCanvasElement.prototype.toBlob = realToBlob;
        return {
            res: JSON.parse(JSON.stringify(res)),
            leftover: document.querySelectorAll('.batch-export-container').length,
            // Khung bọc đẩy phần tử ra ngoài màn hình cũng phải được gỡ, kể cả ở ảnh lỗi.
            leftoverHost: Array.from(document.body.children).filter(el => (el as HTMLElement).style.left === '-9999px').length,
            overlayVisible: !!document.getElementById('export-overlay') && getComputedStyle(document.getElementById('export-overlay')!).display !== 'none',
        };
    }, APP_BASE);

    console.log('KẾT QUẢ BATCH STICKER:', JSON.stringify({ ...result.res, items: undefined }));
    expect(result.res.success).toBe(false);
    expect(result.res.batchCount).toBe(2);
    expect(result.res.exportedCount).toBe(75);
    expect(result.res.failed?.map((f: { batchNum: number }) => f.batchNum)).toEqual([2]);
    expect(result.leftover).toBe(0);
    expect(result.leftoverHost).toBe(0);
});
