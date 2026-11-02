import type { User } from 'firebase/auth';
import { toast } from '../components/shared/ui/toast';

type NapCloud = () => Promise<{ deleteCloudSalesData: (user: User) => Promise<void> }>;

/**
 * Máy đã xoá hết dữ liệu bán hàng → xoá luôn bản trên cloud (hooks/useDataManagement: xoá tệp / xoá dữ liệu đang xem).
 * AUD-020 (2026-10-28): trước đây lỗi (mất mạng, hết phiên, tải mảnh code hỏng) chỉ ghi console trong khi app đã báo "Đã xoá" —
 * listener cloud sau đó có thể kéo dữ liệu vừa xoá VỀ LẠI mà người dùng không biết vì sao. Nay báo rõ để xoá lại khi có mạng.
 * Module tách riêng (nhỏ, không kéo Firebase vào gói tải đầu): cloudDataService vẫn nạp động như cũ.
 */
export function xoaBanCloudKhiMayTrong(user: User, nap: NapCloud = () => import('./cloudDataService')): Promise<boolean> {
    return nap()
        .then(({ deleteCloudSalesData }) => deleteCloudSalesData(user))
        .then(() => true)
        .catch((err) => {
            console.error('[CloudData] Không xoá được bản trên cloud:', err);
            toast.warning('Đã xoá trên máy nhưng CHƯA xoá được bản trên đám mây', {
                description: 'Dữ liệu có thể tự tải lại từ đám mây. Kiểm tra mạng rồi xoá lại.',
                duration: 8000,
            });
            return false;
        });
}
