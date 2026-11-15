import React from 'react';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { Button } from '../../../components/shared/ui/Button';
import { saoChep } from '../../../components/shared/ui/saoChep';
import { taoVanBanNhanXet, type ThongTinNhanXet } from '../services/nhanXetDuKien';

/**
 * Nút "Copy nhận xét" (2026-11-15, chủ dự án): chép đoạn đánh giá theo cột % D.KIẾN — môn 80–99% sắp đạt 100% cần tập trung (còn thiếu
 * bao nhiêu), nhóm hiệu quả kém — để dán Zalo/LINE. Thay dòng nhận xét đặt trên thanh lọc (bị ép 3 dòng, đẩy "Dạng bảng" xuống hàng).
 * Nhận xét theo NHÓM ĐANG LỌC (`rows` + `tenNhom` do CheckThuongSearchView truyền theo thẻ đang chọn).
 */
export const CheckThuongCopyNhanXet: React.FC<ThongTinNhanXet> = (thongTin) => (
    <Button
        variant="tinted"
        size="none"
        type="button"
        data-testid="check-thuong-copy-nhan-xet"
        onClick={() => { void saoChep(taoVanBanNhanXet(thongTin), { thanhCong: `Đã copy nhận xét nhóm ${thongTin.tenNhom || 'Tất cả'}`, id: 'copy-nhan-xet' }); }}
        title={`Copy nhận xét nhóm ${thongTin.tenNhom || 'Tất cả'}: môn 80–99% sắp đạt 100% cần tập trung, nhóm hiệu quả kém`}
        className="ycx-hit h-8 px-2.5 rounded-control text-xs gap-1.5"
    >
        <AppIcon name="copy" size="xs" />
        <span>Copy nhận xét</span>
    </Button>
);
