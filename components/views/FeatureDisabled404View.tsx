import React from 'react';
import { useActiveTab } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMenuConfig } from '../../contexts/MenuConfigContext';
import { Button } from '../shared/ui/Button';
import { AppIcon } from '../shared/ui/icon';
import { getFeatureById } from '../../constants/menuFeatures';
import { timTabBatDauTien } from '../layout/navThayThe';

interface FeatureDisabled404ViewProps {
    featureId: string;
    onGoToAdminConfig?: () => void;
}

export const FeatureDisabled404View: React.FC<FeatureDisabled404ViewProps> = ({
    featureId,
    onGoToAdminConfig,
}) => {
    const { setActiveTab } = useActiveTab();
    const { userRole, isDemoMode } = useAuth();
    const { isFeatureEnabled } = useMenuConfig();
    const isAdmin = userRole === 'admin';
    const canAccessLineBot = isDemoMode || userRole === 'admin' || userRole === 'manager';
    const feature = getFeatureById(featureId);
    const featureName = feature ? feature.label : featureId;

    const handleBackHome = () => {
        setActiveTab(timTabBatDauTien(isFeatureEnabled, canAccessLineBot));
    };

    const handleOpenAdminSettings = () => {
        if (onGoToAdminConfig) {
            onGoToAdminConfig();
        } else {
            // Chuyển tới tab Phân Quyền & Bật tắt chức năng
            try {
                sessionStorage.setItem('ycx_open_menu_config_tab', '1');
            } catch {
                /* ignore */
            }
            setActiveTab('settings');
        }
    };

    return (
        <div className="flex-1 w-full min-h-[calc(100dvh-120px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
            {/* Inline keyframe animations for funny & professional sleep mascot */}
            <style>{`
                @keyframes ycx-sleep-breath {
                    0%, 100% { transform: scale(1) translateY(0); }
                    50% { transform: scale(1.03, 0.97) translateY(-3px); }
                }
                @keyframes ycx-zzz-1 {
                    0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
                    30% { opacity: 0.9; }
                    80% { opacity: 0.9; }
                    100% { opacity: 0; transform: translate(24px, -36px) scale(1.3); }
                }
                @keyframes ycx-zzz-2 {
                    0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
                    35% { opacity: 0.9; }
                    85% { opacity: 0.9; }
                    100% { opacity: 0; transform: translate(32px, -52px) scale(1.5); }
                }
                @keyframes ycx-zzz-3 {
                    0% { opacity: 0; transform: translate(0, 0) scale(0.6); }
                    40% { opacity: 0.9; }
                    90% { opacity: 0.9; }
                    100% { opacity: 0; transform: translate(40px, -68px) scale(1.7); }
                }
                @keyframes ycx-rock-bed {
                    0%, 100% { transform: rotate(-1.5deg); }
                    50% { transform: rotate(1.5deg); }
                }
                @keyframes ycx-star-twinkle {
                    0%, 100% { opacity: 0.2; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
            `}</style>

            <div className="relative max-w-xl w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl text-center overflow-hidden">
                {/* Background decorative soft glows */}
                <div className="absolute -top-24 -left-24 w-56 h-56 bg-sky-200/40 dark:bg-sky-900/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

                {/* Status Pill Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/80 text-amber-700 dark:text-amber-400 text-xs font-bold tracking-wide uppercase shadow-2xs mb-4">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Lỗi 404 • Tính năng tạm đóng</span>
                </div>

                {/* Funny Animated Sleep Mascot (Chiếc giường ngủ bồng bềnh & Mascot đắp chăn ngủ ngáy Zzz) */}
                <div className="relative my-4 flex items-center justify-center">
                    <div 
                        className="relative w-44 h-40 sm:w-52 sm:h-44 flex items-center justify-center"
                        style={{ animation: 'ycx-rock-bed 4s ease-in-out infinite' }}
                    >
                        {/* Twinkling stars in background */}
                        <span className="absolute top-2 left-6 text-amber-400 text-sm select-none" style={{ animation: 'ycx-star-twinkle 2.5s ease-in-out infinite' }}>✦</span>
                        <span className="absolute top-6 right-8 text-sky-400 text-xs select-none" style={{ animation: 'ycx-star-twinkle 3.2s ease-in-out infinite 0.8s' }}>✧</span>
                        <span className="absolute bottom-6 left-4 text-indigo-400 text-xs select-none" style={{ animation: 'ycx-star-twinkle 2.8s ease-in-out infinite 1.4s' }}>★</span>

                        {/* Floating Zzz */}
                        <div className="absolute top-2 right-10 pointer-events-none select-none font-black text-sky-500 dark:text-sky-400">
                            <span 
                                className="absolute text-sm"
                                style={{ animation: 'ycx-zzz-1 3s ease-out infinite' }}
                            >
                                z
                            </span>
                            <span 
                                className="absolute text-lg font-bold"
                                style={{ animation: 'ycx-zzz-2 3s ease-out infinite 1s' }}
                            >
                                Z
                            </span>
                            <span 
                                className="absolute text-2xl font-black text-indigo-500 dark:text-indigo-400"
                                style={{ animation: 'ycx-zzz-3 3s ease-out infinite 2s' }}
                            >
                                Z
                            </span>
                        </div>

                        {/* Sleeping Robot & Bed SVG */}
                        <svg
                            viewBox="0 0 200 160"
                            className="w-full h-full drop-shadow-lg"
                            style={{ animation: 'ycx-sleep-breath 3.5s ease-in-out infinite' }}
                        >
                            {/* Bed frame / Cloud Base */}
                            <ellipse cx="100" cy="135" rx="75" ry="14" fill="#cbd5e1" opacity="0.4" />
                            
                            {/* Cloud-like Soft Bed */}
                            <path
                                d="M 30 115 Q 30 95 50 95 Q 65 80 85 92 Q 105 75 130 90 Q 155 82 170 100 Q 175 120 155 125 L 45 125 Q 30 125 30 115 Z"
                                fill="#e2e8f0"
                                className="dark:fill-slate-800"
                            />
                            
                            {/* Mattress Soft Blue */}
                            <rect x="38" y="98" width="124" height="22" rx="11" fill="#38bdf8" opacity="0.85" />
                            
                            {/* Soft Pillow */}
                            <rect x="42" y="80" width="36" height="24" rx="10" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                            
                            {/* Sleeping Mascot Face (Nhắm mắt ngủ say sưa) */}
                            <g transform="translate(62, 70)">
                                {/* Head */}
                                <circle cx="16" cy="16" r="16" fill="#f8fafc" stroke="#0284c7" strokeWidth="2.5" />
                                
                                {/* Sleeping Nightcap (Mũ ngủ đáng yêu) */}
                                <path
                                    d="M 6 8 Q 14 -8 32 -10 Q 38 -2 28 8 Z"
                                    fill="#6366f1"
                                />
                                <circle cx="34" cy="-10" r="4.5" fill="#fef08a" />

                                {/* Sleeping Eyes: (- ‿ -) */}
                                <path d="M 9 17 Q 13 21 17 17" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                                <path d="M 21 17 Q 25 21 29 17" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                                
                                {/* Rosy Cheeks */}
                                <circle cx="9" cy="21" r="2.5" fill="#f43f5e" opacity="0.4" />
                                <circle cx="29" cy="21" r="2.5" fill="#f43f5e" opacity="0.4" />

                                {/* Peaceful Smile */}
                                <path d="M 16 23 Q 19 25 22 23" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
                            </g>

                            {/* Warm Blanket tucked in (Chăn đắp ấm áp kẻ sọc) */}
                            <path
                                d="M 75 88 Q 120 84 165 92 L 165 116 Q 120 122 75 116 Z"
                                fill="#0284c7"
                                rx="8"
                            />
                            {/* Blanket Pattern lines */}
                            <line x1="95" y1="89" x2="95" y2="117" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                            <line x1="120" y1="88" x2="120" y2="119" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                            <line x1="145" y1="90" x2="145" y2="117" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />

                            {/* Tiny hands holding the blanket */}
                            <circle cx="82" cy="90" r="4" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.5" />
                            <circle cx="106" cy="89" r="4" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.5" />
                        </svg>
                    </div>
                </div>

                {/* Big Gradient 404 Headline */}
                <div className="space-y-2 mt-2">
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                        404
                    </h2>
                    
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 flex-wrap">
                        <span>Tính năng đã đi nằm chỗ rồi bạn ơi!</span>
                        <span className="text-2xl select-none">🛌💤</span>
                    </h3>

                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed pt-1">
                        Chức năng <strong className="text-sky-600 dark:text-sky-400 font-semibold">«{featureName}»</strong> hiện đang được Quản trị hệ thống tạm thời cho nghỉ ngơi dưỡng sức hoặc nâng cấp dữ liệu.
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 max-w-sm mx-auto">
                        Dù bạn có giữ đường link trực tiếp cũng không thể truy cập lúc này. Hãy quay lại sau khi tính năng đã được sạc đầy năng lượng nhé!
                    </p>
                </div>

                {/* Mini details card */}
                <div className="mt-5 p-3 sm:p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-card border border-slate-200/70 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs text-left">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-control bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                            <AppIcon name={feature?.icon || 'viewList'} size="sm" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{featureName}</p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">?tab={featureId}</p>
                        </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 shrink-0">
                        Đã tắt bởi Quản trị viên
                    </span>
                </div>

                {/* Admin Note if user is Admin */}
                {isAdmin && (
                    <div className="mt-4 p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 rounded-popup text-left text-xs text-indigo-900 dark:text-indigo-200 flex items-start gap-2">
                        <AppIcon name="security" size="sm" className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-bold">Ghi chú Quản trị viên:</p>
                            <p className="text-indigo-700 dark:text-indigo-300 text-[11px] mt-0.5">
                                Bạn đang đăng nhập tài khoản Quản trị hệ thống. Bạn có thể mở lại tính năng này bất cứ lúc nào trong mục Phân Quyền.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <Button
                        variant="primary"
                        size="md"
                        onClick={handleBackHome}
                        icon="home"
                        className="w-full sm:w-auto shadow-md"
                    >
                        Về trang chủ
                    </Button>

                    {isAdmin && (
                        <Button
                            variant="secondary"
                            size="md"
                            onClick={handleOpenAdminSettings}
                            icon="settings"
                            className="w-full sm:w-auto border-indigo-200 hover:border-indigo-400 text-indigo-700 dark:text-indigo-300"
                        >
                            Quản lý Bật/Tắt chức năng
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeatureDisabled404View;

