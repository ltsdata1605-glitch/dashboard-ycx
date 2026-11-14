import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { Employee } from '../types/nhanVienTypes';
import { BonusView, BonusDataModal } from './nhanvien/BonusTab';
import { shortenSupermarketName } from '../utils/dashboardHelpers';
import { useExportOptions } from '../hooks/useExportOptions';
import ExportOptionsModal from '../../../components/shared/export/ExportOptionsModal';
import { ExportOptionsProvider } from '../contexts/ExportOptionsContext';
import { useNhanVienData } from '../hooks/useNhanVienData';
import { useBonusAutoBridge } from '../hooks/useBonusAutoBridge';
import { useMultiMonthBonusRun } from '../hooks/useMultiMonthBonusRun';
import { useIndexedDBState } from '../hooks/useIndexedDBState';
import { ConfirmDialog } from '../../../components/shared/ui/ConfirmDialog';
import { MultiSelectDropdown } from '../../../components/shared/ui/MultiSelectDropdown';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/shared/ui/Button';
import { TopBarActions } from '../../../components/shared/ui/TopBarActions';
import { clearAnalysisEmployees, nhapFileNhanVien } from '../services/analysisEmployeeSyncService';
import { toast } from '../../../components/shared/ui/toast';

interface NhanVienProps {
    isActive?: boolean;
    isThuongTab?: boolean;
}

