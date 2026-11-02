import * as XLSX from 'xlsx';

/** File Excel nhân viên mẫu cho Phân Ca: 8 All In One + 2 Kho (+ 1 Kế toán bị loại khi nhập). */
export function fileNhanVien() {
    const rows: (string | number)[][] = [
        ['DANH SÁCH NHÂN VIÊN'], ['Bộ phận', 'Mã NV', 'Họ tên'],
        ['BP All In One'], ...Array.from({ length: 8 }, (_, i) => ['', 100 + i, `Nhân Viên ${i + 1}`]),
        ['BP Kho'], ['', 201, 'Thủ Kho A'], ['', 202, 'Thủ Kho B'],
        ['BP Kế Toán'], ['', 301, 'Kế Toán X'],
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'S');
    return { name: 'nhan-vien.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })) };
}
