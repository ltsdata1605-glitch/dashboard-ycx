# Phase 2 — phạm vi kiểm thử an toàn

Đã đọc scripts package root/functions, Vitest, ESLint, Vite build plugins, budget và toàn bộ lint-ratchet.cjs. Không gọi npm run check vì ratchet mặc định có thể ghi baseline; dùng lint:ratchet:ci --check-only. npm audit wrapper có || true nên chưa dùng.

Typecheck, ESLint, ratchet: chỉ đọc source (cache nếu công cụ tự tạo phải được phân loại generated). Build frontend ghi dist, plugin offline sinh dist/sw.js; build Functions chỉ tsc -> functions/lib, không deploy. Unit Vitest chạy trong sandbox hạn chế mạng; đã quét các test theo glob thật cho child_process/write operations: execSync duy nhất gọi git ls-files trong no-hardcoded-api-keys.test.ts; writeFile trong coupon-template là mock. Các bộ Firebase dùng vi.mock, không đặt credential production. Đây là kiểm side-effect sơ bộ, không phải deep review toàn bộ test.

E2E: không chạy full suite tự động trước phân loại từng spec. Một số spec dùng .e2e-chrome-profile hoặc custom token thật; chưa được chạy. Bài smoke và modal đã đọc ở Phase 0. Apple compatibility dùng demo + Excel fixture cục bộ, nhưng app có thể gọi dịch vụ ngoài; nếu chạy sẽ chặn mạng ngoài localhost trong harness cấu hình audit. Không nới assertion hay sửa baseline. Performance phải dùng build và mô tả rõ giới hạn network/mock.

Firestore rules test cần emulator và review script riêng; chưa chạy. Không gọi firebase deploy, script migration, backup có push hoặc gửi LINE.
