# ADR C42 — Thời lượng toast theo thời gian hiển thị

Trạng thái: áp dụng trong audit local; toàn dự án vẫn PARTIAL.

Vấn đề đã tái hiện: AppToaster chỉ render3toast nhưng useToaster của react-hot-toast đặt timer cho mọi toast trong store. Toast900ms bị hết hạn khi còn chờ. Contract hiện hữu nói toast chờ không bị mất.

Các phương án:
- Tăng duration: không sửa nguyên nhân, vẫn mất nếu3actiontoast tồn tại lâu.
- Bỏ giới hạn3: phá layout/khả năng đọc trên mobile.
- Sửa node_modules hoặc dùng private dispatch/mutate store: phụ thuộc internalAPI, không bền.
- Giữ public useToasterStore/API và quản lý timer/height theo slot hiển thị tại shared hook: được chọn. Không tạo hệ toast hoặc design system mới.

useVisibleToasts giữ metadata/store và caller APIs cũ. Thời lượng chỉ giảm khi toast trong3slot và không paused. Update cùng id/createdAt/message/type/duration tạo budget mới; toast bị preempt giữ budget cũ. Dismiss giữ removeDelay và cancel removal khi id được tái sử dụng. Resize heights lưu local để không reset createdAt qua API update. Offset chỉ tính toast đang hiện. Mọi timer được clear khi dependency đổi/unmount.

Trade-off: dự án chịu trách nhiệm lifecycle timer/height thay vì dùng useToaster built-in. Giới hạn store20 và newest-first của library vẫn giữ; không hứa queue vô hạn. Regression bắt buộc queued duration,preemption,hover pause/resume,loading replacement,resurrection,gesture cancellation vàaction semantics. Native device,screenreader/customtoast/multi-Toaster contract/performance vẫn cần review; không suy rộng fixture thành production acceptance.

Nguồn implementation thư viện đọc có mục tiêu: node_modules/react-hot-toast/src/core/use-toaster.ts,core/toast.ts,headless/index.ts và types. Không đưa dependency tree vào review coverage.
