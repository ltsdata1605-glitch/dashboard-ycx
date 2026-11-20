import React, { useState, useMemo } from 'react';
import { AppIcon } from '../../../components/shared/ui/icon/AppIcon';
import { toast } from '../../../components/shared/ui/toast';
import { Button } from '../../../components/shared/ui/Button';
import { Input } from '../../../components/shared/ui/Input';
import { LineBotConfig, InteractedUser } from '../types/lineBot.types';
import { SelectFilterUserModal } from './SelectFilterUserModal';

interface SyntaxConfigTabProps {
    config: LineBotConfig | null;
    isSaving: boolean;
    onSaveConfig: (updates: Partial<LineBotConfig>) => Promise<boolean>;
    interactedUsers?: InteractedUser[];
    isInteractedLoading?: boolean;
    onRefreshInteracted?: () => void;
}

const DEFAULT_SYNTAX = `📝 FORM MẪU LẤY PMH
Loại PMH: Bếp gas đôi Sunhouse SHB3105MD
MĐH Áp dụng: 12345678`;

const DEFAULT_FILTER_NAMES = ['Lê Trường Sơn', 'Sơn'];

const SYNTAX_ROWS: Array<{ cmd: string; desc: string; alias?: string }> = [
    { cmd: 'tk', desc: 'Xem toàn bộ tồn kho sản phẩm', alias: 'thống kê · tk all' },
    { cmd: 'tk event', desc: 'Lọc tồn kho PMH Event cuối tuần', alias: 'tk e' },
    { cmd: 'tk gvgs', desc: 'Lọc tồn kho PMH Giờ Vàng Giá Sốc', alias: 'tk gv' },
    { cmd: 'e{STT} [MĐH]', desc: 'Nhận mã Event nhanh (vd: e1 12345678)' },
    { cmd: 'gv{STT} [MĐH]', desc: 'Nhận mã Giờ Vàng nhanh (vd: gv2 87654321)' },
    { cmd: 'hd', desc: 'Xem hướng dẫn đầy đủ', alias: 'help · hướng dẫn' },
    { cmd: 'huy [mã/MĐH]', desc: 'Hoàn trả PMH về kho khi khách đổi ý' },
];

