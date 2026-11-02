import React, { useMemo, useRef, useState } from 'react';
import { StaffMember, ScheduleConfig } from '../types';
import { calculateTotalHours } from '../utils/scheduleUtils';
import { exportToImage } from '../utils/exportUtils';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { Button } from '../../../components/shared/ui/Button';
import { Select } from '../../../components/shared/ui/Select';
import { toast } from '../../../components/shared/ui/toast';

/**
 * Xem ca làm việc theo TỪNG NHÂN VIÊN, theo TỪNG NGÀY — cho điện thoại (2026-10-30, chủ dự án). Bảng đủ 31 cột không đọc được trên
 * màn nhỏ; đây là danh sách dọc: mỗi ngày một dòng (thứ, ngày, ca, vai trò) + tổng kết của người đã chọn. Nút "Xuất ảnh" chụp đúng
 * khối này (qua bộ xuất ảnh chung).
 */
const TEN_THU = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const phanLoaiO = (role: string | undefined, shift: string | undefined): { nhan: string; loai: 'off' | 'gh' | 'kho' | 'tn' | 'thuong' | 'trong' } => {
    if (!role && !shift) return { nhan: '—', loai: 'trong' };
    if (role === 'OFF' || shift === 'OFF') return { nhan: 'OFF', loai: 'off' };
    if (role?.includes('(GH)')) return { nhan: shift || '—', loai: 'gh' };
    if (role?.includes('(Kho)')) return { nhan: shift || '—', loai: 'kho' };
    if (role?.includes('(TN)')) return { nhan: shift || '—', loai: 'tn' };
    return { nhan: shift || role || '—', loai: 'thuong' };
};

const NHAN_LOAI: Record<string, string> = { gh: 'GH', kho: 'KH', tn: 'TN' };
const MAU_LOAI: Record<string, string> = {
    gh: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    kho: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    tn: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
    off: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
};

interface MobileStaffDayViewProps {
    staffList: StaffMember[];
    config: ScheduleConfig;
}

const MobileStaffDayView: React.FC<MobileStaffDayViewProps> = ({ staffList, config }) => {
    const [chonId, setChonId] = useState<string>('');
    const [dangXuat, setDangXuat] = useState(false);
    const khungXuat = useRef<HTMLDivElement>(null);

    const nv = staffList.find(s => s.id === chonId) ?? staffList[0];
    const { year, month, startDay, duration } = config;

    const danhSachNgay = useMemo(() => {
        if (!nv) return [];
        return Array.from({ length: duration }, (_, i) => {
            const d = i + 1;
            const o = nv.schedule[d];
            const ngay = new Date(year, month - 1, startDay + d - 1);
            const { nhan, loai } = phanLoaiO(o?.role, o?.shift);
            return { d, thu: TEN_THU[ngay.getDay()], cuoiTuan: ngay.getDay() === 0 || ngay.getDay() === 6, nhan, loai, ngayThang: `${String(ngay.getDate()).padStart(2, '0')}/${String(month).padStart(2, '0')}` };
        });
    }, [nv, year, month, startDay, duration]);

    if (!nv) return null;
    const tenHienThi = nv.name.split(' - ')[1] || nv.name;

    const xuatAnh = async () => {
        setDangXuat(true);
        try {
            await exportToImage(khungXuat, `Lịch Cá Nhân - ${tenHienThi.replace(/[\\/:*?"<>|]/g, '').trim()} - Tháng ${month}-${year}.png`);
            toast.success('Đã xuất ảnh lịch cá nhân');
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Không xuất được ảnh');
        } finally {
            setDangXuat(false);
        }
    };

    return (
        <div className="space-y-3 px-1">
            <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                    <Select
                        aria-label="Chọn nhân viên"
                        value={nv.id}
                        onChange={e => setChonId(e.target.value)}
                        options={staffList.map(s => ({ value: s.id, label: s.name }))}
                    />
                </div>
                <Button variant="secondary" size="sm" icon="exportImage" isLoading={dangXuat} onClick={xuatAnh}>
                    Xuất ảnh
                </Button>
            </div>

            {/* Khối được chụp: tiêu đề + tổng kết + danh sách ngày (không có nút) */}
            <div ref={khungXuat} className="bg-white dark:bg-slate-900 rounded-card border border-slate-200 dark:border-slate-700 p-3">
                <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Lịch làm việc · Tháng {month}/{year}</p>
                </div>
                <h3 className="type-headline font-bold text-slate-900 dark:text-white mt-0.5">{tenHienThi}</h3>
                <div className="mt-2 grid grid-cols-5 gap-1 text-center">
                    {[
                        { t: 'Giờ công', v: Math.round(calculateTotalHours(nv)) },
                        { t: 'GH', v: nv.stats.gh },
                        { t: 'KH', v: nv.stats.kho },
                        { t: 'TN', v: nv.stats.tn },
                        { t: 'OFF', v: nv.stats.offDays },
                    ].map(o => (
                        <div key={o.t} className="rounded-control bg-slate-50 dark:bg-slate-800 py-1.5">
                            <p className="text-[11px] font-bold text-slate-500">{o.t}</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{o.v || 0}</p>
                        </div>
                    ))}
                </div>
                <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                    {danhSachNgay.map(n => (
                        <li key={n.d} className={`flex items-center gap-3 py-1.5 px-1 ${n.cuoiTuan ? 'bg-rose-50/60 dark:bg-rose-950/20' : ''}`}>
                            <div className="w-12 shrink-0">
                                <p className={`text-xs font-bold ${n.cuoiTuan ? 'text-rose-600' : 'text-slate-700 dark:text-slate-300'}`}>{n.thu}</p>
                                <p className="text-[11px] text-slate-500 tabular-nums">{n.ngayThang}</p>
                            </div>
                            <p className="flex-1 min-w-0 text-base font-black tabular-nums text-slate-900 dark:text-white truncate">{n.nhan}</p>
                            {NHAN_LOAI[n.loai] ? (
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${MAU_LOAI[n.loai]}`}>{NHAN_LOAI[n.loai]}</span>
                            ) : n.loai === 'off' ? (
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${MAU_LOAI.off}`}>OFF</span>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </div>
            <p className="flex items-center gap-1 text-[11px] text-slate-400 px-1">
                <AppIcon name="info" size="xs" /> Chạm “Bảng” phía trên để xem cả nhóm trên một màn hình.
            </p>
        </div>
    );
};

export default MobileStaffDayView;
