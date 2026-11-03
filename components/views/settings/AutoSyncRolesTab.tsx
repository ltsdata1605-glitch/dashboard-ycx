import React from 'react';
import { useMenuConfig } from '../../../contexts/MenuConfigContext';
import { TAT_CA_VAI_TRO, type MenuRole } from '../../../services/menuConfigService';
import { AUTO_SYNC_CARDS } from '../../../constants/autoSyncCards';
import { Button } from '../../shared/ui/Button';
import { Switch } from '../../shared/ui/Switch';

/**
 * Bật/tắt thẻ Auto Sync Pro theo VAI TRÒ (2026-10-31, chủ dự án). Quản trị hệ thống luôn thấy mọi thẻ.
 * Thêm công tắc ON/OFF tổng thể mỗi thẻ (2026-11-03): tắt = ẩn khỏi dock cho MỌI người kể cả admin.
 * Lưu cùng cấu hình menu (features + featureRoles) nên đồng bộ realtime giữa các máy.
 */
const VAI_TRO_CHON: { id: MenuRole; label: string }[] = [
    { id: 'manager', label: 'Quản lý' },
    { id: 'employee', label: 'Nhân viên' },
];

export const AutoSyncRolesTab: React.FC = () => {
    const { features, toggleFeature, featureRoles, setFeatureRoles } = useMenuConfig();

    const batTat = (cardId: string): boolean => features[cardId] === undefined ? true : Boolean(features[cardId]);

    const doiVaiTro = (cardId: string, role: MenuRole) => {
        const hienTai = featureRoles?.[cardId] ?? TAT_CA_VAI_TRO;
        const moi = hienTai.includes(role) ? hienTai.filter(r => r !== role) : [...hienTai, role];
        void setFeatureRoles(cardId, moi);
    };

    return (
        <div className="space-y-3">
            <div>
                <h2 className="type-headline font-bold text-slate-900 dark:text-white">Bật/tắt chức năng auto</h2>
                <p className="type-footnote text-slate-500">Bật/tắt và chọn vai trò được thấy từng thẻ Auto Sync Pro (thanh bên phải).</p>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-card border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                {AUTO_SYNC_CARDS.map(card => {
                    const daBat = batTat(card.id);
                    return (
                        <li key={card.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <div className="flex items-center gap-3 min-w-0">
                                <Switch
                                    checked={daBat}
                                    onChange={(next) => void toggleFeature(card.id, next)}
                                    aria-label={`${daBat ? 'Tắt' : 'Bật'} ${card.label}`}
                                />
                                <span className={`type-subhead font-semibold ${daBat ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>{card.label}</span>
                            </div>
                            <div role="group" aria-label={`Ai được thấy ${card.label}`} className={`flex items-center gap-1 ${!daBat ? 'opacity-40 pointer-events-none' : ''}`}>
                                {VAI_TRO_CHON.map(v => {
                                    const dangThay = (featureRoles?.[card.id] ?? TAT_CA_VAI_TRO).includes(v.id);
                                    return (
                                        <Button
                                            key={v.id}
                                            variant="toggle"
                                            size="xs"
                                            aria-pressed={dangThay}
                                            onClick={() => doiVaiTro(card.id, v.id)}
                                            className="ycx-hit text-[11px] font-semibold"
                                            title={`${dangThay ? 'Đang cho' : 'Chưa cho'} ${v.label} thấy`}
                                        >
                                            {v.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default AutoSyncRolesTab;