export const SyntaxConfigTab: React.FC<SyntaxConfigTabProps> = ({
    config,
    isSaving,
    onSaveConfig,
    interactedUsers = [],
    isInteractedLoading = false,
    onRefreshInteracted = () => {}
}) => {
    const [syntax, setSyntax] = useState<string>(config?.syntaxTemplate || DEFAULT_SYNTAX);
    const [autoApprove, setAutoApprove] = useState<boolean>(config?.autoApprove ?? true);
    const [isSelectUserModalOpen, setIsSelectUserModalOpen] = useState(false);
    const [filterNames, setFilterNames] = useState<string[]>(
        config?.filterUserNames && config.filterUserNames.length > 0
            ? config.filterUserNames
            : DEFAULT_FILTER_NAMES
    );
    const [newCandidateName, setNewCandidateName] = useState('');

    const suggestedUsers = useMemo(() => {
        if (!interactedUsers || interactedUsers.length === 0) return [];
        const existing = new Set(filterNames.map(n => n.toLowerCase().trim()));
        return interactedUsers.filter(u => u.displayName && !existing.has(u.displayName.toLowerCase().trim()));
    }, [interactedUsers, filterNames]);

    React.useEffect(() => {
        if (config) {
            if (config.syntaxTemplate) setSyntax(config.syntaxTemplate);
            setAutoApprove(config.autoApprove ?? true);
            if (config.filterUserNames && config.filterUserNames.length > 0) {
                setFilterNames(config.filterUserNames);
            }
        }
    }, [config]);

    const saveAll = async (names: string[]) => {
        const success = await onSaveConfig({
            syntaxTemplate: syntax.trim() || DEFAULT_SYNTAX,
            autoApprove,
            filterUserNames: names
        });
        return success;
    };

    const handleAddName = async () => {
        const trimmed = newCandidateName.trim();
        if (!trimmed) return;
        if (filterNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
            toast.error(`"${trimmed}" đã có trong danh sách`);
            return;
        }
        const updated = [...filterNames, trimmed];
        setFilterNames(updated);
        setNewCandidateName('');
        if (await saveAll(updated)) toast.success(`Đã thêm "${trimmed}"`);
    };

    const handleAddDirectName = async (name: string) => {
        const trimmed = name.trim();
        if (!trimmed || filterNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) return;
        const updated = [...filterNames, trimmed];
        setFilterNames(updated);
        if (await saveAll(updated)) toast.success(`Đã thêm "${trimmed}"`);
    };

    const handleRemoveName = async (nameToRemove: string) => {
        if (filterNames.length <= 1) {
            toast.error('Cần giữ lại ít nhất 1 tên');
            return;
        }
        const updated = filterNames.filter(n => n !== nameToRemove);
        setFilterNames(updated);
        if (await saveAll(updated)) toast.success(`Đã xoá "${nameToRemove}"`);
    };

    const handleSave = async () => {
        if (await saveAll(filterNames)) toast.success('Đã lưu cấu hình');
    };

    return (
        <div className="space-y-4 max-w-2xl">
            {/* 1. Danh sách tên lọc PMH */}
            <div className="p-3.5 sm:p-4 bg-white rounded-card border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <AppIcon name="userCheck" size="md" className="text-emerald-600 shrink-0" />
                        <h3 className="font-bold text-slate-800 text-sm truncate">Tên người lọc PMH</h3>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                            {filterNames.length}
                        </span>
                    </div>
                    <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => setIsSelectUserModalOpen(true)}
                        className="shrink-0 gap-1"
                    >
                        <AppIcon name="users" size="xs" />
                        <span>Chọn từ Bot</span>
                    </Button>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                    Bot tự nhận diện và lọc mã PMH thuộc về những tên này khi nhận tin nhắn chứa danh sách nhiều người.
                </p>

                <div className="flex flex-wrap gap-1.5 min-h-[36px]">
                    {filterNames.map(name => (
                        <span
                            key={name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-control text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300"
                        >
                            {name}
                            <Button
                                variant="ghost"
                                size="icon-inline"
                                type="button"
                                onClick={() => handleRemoveName(name)}
                                className="text-slate-400 hover:text-rose-500 ml-0.5 relative after:absolute after:-inset-3 after:content-['']"
                                title={`Xoá "${name}"`}
                            >
                                <AppIcon name="close" size="sm" />
                            </Button>
                        </span>
                    ))}
                </div>

                <div className="flex gap-2 [&>div:first-child]:flex-1 [&>div:first-child]:min-w-0">
                    <Input
                        aria-label="Tên người nhận mới"
                        type="text"
                        dense
                        value={newCandidateName}
                        onChange={e => setNewCandidateName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddName(); } }}
                        placeholder="Nhập tên mới..."
                        className="bg-slate-50 border-slate-200 rounded-control text-xs"
                    />
                    <Button variant="secondary" size="sm" onClick={handleAddName} className="shrink-0 gap-1">
                        <AppIcon name="add" size="xs" />
                        <span>Thêm</span>
                    </Button>
                </div>

                {suggestedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className="text-[11px] text-slate-400 self-center shrink-0">Gợi ý:</span>
                        {suggestedUsers.slice(0, 5).map(u => (
                            <Button
                                variant="secondary"
                                size="xs"
                                key={u.lineUserId}
                                type="button"
                                onClick={() => handleAddDirectName(u.displayName)}
                                className="gap-1 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                                title={`Thêm: ${u.displayName}`}
                            >
                                <AppIcon name="add" size="xs" className="text-slate-400" />
                                <span className="truncate max-w-[120px]">{u.displayName}</span>
                            </Button>
                        ))}
                    </div>
                )}

                <div className="flex justify-end pt-1">
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
                        <AppIcon name="save" size="xs" />
                        <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
                    </Button>
                </div>
            </div>

            {/* 2. Bảng cú pháp Bot — chỉ lệnh + ý nghĩa */}
            <div className="p-3.5 sm:p-4 bg-white rounded-card border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2">
                    <AppIcon name="command" size="md" className="text-sky-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Cú pháp Bot</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                                <th className="py-1.5 pr-3 text-left">Lệnh</th>
                                <th className="py-1.5 pr-3 text-left">Ý nghĩa</th>
                                <th className="py-1.5 text-left">Tên khác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SYNTAX_ROWS.map(r => (
                                <tr key={r.cmd} className="border-b border-slate-100 last:border-0">
                                    <td className="py-2 pr-3 whitespace-nowrap">
                                        <code className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                                            {r.cmd}
                                        </code>
                                    </td>
                                    <td className="py-2 pr-3 text-slate-700">{r.desc}</td>
                                    <td className="py-2 text-slate-400 font-mono text-[11px] whitespace-nowrap">{r.alias || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <SelectFilterUserModal
                isOpen={isSelectUserModalOpen}
                onClose={() => setIsSelectUserModalOpen(false)}
                interactedUsers={interactedUsers}
                isLoading={isInteractedLoading}
                onRefresh={onRefreshInteracted}
                currentFilterNames={filterNames}
                onToggleName={async (name) => {
                    const trimmed = name.trim();
                    if (filterNames.some(n => n.toLowerCase() === trimmed.toLowerCase())) {
                        await handleRemoveName(trimmed);
                    } else {
                        await handleAddDirectName(trimmed);
                    }
                }}
                onBatchAddNames={async (names) => {
                    const newNames: string[] = [];
                    for (const n of names) {
                        const trimmed = n.trim();
                        if (trimmed && !filterNames.some(e => e.toLowerCase() === trimmed.toLowerCase()) && !newNames.some(e => e.toLowerCase() === trimmed.toLowerCase())) {
                            newNames.push(trimmed);
                        }
                    }
                    if (newNames.length > 0) {
                        const updated = [...filterNames, ...newNames];
                        setFilterNames(updated);
                        await onSaveConfig({ syntaxTemplate: syntax.trim() || DEFAULT_SYNTAX, autoApprove, filterUserNames: updated });
                        toast.success(`Đã thêm ${newNames.length} tên`);
                    }
                }}
            />
        </div>
    );
};
