/**
 * Chế độ Dùng Thử (không đăng nhập) — CHỈ bật trên máy chủ phát triển/test (`import.meta.env.DEV`), để bộ test e2e của Claude vẫn
 * vào app bằng chế độ này. Bản build đưa cho người dùng (dashboard.pro.vn) luôn TẮT: không có nút, không đọc cờ đã lưu.
 * (2026-10-30, chủ dự án: tắt cho mọi người dùng, giữ cho việc kiểm thử.)
 */
export const demoModeChoPhep = (): boolean => import.meta.env.DEV === true;
