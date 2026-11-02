// Màn khởi động động (index.html #ycx-splash, 2026-10-22). Tệp riêng thay vì <script> viết thẳng vì CSP chặn script inline.
// 1. App ở Màn hình chính iPhone (thanh trạng thái kiểu "default"): trang bắt đầu DƯỚI thanh trạng thái, còn ảnh khởi động tĩnh
//    của iOS phủ cả màn → đẩy cụm logo lên nửa chiều cao thanh trạng thái để khung đầu trùng khít ảnh (không nhảy khi chuyển).
// 2. Tắt khi app đã vẽ NỘI DUNG THẬT: #root có phần tử và không còn vòng quay chờ khởi động ([data-man-cho-khoi-dong]).
(function () {
    var el = document.getElementById('ycx-splash');
    if (!el) return;
    try {
        if (navigator.standalone) {
            var lech = (screen.height - window.innerHeight) / 2;
            if (lech > 0 && lech < 60) el.style.setProperty('--ycx-lech', -lech + 'px');
        }
    } catch (e) { /* bỏ qua */ }
    // 3. MỞ app / mở trang (điều hướng mới) giữ màn này tối thiểu ~1,3 s để logo và chữ chạy trọn 1 nhịp (2026-10-28 — app vào từ
    //    bộ nhớ đệm quá nhanh, chủ dự án chỉ thấy màn trắng rồi vào app). Tải lại (bấm tải lại / tự tải lại khi lỗi chunk) và quay
    //    lại trang: tắt ngay khi app sẵn sàng. Dựa vào KIỂU ĐIỀU HƯỚNG chứ không dựa sessionStorage (iOS có thể giữ qua các lần
    //    mở app). Trình duyệt tự động hoá (bài kiểm) bỏ thời gian tối thiểu trừ khi bật ycxSplashToiThieu.
    var TOI_THIEU = 1300;
    try {
        var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
        var kieu = nav ? nav.type : 'navigate';
        var tuDong = navigator.webdriver && !localStorage.getItem('ycxSplashToiThieu');
        if (tuDong || kieu === 'reload' || kieu === 'back_forward') TOI_THIEU = 0;
    } catch (e) { /* đọc không được: vẫn chào */ }
    var batDau = (window.performance && performance.now) ? performance.now() : 0;
    var root = document.getElementById('root');
    var xong = false;
    var cho = false;
    var obs = null;
    function tat() {
        if (xong || cho) return;
        var conLai = TOI_THIEU - ((window.performance && performance.now) ? performance.now() - batDau : TOI_THIEU);
        if (conLai > 0) { cho = true; setTimeout(function () { cho = false; tat(); }, conLai); return; }
        xong = true;
        if (obs) obs.disconnect();
        el.classList.add('ycx-splash-tat');
        setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
    }
    function kiem() {
        if (root && root.firstElementChild && !root.querySelector('[data-man-cho-khoi-dong]')) tat();
    }
    if (root && 'MutationObserver' in window) {
        var hen = 0;
        obs = new MutationObserver(function () { if (!hen) hen = requestAnimationFrame(function () { hen = 0; kiem(); }); });
        obs.observe(root, { childList: true, subtree: true });
    }
    window.addEventListener('load', kiem);
    setTimeout(tat, 12000); // an toàn: không bao giờ che app quá 12 giây
})();
