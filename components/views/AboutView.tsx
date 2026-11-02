import React from 'react';
import { AppIcon } from '../shared/ui/icon/AppIcon';
import type { IconName } from '../shared/ui/icon/iconRegistry';
import { ListGroup, ListRow, type ListIconTone } from '../shared/ui/ListGroup';
import { useActiveTab } from '../../contexts/LayoutContext';
import { useMenuConfig } from '../../contexts/MenuConfigContext';

/**
 * Trang Giới thiệu — kiểu "Giới thiệu" của Cài đặt iOS (GĐ7, KE_HOACH_GIAO_DIEN_APPLE.md).
 *
 * Bản cũ hứa SAI: "Bảo mật tuyệt đối… hoàn toàn không đẩy lên máy chủ" và "Trợ lý AI phân tích chuyên sâu" — thực tế dữ liệu
 * bán hàng CÓ đồng bộ lên tài khoản (Firebase) để người cùng Kho xem và dùng nhiều máy; AI (Gemini) chỉ có ở Phân ca (gợi ý ca
 * xoay) và Tính thuế (đọc ảnh phiếu lương). Nay mỗi câu đều đúng với code đang chạy. Mỗi phân hệ là một hàng bấm được để mở.
 */
const PHAN_HE: { tab: string; ten: string; moTa: string; icon: IconName; tone: ListIconTone }[] = [
    { tab: 'analysis', ten: 'Phân tích YCX', moTa: 'Doanh thu, DTQĐ, ngành hàng, nhân viên từ file Excel YCX', icon: 'chartLine', tone: 'sky' },
    { tab: 'employees', ten: 'Report BI', moTa: 'Realtime, luỹ kế, thi đua và thưởng theo siêu thị', icon: 'chartBar', tone: 'sky' },
    { tab: 'check-thuong', ten: 'Check thưởng', moTa: 'Tra cứu và so sánh thưởng thi đua giữa các siêu thị', icon: 'award', tone: 'amber' },
    { tab: 'reports', ten: 'Báo cáo khai thác', moTa: 'Ghi nhận khai thác của nhân viên trong ca', icon: 'report', tone: 'emerald' },
    { tab: 'tools-line-bot', ten: 'Bot LINE', moTa: 'Cấp phát mã PMH và gửi thông báo vào nhóm LINE', icon: 'bot', tone: 'emerald' },
    { tab: 'tools-print-sticker', ten: 'In Sticker', moTa: 'Tem giá sốc, giờ vàng, phiếu rút thăm', icon: 'print', tone: 'amber' },
    { tab: 'tools-phanca', ten: 'Phân ca', moTa: 'Xếp lịch làm việc theo ca xoay', icon: 'calendar', tone: 'sky' },
    { tab: 'tools-tax', ten: 'Tính thuế', moTa: 'Thuế TNCN 2 đợt lương, thưởng', icon: 'calculator', tone: 'rose' },
];

export default function AboutView() {
    const { setActiveTab } = useActiveTab();
    const { isFeatureEnabled } = useMenuConfig();
    // Phân hệ đã tắt trong Quản lý Bật/Tắt thì ẩn luôn dòng của nó (2026-10-30, chủ dự án).
    const phanHeDangBat = PHAN_HE.filter(p => isFeatureEnabled(p.tab));

    return (
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-7 pb-32">
            {/* Đầu trang: biểu tượng ứng dụng + tên + phiên bản (như trang Giới thiệu của iOS) */}
            <header className="flex flex-col items-center text-center">
                <div className="w-[72px] h-[72px] rounded-card bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-md shadow-sky-500/20">
                    <AppIcon name="chartBar" size="hero" className="text-white" />
                </div>
                <h1 className="mt-3 type-title font-bold text-slate-900">Dashboard</h1>
                <p className="type-footnote text-slate-500">Phiên bản 11.2 · 2026</p>
            </header>

            {phanHeDangBat.length > 0 && (
                <ListGroup title="Phân hệ">
                    {phanHeDangBat.map(p => (
                        <ListRow key={p.tab} icon={p.icon} iconTone={p.tone} label={p.ten} description={p.moTa} onClick={() => setActiveTab(p.tab)} />
                    ))}
                </ListGroup>
            )}

            <p className="text-center type-footnote text-slate-400">@21707</p>
        </div>
    );
}
