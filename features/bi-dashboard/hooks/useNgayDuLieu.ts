import { useMemo } from 'react';
import { useIndexedDBState } from './useIndexedDBState';
import { extractDateFromData } from '../services/metricService';
import { shortenSupermarketName } from '../utils/dashboardHelpers';

/**
 * Ngày của DỮ LIỆU đang xem (đọc từ chữ trong báo cáo đã dán) — dùng cho `getMonthProgress(now, ngay)` để dự kiến cuối tháng / %DKHT
 * tính theo tháng của dữ liệu chứ không theo đồng hồ (xem lại báo cáo tháng trước không bị phóng theo số ngày tháng mới).
 *
 * 2026-10-29 (chủ dự án "Xử lý giúp tôi"): trước đây chỉ tab Doanh thu làm vậy; các màn Thi đua (Tổng hợp, So sánh, Cá nhân) đọc đồng
 * hồ → cùng một nhân viên, 2 màn ra 2 %DKHT khi xem dữ liệu tháng cũ. Thứ tự nguồn: báo cáo thi đua của siêu thị → Doanh thu luỹ kế
 * (như tab Doanh thu) → danh sách nhân viên. Không đọc được ngày → null (getMonthProgress lùi về đồng hồ như cũ).
 */
/** Phần thuần (để test): báo cáo thi đua → luỹ kế → danh sách; cái đầu tiên đọc được ngày thắng. */
export function chonNgayDuLieu(thiDua?: string | null, luyKe?: string | null, danhSach?: string | null) {
    return extractDateFromData(thiDua) || extractDateFromData(luyKe) || extractDateFromData(danhSach) || null;
}

export function useNgayDuLieu(supermarketName?: string | null) {
    const safe = supermarketName && supermarketName !== 'Tổng hợp' && supermarketName !== 'TongHop' ? shortenSupermarketName(supermarketName) : '';
    const [thiDua] = useIndexedDBState<string>(safe ? `config-${safe}-thidua` : null, '');
    const [luyKe] = useIndexedDBState<string>('summary-luy-ke', '');
    const [danhSach] = useIndexedDBState<string>(safe ? `config-${safe}-danhsach` : null, '');
    return useMemo(
        () => chonNgayDuLieu(thiDua, luyKe, danhSach),
        [thiDua, luyKe, danhSach],
    );
}
