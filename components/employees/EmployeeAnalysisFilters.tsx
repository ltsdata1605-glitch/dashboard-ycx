import React from 'react';
import { AppIcon } from '../shared/ui/icon/AppIcon';
import { toast } from '../shared/ui/toast';
import { Button } from '../shared/ui/Button';

interface EmployeeAnalysisFiltersProps {
    hideZeroRevenue: boolean;
    setHideZeroRevenue: (val: boolean) => void;
}

const EmployeeAnalysisFilters: React.FC<EmployeeAnalysisFiltersProps> = ({
    hideZeroRevenue,
    setHideZeroRevenue,
}) => {
    const handleToggle = () => {
        const newVal = !hideZeroRevenue;
        setHideZeroRevenue(newVal);
        const msg = newVal ? 'Đã ẩn nhân viên No Sale' : 'Đang hiện tất cả nhân viên';
        toast.success(msg, { duration: 2000 });
    };

    return (
        <div className="relative flex items-center hide-on-export">
            <Button
                type="button"
                variant="toolbar" size="icon"
                onClick={handleToggle}
                className="ycx-hit flex items-center justify-center rounded-control transition-colors" aria-pressed={hideZeroRevenue}
                title={hideZeroRevenue ? 'Đang ẩn nhân viên No Sale — Nhấn để hiện' : 'Đang hiện tất cả — Nhấn để ẩn No Sale'}
            >
                <AppIcon name={hideZeroRevenue ? 'userReject' : 'userCheck'} size="md" />
            </Button>
        </div>
    );
};

export default EmployeeAnalysisFilters;