export const NhanVien: React.FC<NhanVienProps> = ({ isActive }) => {
    const [editingBonusEmployee, setEditingBonusEmployee] = useState<Employee | null>(null);
    const [isBatchBonusMode, setIsBatchBonusMode] = useState(false);

    const data = useNhanVienData(isActive);
    const {
        supermarkets,
        activeSupermarkets,
        activeDepartments,
        effectiveActiveDepartments,
        departmentOptions,
        aggregatedData,
        revenueRows,
        allEmployees,
        toggleSupermarket,
        toggleDepartment,
        handleSaveBonus,
        handleSaveBonusBatch,
        handleSaveBonusMonthly,
        handleSaveBonusCompare,
        resolveEmployeeSupermarket,
        setBonusPeriodLabel,
        hasAnalysisEmployees,
        loadAnalysisEmployees,
    } = data;

    const [highlightedEmpArray, setHighlightedEmpArray] = useIndexedDBState<string[]>('highlight-employees-multi', []);
    const highlightedEmployees = useMemo(() => new Set(highlightedEmpArray), [highlightedEmpArray]);

    const handleBonusModalClose = (reason: 'save' | 'skip' | 'stop') => {
        if (!isBatchBonusMode || reason === 'stop') {
            setEditingBonusEmployee(null);
            setIsBatchBonusMode(false);
            return;
        }
        const currentIdx = allEmployees.findIndex(e => e.originalName === editingBonusEmployee?.originalName);
        if (currentIdx < allEmployees.length - 1) {
            setEditingBonusEmployee(allEmployees[currentIdx + 1]);
        } else {
            setEditingBonusEmployee(null);
            setIsBatchBonusMode(false);
        }
    };

    const startBatchBonusUpdate = useCallback(() => {
        if (allEmployees.length > 0) {
            setIsBatchBonusMode(true);
            setEditingBonusEmployee(allEmployees[0]);
        }
    }, [allEmployees]);

    const bonusAutoBridge = useBonusAutoBridge(allEmployees, handleSaveBonusBatch);
    const bonusMultiMonthRun = useMultiMonthBonusRun(allEmployees, handleSaveBonusMonthly, handleSaveBonusCompare);

    const exportOptions = useExportOptions();

    const { userRole, isDemoMode } = useAuth();
    const canManageFiles = isDemoMode || userRole === 'admin' || userRole === 'manager';

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [xoaNVConfirm, setXoaNVConfirm] = useState(false);

    const nhapFileYcx = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChosen = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const toastId = toast.loading('Đang xử lý file nhân viên...');
        try {
            const result = await nhapFileNhanVien(file);
            toast.dismiss(toastId);
            toast.success(`Đã nạp ${result.totalCount} nhân viên từ "${file.name}"!`);
            await loadAnalysisEmployees();
        } catch (err: unknown) {
            toast.dismiss(toastId);
            const msg = err instanceof Error ? err.message : 'Lỗi xử lý file';
            toast.error(msg);
        } finally {
            if (e.target) e.target.value = '';
        }
    }, [loadAnalysisEmployees]);

    const handleXoaDanhSach = useCallback(async () => {
        try {
            await clearAnalysisEmployees();
            await loadAnalysisEmployees();
            toast.success('Đã xoá danh sách nhân viên khỏi máy.');
        } catch {
            toast.error('Không thể xoá danh sách nhân viên.');
        } finally {
            setXoaNVConfirm(false);
        }
    }, [loadAnalysisEmployees]);

    return (
        <ExportOptionsProvider value={exportOptions}>
            <div className="space-y-4">
                {/* Thanh điều hướng / Top Bar Actions */}
                <TopBarActions enabled={isActive}>
                    <TopBarActions.Group>
                        <MultiSelectDropdown
                            triggerClassName="border-0 bg-transparent text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1.5 rounded-none"
                            icon={<AppIcon name="store" size="sm" className="text-sky-500 scale-90" />}
                            triggerLabel={activeSupermarkets.length === supermarkets.length ? 'All' : Array.from(new Set(activeSupermarkets.map(s => shortenSupermarketName(s)))).join(', ')}
                            count={Array.from(new Set(activeSupermarkets.map(s => shortenSupermarketName(s)))).length}
                            allLabel="Chọn tất cả"
                            allChecked={activeSupermarkets.length === supermarkets.length}
                            onToggleAll={() => toggleSupermarket('all')}
                            options={Array.from(new Map(supermarkets.map(sm => [shortenSupermarketName(sm), sm])).values()).map(sm => ({
                                key: sm,
                                label: shortenSupermarketName(sm),
                                checked: activeSupermarkets.some(a => shortenSupermarketName(a) === shortenSupermarketName(sm)),
                            }))}
                            onToggleOption={toggleSupermarket}
                        />
                        <MultiSelectDropdown
                            triggerClassName="border-0 bg-transparent text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1.5 rounded-none"
                            icon={<AppIcon name="restore" size="sm" className="text-sky-500 scale-90" />}
                            triggerLabel={activeDepartments.includes('all') ? 'All' : activeDepartments.join(', ')}
                            count={activeDepartments.includes('all') ? departmentOptions.length : activeDepartments.length}
                            allLabel="All"
                            allChecked={activeDepartments.includes('all')}
                            onToggleAll={() => toggleDepartment('all')}
                            options={departmentOptions.map(dept => ({
                                key: dept,
                                label: dept,
                                checked: activeDepartments.includes(dept) || activeDepartments.includes('all'),
                            }))}
                            onToggleOption={toggleDepartment}
                        />
                    </TopBarActions.Group>
                    {canManageFiles && (
                        <TopBarActions.Group>
                            <TopBarActions.Button
                                onClick={nhapFileYcx}
                                icon="upload"
                                title="Nhập danh sách nhân viên"
                                ariaLabel="Nhập nhân viên"
                            />
                            <TopBarActions.Link
                                href="https://office.thegioididong.com/quan-ly-phan-ca"
                                icon="externalLink"
                                title="Lấy danh sách nhân viên từ hệ thống"
                            />
                            <TopBarActions.Button
                                onClick={() => setXoaNVConfirm(true)}
                                icon="delete"
                                variant="rose"
                                title="Xoá danh sách nhân viên"
                                ariaLabel="Xoá danh sách"
                                borderLeft
                            />
                        </TopBarActions.Group>
                    )}
                </TopBarActions>

                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onClick={e => { e.currentTarget.value = ''; }}
                    onChange={handleFileChosen}
                />

                {/* Khi chưa có danh sách nhân viên */}
                {!hasAnalysisEmployees ? (
                    <div className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/60 rounded-card p-8 sm:p-12 text-center space-y-5 shadow-xs">
                        <div className="w-16 h-16 mx-auto rounded-card bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                            <AppIcon name="users" size="state" />
                        </div>
                        <div className="max-w-md mx-auto space-y-2">
                            <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-100 leading-7">
                                Chưa có danh sách nhân viên
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Vui lòng nạp danh sách nhân viên bằng file Excel để hiển thị bảng thưởng.
                            </p>
                        </div>
                        {canManageFiles && (
                            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                                <Button
                                    variant="primary"
                                    onClick={nhapFileYcx}
                                    className="ycx-hit font-bold text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-2xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                                >
                                    <AppIcon name="upload" size="md" />
                                    <span>Nhập danh sách nhân viên</span>
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 overflow-hidden rounded-none lg:rounded-card shadow-sm">
                        <BonusView
                            employees={allEmployees}
                            bonusData={aggregatedData.bonusData}
                            revenueRows={revenueRows}
                            supermarketName={activeSupermarkets.length === 1 ? activeSupermarkets[0] : 'Tổng hợp'}
                            activeSupermarkets={activeSupermarkets}
                            onEmployeeClick={setEditingBonusEmployee}
                            onBatchUpdate={startBatchBonusUpdate}
                            autoBridge={bonusAutoBridge}
                            multiMonthRun={bonusMultiMonthRun}
                            bonusPeriodLabel={aggregatedData.bonusPeriodLabel}
                            onSetBonusPeriodLabel={setBonusPeriodLabel}
                            highlightedEmployees={highlightedEmployees}
                            activeDepartments={effectiveActiveDepartments}
                            isActive={isActive}
                            anDoanhThu={true}
                        />
                    </div>
                )}

                {/* BonusDataModal */}
                {editingBonusEmployee && (
                    <BonusDataModal
                        employee={editingBonusEmployee}
                        nextEmployee={isBatchBonusMode ? allEmployees[allEmployees.findIndex(e => e.originalName === editingBonusEmployee.originalName) + 1] || null : null}
                        supermarketName={resolveEmployeeSupermarket(editingBonusEmployee.originalName)}
                        remainingInBatch={isBatchBonusMode ? allEmployees.length - allEmployees.findIndex(e => e.originalName === editingBonusEmployee.originalName) : 0}
                        onClose={handleBonusModalClose}
                        onSave={handleSaveBonus}
                    />
                )}

                <ExportOptionsModal
                    isOpen={!!exportOptions.pendingExport}
                    onClose={exportOptions.handleClose}
                    onDownload={exportOptions.handleDownload}
                    onShare={exportOptions.handleShare}
                    onCopy={exportOptions.handleCopy}
                    canShare={exportOptions.canShare}
                    filename={exportOptions.pendingExport?.filename || ''}
                />

                <ConfirmDialog
                    isOpen={xoaNVConfirm}
                    onClose={() => setXoaNVConfirm(false)}
                    onConfirm={handleXoaDanhSach}
                    title="Xoá danh sách nhân viên?"
                    message="Danh sách nhân viên sẽ bị xoá khỏi máy này. Bạn có thể nhập lại bằng file Excel hoặc đồng bộ lại từ thiết bị khác."
                    confirmText="Xoá"
                    variant="danger"
                />
            </div>
        </ExportOptionsProvider>
    );
};

export default React.memo(NhanVien);
