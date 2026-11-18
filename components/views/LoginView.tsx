import React, { useEffect, useRef, useState } from 'react';
import { AppIcon } from '../shared/ui/icon/AppIcon';
import { useAuth } from '../../contexts/AuthContext';
import { Button, cn } from '../shared/ui/Button';
import { getErrorMessage, getErrorCode } from '../../utils/dataUtils';
import {
    isStandaloneMode, isInAppBrowser, isIOSDevice,
    preparePwaHandoff, startPwaHandoffLogin, claimPwaHandoff, hasPendingPwaHandoff, clearPendingPwaHandoff,
    readPendingHandoff,
    isPwaHandoffClaiming, takePwaHandoffError, PwaHandoffSignInError,
    layTaiKhoanGanNhat, quenTaiKhoan, takePrewarmedPwaHandoff, getOrPreparePwaHandoff,
    type PreparedPwaHandoff,
} from '../../services/firebase';

const LoginView: React.FC = () => {
    const { loginWithGoogle, isLoading } = useAuth();
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const isLoggingInRef = useRef(false);
    const [error, setError] = useState<string | null>(() =>
        takePwaHandoffError() ? 'Chưa vào được ứng dụng sau khi đăng nhập Google. Vui lòng bấm "Tiếp tục với Google" lại.' : null);

    const [isInAppWebView] = useState(() => isInAppBrowser());
    const [isStandalone] = useState(() => isStandaloneMode());
    const [isIOS] = useState(() => isIOSDevice());
    // Tài khoản đã dùng trên máy này (2026-10-21): Google chọn sẵn, bỏ bước chọn tài khoản.
    const [taiKhoanNho, setTaiKhoanNho] = useState(() => layTaiKhoanGanNhat());

    // Toàn bộ nền tảng (Desktop, Laptop, Mobile, Web, PWA): dùng cơ chế chuyển hướng cùng tab
    // qua auth.dashboard.pro.vn PKCE Handoff, không mở bất kỳ cửa sổ popup nào.
    const useHandoff = true;

    const preparedRef = useRef<PreparedPwaHandoff | null>(null);
    const [isPreparingPkce, setIsPreparingPkce] = useState(true);
    const [isPreparingReopen, setIsPreparingReopen] = useState(false);

    const isReopeningRef = useRef(false);
    const [isReopening, setIsReopening] = useState(false);

    // Phân biệt phiên vừa bấm chuyển hướng ngay trong trang hiện tại (đang rời trang sang Google)
    // với trường hợp tải lại trang / bấm Back quay về khi localStorage còn sót mã handoff cũ.
    const initiatedInCurrentPageRef = useRef(false);
    const navigationStartedAtRef = useRef(0);

    // Vừa quay về từ trang đăng nhập (còn mã chờ, hoặc AuthContext đang nhận phiên): hiện màn "Đang hoàn tất",
    // KHÔNG hiện lại form đăng nhập — trước 2026-10-13 form hiện lại vài giây khiến người dùng tưởng bị lỗi.
    const [waitingHandoff, setWaitingHandoff] = useState(() => useHandoff && (hasPendingPwaHandoff() || isPwaHandoffClaiming()));

    const [tapCount, setTapCount] = useState(0);
    const [showLogin, setShowLogin] = useState(() => useHandoff && (hasPendingPwaHandoff() || isPwaHandoffClaiming()));
    const [showGame, setShowGame] = useState(false);
    const [gamePhase, setGamePhase] = useState<'idle' | 'playing' | 'done'>('idle');
    const [gameScore, setGameScore] = useState(0);
    const [gameTime, setGameTime] = useState(5);

    const replenishPkceIfNeeded = () => {
        if (!preparedRef.current) {
            setIsPreparingPkce(true);
            getOrPreparePwaHandoff()
                .then(p => {
                    preparedRef.current = p;
                    setIsPreparingPkce(false);
                })
                .catch(() => {
                    setIsPreparingPkce(false);
                });
        }
    };

    const resetWaitingState = () => {
        initiatedInCurrentPageRef.current = false;
        navigationStartedAtRef.current = 0;
        isLoggingInRef.current = false;
        isReopeningRef.current = false;
        setWaitingHandoff(false);
        setIsLoggingIn(false);
        setIsReopening(false);
        setIsPreparingReopen(false);
        replenishPkceIfNeeded();
    };

    // Khởi tạo PKCE thuần túy trong useEffect (tuân thủ StrictMode & Concurrent React, không tạo side-effect trong useState)
    useEffect(() => {
        if (!useHandoff) {
            setIsPreparingPkce(false);
            return;
        }
        let unmounted = false;
        getOrPreparePwaHandoff()
            .then(p => {
                if (!unmounted) {
                    preparedRef.current = p;
                    setIsPreparingPkce(false);
                }
            })
            .catch(err => {
                console.error('[Auth] Chuẩn bị PKCE ban đầu thất bại:', err);
                if (!unmounted) {
                    setIsPreparingPkce(false);
                    setError('Không thể khởi tạo mã bảo mật xác thực (Web Crypto). Vui lòng thử lại.');
                }
            });
        return () => { unmounted = true; };
    }, [useHandoff]);

    // Khôi phục tức thì khi người dùng bấm nút "< Quay lại" trên Safari / trình duyệt di động (BFCache pageshow persisted):
    // Tránh giữ nguyên vòng xoay "Đang đăng nhập…" đã bị đóng băng từ trước lúc chuyển sang trang Google.
    useEffect(() => {
        if (isStandalone) return;
        let disposed = false;
        const onPageShow = async (e: PageTransitionEvent) => {
            if (!e.persisted || disposed) return;
            initiatedInCurrentPageRef.current = false;
            navigationStartedAtRef.current = 0;
            const verifierOnBack = readPendingHandoff();
            if (!verifierOnBack) {
                resetWaitingState();
                return;
            }
            try {
                const claimed = await Promise.race([
                    claimPwaHandoff(1),
                    new Promise<boolean>(resolve => setTimeout(() => resolve(false), 2500)),
                ]);
                if (claimed || disposed) return;
            } catch {
                if (disposed) return;
            }
            if (readPendingHandoff() === verifierOnBack) {
                clearPendingPwaHandoff(verifierOnBack);
                resetWaitingState();
            }
        };
        window.addEventListener('pageshow', onPageShow);
        return () => {
            disposed = true;
            window.removeEventListener('pageshow', onPageShow);
        };
    }, [isStandalone]);

    useEffect(() => {
        if (!waitingHandoff) return;
        let stopped = false;
        let busy = false;
        let emptyClaimCount = 0;
        let trackedVerifier: string | null = null;
        // Hỏi máy chủ dày (1,5 s) trong 30 giây đầu, sau đó thưa dần 4 s — mỗi lượt hỏi là 1 lần gọi hàm + 1 giao dịch Firestore,
        // người dùng để màn chờ mở 6 phút từng tốn ~240 lượt (2026-10-21). Quay lại app (focus/visibility) thì hỏi ngay.
        const batDau = Date.now();
        let lanCuoi = 0;
        const tick = async (ngay?: unknown) => {
            if (stopped || busy || document.visibilityState !== 'visible') return;
            if (ngay === 'dinh-ky' && Date.now() - batDau > 30_000 && Date.now() - lanCuoi < 4_000) return;
            lanCuoi = Date.now();
            if (!hasPendingPwaHandoff() && !isPwaHandoffClaiming()) {
                resetWaitingState();
                return;
            }
            busy = true;
            const currentHandoffVerifier = readPendingHandoff();
            if (currentHandoffVerifier !== trackedVerifier) {
                trackedVerifier = currentHandoffVerifier;
                emptyClaimCount = 0;
            }
            try {
                // Vào được thì onAuthStateChanged ở AuthContext tự chuyển màn hình.
                if (await claimPwaHandoff(1)) {
                    stopped = true;
                    return;
                }

                // Nếu phiên đã bị thay thế hoặc huỷ trong lúc gọi mạng thì nhường quyền cho phiên mới.
                if (stopped || (currentHandoffVerifier && readPendingHandoff() !== currentHandoffVerifier)) {
                    return;
                }

                // Trình duyệt thường (iOS Safari, Chrome… cùng tab — KHÔNG phải PWA Màn hình chính mở cửa sổ nổi riêng):
                // 1) Tải lại / mở lại trang khi còn sót ycxPwaHandoff cũ: pwa-login.html luôn await lưu phiên vào Firestore
                //    TRƯỚC KHI redirect về app, nên nếu 2 lượt hỏi liên tiếp đều nhận ready: false (~1,5s) nghĩa là người dùng
                //    chưa hoàn tất Google (bấm Quay lại / Tải lại / đóng tab) → tự dọn mã mồ côi và trả về nút đăng nhập ngay,
                //    không để treo ở "Đang đăng nhập…" suốt nhiều phút.
                if (!isStandalone && !initiatedInCurrentPageRef.current) {
                    emptyClaimCount += 1;
                    if (emptyClaimCount >= 2) {
                        stopped = true;
                        clearPendingPwaHandoff(currentHandoffVerifier ?? undefined);
                        resetWaitingState();
                        return;
                    }
                }

                // 2) Vừa bấm đăng nhập cùng tab nhưng sau 12s trình duyệt vẫn chưa rời trang (mạng nghẽn / bấm Dừng tải ✕):
                //    tự thoát trạng thái chờ để người dùng bấm thử lại được ngay.
                const hasDevRedirectHook = import.meta.env.DEV
                    && typeof (window as unknown as { __ycxTestRedirectHook?: unknown }).__ycxTestRedirectHook === 'function';
                if (
                    !isStandalone
                    && initiatedInCurrentPageRef.current
                    && !hasDevRedirectHook
                    && navigationStartedAtRef.current > 0
                    && Date.now() - navigationStartedAtRef.current >= 12_000
                ) {
                    stopped = true;
                    clearPendingPwaHandoff(currentHandoffVerifier ?? undefined);
                    resetWaitingState();
                    setError('Trang đăng nhập Google chưa tự mở hoặc kết nối bị gián đoạn. Vui lòng bấm "Tiếp tục với Google" để thử lại.');
                    return;
                }
            } catch (err: unknown) {
                // RACE CONDITION PROTECTION: Nếu trong lúc claim đang gọi máy chủ, người dùng đã mở phiên mới
                // (hoặc bấm Huỷ), lỗi của phiên cũ KHÔNG ĐƯỢC huỷ màn hình chờ hoặc xoá phiên mới!
                const activeVerifierNow = readPendingHandoff();
                if (stopped || (activeVerifierNow && currentHandoffVerifier && activeVerifierNow !== currentHandoffVerifier)) {
                    console.warn('[Auth] Bỏ qua lỗi của phiên cũ vì người dùng đã mở phiên mới hoặc huỷ:', err);
                    return;
                }
                console.error('[Auth] Nhận phiên đăng nhập từ trang Google lỗi:', err);
                takePwaHandoffError();
                clearPendingPwaHandoff(currentHandoffVerifier ?? undefined);
                resetWaitingState();
                const goc = err instanceof PwaHandoffSignInError ? err.cause : err;
                setError(`Chưa vào được ứng dụng (${getErrorCode(goc) || getErrorMessage(goc)}). Vui lòng bấm "Tiếp tục với Google" lại.`);
            } finally {
                busy = false;
            }
        };
        tick();
        const timer = setInterval(() => tick('dinh-ky'), 1500);
        document.addEventListener('visibilitychange', tick);
        window.addEventListener('focus', tick);
        return () => {
            stopped = true;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', tick);
            window.removeEventListener('focus', tick);
        };
    }, [waitingHandoff, isStandalone]);

    const handlePwaLogin = () => {
        // Guard đồng bộ tức thì: chặn hoàn toàn click liên tiếp trong cùng render cycle hoặc khi mã đang chuẩn bị
        if (isLoggingInRef.current || isPreparingPkce) return;
        isLoggingInRef.current = true;
        setIsLoggingIn(true);
        setError(null);

        const prepared = preparedRef.current;
        if (!prepared) {
            isLoggingInRef.current = false;
            setIsLoggingIn(false);
            setIsPreparingPkce(true);
            getOrPreparePwaHandoff()
                .then(p => {
                    preparedRef.current = p;
                    setIsPreparingPkce(false);
                })
                .catch(() => {
                    setIsPreparingPkce(false);
                });
            setError('Đang chuẩn bị kết nối đăng nhập, vui lòng bấm lại sau giây lát.');
            return;
        }

        // Tiêu thụ mã ngay để không bao giờ tái sử dụng mã cũ
        preparedRef.current = null;
        setIsPreparingReopen(true);
        getOrPreparePwaHandoff()
            .then(p => {
                preparedRef.current = p;
                setIsPreparingReopen(false);
            })
            .catch(err => {
                console.error('[Auth] Chuẩn bị mã kế tiếp thất bại:', err);
                setIsPreparingReopen(false);
            });

        // BẢO TOÀN USER ACTIVATION (iOS SAFARI): Tuyệt đối không chèn delay bất đồng bộ.
        // startPwaHandoffLogin() chạy trực tiếp trong cử chỉ chạm để window.open() không bị Safari chặn.
        try {
            startPwaHandoffLogin(prepared);
            initiatedInCurrentPageRef.current = true;
            navigationStartedAtRef.current = Date.now();
            setWaitingHandoff(true);
        } catch (err: unknown) {
            console.error('[Auth] Khởi tạo chuyển hướng đăng nhập thất bại:', err);
            initiatedInCurrentPageRef.current = false;
            navigationStartedAtRef.current = 0;
            isLoggingInRef.current = false;
            setIsLoggingIn(false);
            clearPendingPwaHandoff();
            setError(getErrorMessage(err) || 'Không thể mở trang đăng nhập Google. Vui lòng thử lại.');
        }
    };

    const handleReopenPwaLogin = () => {
        // Guard riêng cho thao tác chủ động mở lại: chặn double-click liên thanh mà KHÔNG bị chặn bởi isLoggingInRef
        if (isReopeningRef.current || isPreparingReopen) return;
        isReopeningRef.current = true;
        setIsReopening(true);
        setError(null);

        const prepared = preparedRef.current;
        if (!prepared) {
            isReopeningRef.current = false;
            setIsReopening(false);
            setIsPreparingReopen(true);
            getOrPreparePwaHandoff()
                .then(p => {
                    preparedRef.current = p;
                    setIsPreparingReopen(false);
                })
                .catch(() => {
                    setIsPreparingReopen(false);
                });
            setError('Mã đăng nhập mới đang được khởi tạo, vui lòng bấm lại sau giây lát.');
            return;
        }

        // Tiêu thụ mã ngay để không bao giờ tái sử dụng mã cũ
        preparedRef.current = null;
        setIsPreparingReopen(true);
        getOrPreparePwaHandoff()
            .then(p => {
                preparedRef.current = p;
                setIsPreparingReopen(false);
            })
            .catch(err => {
                console.error('[Auth] Chuẩn bị mã kế tiếp thất bại:', err);
                setIsPreparingReopen(false);
            });

        // Lưu lại phiên handoff hiện tại để khôi phục nếu lượt mở lại bị lỗi ngoại lệ (vd: Safari popup blocked)
        let previousPendingHandoff: string | null = null;
        try {
            previousPendingHandoff = localStorage.getItem('ycxPwaHandoff');
        } catch { /* bỏ qua */ }

        let success = false;
        try {
            startPwaHandoffLogin(prepared);
            initiatedInCurrentPageRef.current = true;
            navigationStartedAtRef.current = Date.now();
            success = true;
        } catch (err: unknown) {
            console.error('[Auth] Mở lại trang đăng nhập thất bại:', err);
            // Khôi phục lại phiên handoff trước đó nếu việc mở lại thất bại (bảo vệ phiên hợp lệ còn hiệu lực)
            if (previousPendingHandoff) {
                try {
                    localStorage.setItem('ycxPwaHandoff', previousPendingHandoff);
                } catch { /* bỏ qua */ }
            }
            setError(getErrorMessage(err) || 'Không thể mở lại trang đăng nhập Google. Vui lòng bấm thử lại.');
            isReopeningRef.current = false;
            setIsReopening(false);
        }

        if (success) {
            // Cooldown 1s chỉ áp dụng khi mở thành công để chống bấm liên thanh
            setTimeout(() => {
                isReopeningRef.current = false;
                setIsReopening(false);
            }, 1000);
        }
    };

    const handleCancelPwaLogin = () => {
        clearPendingPwaHandoff();
        setError(null);
        resetWaitingState();
    };

    const handleRetryFromError = () => {
        isLoggingInRef.current = false;
        isReopeningRef.current = false;
        setIsLoggingIn(false);
        setIsReopening(false);
        setError(null);
        if (waitingHandoff) {
            handleReopenPwaLogin();
        } else {
            handleLogin();
        }
    };

    const handleLogin = async () => {
        if (useHandoff) {
            handlePwaLogin();
            return;
        }
        if (isLoggingInRef.current) return;
        isLoggingInRef.current = true;
        try {
            setError(null);
            setIsLoggingIn(true);

            // Bảo hiểm 180s: Cho người dùng thoải mái thời gian chọn tài khoản, nhập mật khẩu và 2FA trên thiết bị mới
            const failsafeTimer = setTimeout(() => {
                isLoggingInRef.current = false;
                setIsLoggingIn(false);
                setError('Quá trình kết nối Google mất nhiều thời gian hơn dự kiến.\nNếu trang chưa tự chuyển, vui lòng thử lại hoặc mở bằng Safari/Chrome.');
            }, 180000);

            try {
                await loginWithGoogle();
            } finally {
                clearTimeout(failsafeTimer);
            }
        } catch (err: unknown) {
            console.error(err);
            const errCode = getErrorCode(err);

            // Người dùng chủ động đóng cửa sổ đăng nhập — reset trạng thái êm dịu, không hiển thị lỗi đỏ
            if (errCode === 'auth/popup-closed-by-user' || errCode === 'auth/cancelled-popup-request') {
                isLoggingInRef.current = false;
                setIsLoggingIn(false);
                return;
            }

            let errMsg = getErrorMessage(err) || 'Có lỗi xảy ra khi đăng nhập';

            if (errCode === 'auth/unauthorized-domain') {
                const currentDomain = window.location.hostname;
                errMsg = `Tên miền '${currentDomain}' chưa được cấp phép (unauthorized-domain). \n\nCách khắc phục: Anh/Chị vui lòng truy cập Firebase Console -> Authentication -> Settings -> Authorized Domains và thêm tên miền "${currentDomain}" vào danh sách.`;
            } else if (errCode === 'auth/popup-blocked' || errCode === 'auth/popup-timeout') {
                errMsg = 'Cửa sổ đăng nhập Google bị trình duyệt chặn hoặc không phản hồi. Vui lòng bấm vào "Đăng nhập chuyển hướng" bên dưới.';
            } else if (errCode === 'auth/operation-not-supported-in-this-environment') {
                errMsg = 'Môi trường này không hỗ trợ cửa sổ popup. Vui lòng nhấn nút Đăng nhập chuyển hướng bên dưới.';
            } else if (errCode === 'auth/internal-error') {
                errMsg = 'Lỗi kết nối xác thực Google (auth/internal-error).\nThường do trình duyệt chặn cookie bên thứ 3 hoặc tiện ích AdBlock/chặn pop-up can thiệp.\n\nAnh/Chị có thể chọn "Đăng nhập chuyển hướng" (không cần cookie) hoặc thử lại sau khi cho phép cookie của trang này!';
            } else if (errCode === 'auth/network-request-failed') {
                errMsg = 'Lỗi kết nối xác thực Google (auth/network-request-failed).\nNguyên nhân: Mạng Wifi/4G chập chờn, hoặc trình duyệt chặn cookie/popup xác thực của Google.\n\nCách xử lý nhanh nhất:\n1. Nhấn nút "Đăng nhập chuyển hướng (Không cần cookie)" ngay bên dưới để vào trực tiếp.\n2. Hoặc mở trang bằng trình duyệt Chrome / Safari chính thay vì trình duyệt tích hợp của Zalo/Facebook.';
            } else if (errCode === 'auth/invalid-api-key' || errCode === 'auth/api-key-not-valid') {
                errMsg = 'Mã cấu hình Firebase API Key không hợp lệ. Vui lòng kiểm tra lại services/firebase.ts.';
            }
            
            isLoggingInRef.current = false;
            setError(errMsg);
            setIsLoggingIn(false);
        }
    };

    const handleRedirectLogin = async () => {
        if (useHandoff) {
            handlePwaLogin();
            return;
        }
        if (isLoggingInRef.current) return;
        isLoggingInRef.current = true;
        try {
            setError(null);
            setIsLoggingIn(true);
            const prepared = await preparePwaHandoff();
            startPwaHandoffLogin(prepared);
            setWaitingHandoff(true);
        } catch (err: unknown) {
            console.error(err);
            isLoggingInRef.current = false;
            setError(getErrorMessage(err) || 'Không thể chuyển hướng đăng nhập');
            setIsLoggingIn(false);
        }
    };

    useEffect(() => {
        if (gamePhase !== 'playing') return;
        if (gameTime <= 0) { setGamePhase('done'); return; }
        const id = setTimeout(() => setGameTime(t => t - 1), 1000);
        return () => clearTimeout(id);
    }, [gamePhase, gameTime]);

    useEffect(() => {
        if (waitingHandoff || error) setShowLogin(true);
    }, [waitingHandoff, error]);

    const handleSecretTap = (e: React.MouseEvent) => {
        if (showLogin || showGame) return;
        if ((e.target as HTMLElement).closest('button, [role="button"]')) return;
        setTapCount(c => { const next = c + 1; if (next >= 7) setShowLogin(true); return next; });
    };

    const handleGameTap = () => { if (gamePhase === 'playing') setGameScore(s => s + 1); };

    const getGameMsg = (s: number) =>
        s < 10 ? 'Bạn ơi, thức chưa? 😴'
            : s < 20 ? 'Khá lắm bạn ơi! 👏'
            : s < 35 ? 'Nhanh ghê! ⚡'
            : s < 50 ? 'Tay nhanh hơn mắt! 🚀'
            : 'Thần tốc! Bạn là ai vậy? 🤯';

    if (isLoading) {
        return (
            <div data-man-cho-khoi-dong className="min-h-dvh bg-slate-50 dark:bg-slate-950 flex items-center justify-center bg-static-blobs">
                <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Màn chào vui (2026-11-18, chủ dự án): không hiện "Dashboard" hay thông tin app.
    // Chào hài hước + trò chơi bấm nhanh. Đăng nhập Google ẩn: bấm 7 lần trên trang chào.
    return (
        <div data-testid="login-view"
            className="min-h-dvh flex flex-col items-center justify-center px-6 select-none overflow-hidden relative bg-gradient-to-br from-sky-50/80 via-white to-amber-50/30"
            style={{
                paddingTop: 'max(24px, env(safe-area-inset-top))',
                paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            }}
            onClick={handleSecretTap}
        >
            <style>{`
                @keyframes ycx-float-a{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-30px) rotate(5deg)}}
                @keyframes ycx-float-b{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-18px) rotate(-4deg)}}
                @keyframes ycx-float-c{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-14px) scale(1.06)}}
                @keyframes ycx-wave{0%{transform:rotate(0)}10%{transform:rotate(14deg)}20%{transform:rotate(-8deg)}30%{transform:rotate(14deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(10deg)}60%,100%{transform:rotate(0)}}
                @keyframes ycx-fade-up{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
                @keyframes ycx-pop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
                @keyframes ycx-slide-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
            `}</style>

            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute w-32 h-32 rounded-full bg-sky-200/30" style={{ top: '8%', left: '5%', animation: 'ycx-float-a 6s ease-in-out infinite' }} />
                <div className="absolute w-24 h-24 rounded-full bg-slate-200/20" style={{ top: '18%', right: '8%', animation: 'ycx-float-b 8s ease-in-out infinite' }} />
                <div className="absolute w-16 h-16 rounded-full bg-amber-200/25" style={{ bottom: '22%', left: '12%', animation: 'ycx-float-c 7s ease-in-out infinite' }} />
                <div className="absolute w-20 h-20 rounded-full bg-emerald-200/20" style={{ bottom: '12%', right: '18%', animation: 'ycx-float-a 9s ease-in-out infinite' }} />
                <div className="absolute w-10 h-10 rounded-full bg-rose-200/20" style={{ top: '48%', left: '50%', animation: 'ycx-float-b 5s ease-in-out infinite' }} />
            </div>

            {showLogin ? (
                <div className="w-full max-w-[380px] flex-1 sm:flex-none flex flex-col justify-center sm:bg-white sm:border sm:border-slate-200/60 sm:rounded-overlay sm:shadow-2xl sm:shadow-slate-200/50 sm:p-10 relative z-10"
                    style={{ animation: 'ycx-slide-in 0.4s ease-out' }}>
                    {!waitingHandoff && (
                        <div className="flex flex-col items-center text-center mb-8" style={{ animation: 'ycx-fade-up 0.3s ease-out' }}>
                            <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-3">
                                <AppIcon name="login" size="lg" className="text-sky-500" />
                            </div>
                            <p className="type-body text-slate-500">Đăng nhập để tiếp tục</p>
                        </div>
                    )}

                    {isInAppWebView && (
                        <div className="mb-4 p-3 bg-amber-50 text-amber-900 rounded-popup type-footnote border border-amber-200 leading-relaxed">
                            <div className="flex items-center gap-1.5 font-bold mb-1"><AppIcon name="warning" size="sm" /> Mở bằng Safari hoặc Chrome</div>
                            Trình duyệt trong Zalo/Facebook chặn đăng nhập Google. Bấm <strong>(⋮)</strong> ở góc rồi chọn <strong>{"\"Mở bằng trình duyệt\""}</strong>.
                        </div>
                    )}

                    {error && (
                        <div role="alert" className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-popup type-footnote font-medium border border-rose-200 leading-relaxed">
                            <div className="flex items-start gap-2">
                                <AppIcon name="warning" size="sm" className="text-rose-500 shrink-0 mt-0.5" />
                                <div className="flex-1 whitespace-pre-line">{error}</div>
                            </div>
                            <div className="mt-2 flex justify-end">
                                <Button type="button" variant="link" size="none" onClick={handleRetryFromError}
                                    className="ycx-hit font-bold text-sky-700 hover:underline inline-flex items-center gap-1 cursor-pointer">
                                    <AppIcon name="refresh" size="sm" />
                                    {waitingHandoff ? 'Mở lại trang đăng nhập' : (useHandoff ? 'Thử đăng nhập lại' : 'Đăng nhập chuyển hướng')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {waitingHandoff ? (
                        <div data-testid="login-handoff-waiting" className="flex flex-col items-center text-center gap-6 py-4">
                            <div className="w-10 h-10 border-[3px] border-sky-500 border-t-transparent rounded-full animate-spin" />
                            <p className="type-body text-slate-500">Đang đăng nhập…</p>
                            <div className="flex items-center gap-4">
                                <Button data-testid="login-handoff-reopen" variant="link" size="none"
                                    isLoading={isReopening || isPreparingReopen}
                                    onClick={handleReopenPwaLogin}
                                    disabled={isReopening || isPreparingReopen || !preparedRef.current}
                                    className="ycx-hit type-subhead font-semibold text-sky-700 hover:underline cursor-pointer">
                                    {isPreparingReopen ? 'Đang chuẩn bị…' : 'Thử lại'}
                                </Button>
                                <span className="text-slate-300">|</span>
                                <Button variant="link" size="none" onClick={handleCancelPwaLogin}
                                    className="ycx-hit type-subhead text-slate-400 hover:text-slate-600 hover:underline cursor-pointer">
                                    Huỷ
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center w-full">
                            <Button data-testid="login-google" variant="secondary" size="none"
                                onClick={handleLogin}
                                disabled={isLoggingIn || isPreparingPkce}
                                className="ycx-hit w-full max-w-[300px] h-12 px-5 flex items-center justify-center gap-3 bg-white hover:bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 rounded-popup shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 disabled:opacity-60 cursor-pointer select-none">
                                {isLoggingIn ? (
                                    <div className="w-4.5 h-4.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin shrink-0" />
                                ) : (
                                    <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                )}
                                <span className={cn('min-w-0 flex flex-col items-start text-left justify-center', taiKhoanNho && 'flex-1')}>
                                    <span className="type-subhead font-semibold text-slate-800 leading-tight">Tiếp tục với Google</span>
                                    {taiKhoanNho && (
                                        <span data-testid="login-tai-khoan-nho" className="type-caption text-slate-500 truncate w-full leading-tight mt-0.5">{taiKhoanNho.email}</span>
                                    )}
                                </span>
                            </Button>
                            {taiKhoanNho && (
                                <Button type="button" variant="link" size="none"
                                    onClick={() => { quenTaiKhoan(); setTaiKhoanNho(null); }}
                                    disabled={isLoggingIn}
                                    className="ycx-hit self-center mt-3 type-subhead font-semibold text-sky-700 hover:underline cursor-pointer disabled:opacity-50">
                                    Dùng tài khoản khác
                                </Button>
                            )}
                        </div>
                    )}
                </div>

            ) : showGame ? (
                <div className="w-full max-w-[340px] flex flex-col items-center justify-center relative z-10" style={{ animation: 'ycx-pop 0.3s ease-out' }}>
                    {gamePhase === 'idle' && (
                        <div className="flex flex-col items-center text-center gap-6">
                            <span className="text-6xl">🎯</span>
                            <div>
                                <h2 className="type-large-title font-bold text-slate-800">Bấm nhanh!</h2>
                                <p className="type-body text-slate-500 mt-2">Bấm thật nhanh trong 5 giây.<br/>Xem bạn được bao nhiêu lần!</p>
                            </div>
                            <Button variant="primary" size="none" onClick={() => { setGameScore(0); setGameTime(5); setGamePhase('playing'); }}
                                className="ycx-hit h-12 px-8 type-subhead font-bold rounded-control">
                                Bắt đầu!
                            </Button>
                            <Button variant="link" size="none" onClick={() => setShowGame(false)}
                                className="ycx-hit type-subhead text-slate-400 hover:text-slate-600 cursor-pointer">
                                Quay lại
                            </Button>
                        </div>
                    )}
                    {gamePhase === 'playing' && (
                        <div className="flex flex-col items-center text-center gap-4 w-full">
                            <div className="flex items-center justify-between w-full max-w-[260px] mb-2">
                                <span className="flex items-center gap-1.5 type-subhead font-bold text-slate-600 tabular-nums">
                                    <AppIcon name="clock" size="sm" /> {gameTime}s
                                </span>
                                <span className="type-large-title font-black text-sky-600 tabular-nums">{gameScore}</span>
                            </div>
                            <Button variant="primary" size="none" onClick={handleGameTap}
                                className="ycx-hit w-40 h-40 sm:w-44 sm:h-44 rounded-full type-large-title font-black shadow-xl active:scale-90 transition-transform duration-75">
                                BẤM!
                            </Button>
                            <p className="type-caption text-slate-400 mt-2">Bấm càng nhanh càng tốt!</p>
                        </div>
                    )}
                    {gamePhase === 'done' && (
                        <div className="flex flex-col items-center text-center gap-3" style={{ animation: 'ycx-pop 0.4s ease-out' }}>
                            <span className="text-5xl">{gameScore >= 50 ? '🤯' : gameScore >= 35 ? '🚀' : gameScore >= 20 ? '⚡' : gameScore >= 10 ? '👏' : '😴'}</span>
                            <div className="type-large-title font-black text-sky-600 tabular-nums">{gameScore}</div>
                            <p className="type-body font-bold text-slate-700">{getGameMsg(gameScore)}</p>
                            <div className="flex items-center gap-3 mt-4">
                                <Button variant="primary" size="none" onClick={() => { setGameScore(0); setGameTime(5); setGamePhase('playing'); }}
                                    className="ycx-hit h-11 px-6 type-subhead font-bold rounded-control">
                                    Chơi lại
                                </Button>
                                <Button variant="secondary" size="none" onClick={() => setShowGame(false)}
                                    className="ycx-hit h-11 px-6 type-subhead font-semibold rounded-control">
                                    Quay lại
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

            ) : (
                <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[380px]">
                    <div style={{ animation: 'ycx-pop 0.5s ease-out' }}>
                        <span className="text-7xl inline-block" style={{ animation: 'ycx-wave 2s ease-in-out infinite', transformOrigin: '70% 70%' }}>👋</span>
                    </div>
                    <h1 className="type-large-title font-bold text-slate-800 mt-6" style={{ animation: 'ycx-fade-up 0.5s ease-out 0.2s both' }}>
                        Chào bạn!
                    </h1>
                    <p className="type-body text-slate-500 mt-3 leading-relaxed" style={{ animation: 'ycx-fade-up 0.5s ease-out 0.4s both' }}>
                        Đã ghé thăm mình rồi<br/>
                        Chúc bạn ngày mới đầy năng lượng ✨
                    </p>
                    <div className="mt-10" style={{ animation: 'ycx-fade-up 0.5s ease-out 0.6s both' }}>
                        <Button variant="primary" size="none" onClick={() => setShowGame(true)}
                            className="ycx-hit h-12 px-8 type-subhead font-bold shadow-md rounded-control active:scale-95 transition-transform">
                            Chơi một ván nào!
                        </Button>
                    </div>
                    {tapCount >= 5 && tapCount < 7 && (
                        <div className="flex gap-1.5 mt-6" style={{ animation: 'ycx-fade-up 0.2s ease-out' }}>
                            {Array.from({ length: tapCount - 4 }, (_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LoginView;
