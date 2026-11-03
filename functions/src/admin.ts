import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { FieldValue, Timestamp, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { db, auth } from './firebaseAdmin';
import { notifyUser } from './notifications';
import { effectiveRootClaims, mergeCustomClaims } from './claims';
import { CLIENT_REGIONS } from './region';

const SUPER_ADMIN_EMAIL = 'lts.truongson@gmail.com';

type Role = 'admin' | 'manager' | 'employee' | 'pending' | 'blocked';
type Status = 'pending' | 'approved' | 'rejected' | 'new' | 'expired' | 'blocked';

interface NotifyPayload {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

interface AdminUpdateUserInput {
  targetUid: string;
  role?: Role;
  status?: Status;
  departmentId?: string;
  employeeName?: string;
  expiresAt?: string | null;
  notify?: NotifyPayload;
}

// Thay thế mọi updateDoc(userRef, ...) mà admin/manager ghi vào doc CỦA NGƯỜI
// KHÁC ở components/views/UserManagementView.tsx — cả nút Duyệt/Từ chối/Thu
// hồi (handleApproval) lẫn autosave từng ô (autoSave). firestore.rules chỉ
// cho phép isSelf(uid) ghi users/{uid}, nên admin/manager sửa hồ sơ người
// khác bắt buộc đi qua function này để được kiểm tra quyền ở server.
export const adminUpdateUser = onCall({ region: CLIENT_REGIONS }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Cần đăng nhập.');
  }
  const callerRole = request.auth.token.role;
  if (callerRole !== 'admin' && callerRole !== 'manager') {
    throw new HttpsError('permission-denied', 'Chỉ admin/manager được sửa hồ sơ người dùng khác.');
  }

  const { targetUid, role, status, departmentId, employeeName, expiresAt, notify } =
    (request.data ?? {}) as AdminUpdateUserInput;
  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'Thiếu targetUid.');
  }

  const targetRef = db.collection('users').doc(targetUid);
  const snap = await targetRef.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', 'Không tìm thấy user cần cập nhật.');
  }

  // Chỉ admin (không phải manager) mới được cấp quyền admin/manager cho người khác —
  // khớp với UI hiện tại: dropdown role đầy đủ (gồm admin/manager) chỉ hiện với
  // userRole === 'admin', manager chỉ thấy badge readonly.
  if ((role === 'admin' || role === 'manager') && callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Chỉ admin được cấp quyền admin/manager.');
  }

  // Manager chỉ được sửa hồ sơ user thuộc đúng (các) Kho của mình. Trước đây việc
  // này chỉ được lọc ở client (UserManagementView.tsx — allowedKhos), Cloud Function
  // không kiểm tra gì nên 1 manager gọi thẳng hàm này (bỏ qua UI) vẫn sửa được
  // status/departmentId/employeeName/expiresAt của user ở Kho khác. departmentId
  // của manager có thể là danh sách nhiều Kho nối bằng dấu phẩy (vd "58614,12345"),
  // khớp đúng cách UI đang tách chuỗi (dòng ~211 UserManagementView.tsx).
  if (callerRole === 'manager') {
    const callerDeptRaw = (request.auth.token.departmentId as string) ?? '';
    const allowedKhos = callerDeptRaw.split(',').map((s) => s.trim()).filter(Boolean);
    const targetDept = (snap.get('departmentId') as string) ?? '';
    if (!allowedKhos.length || !allowedKhos.includes(targetDept)) {
      throw new HttpsError('permission-denied', 'Bạn chỉ được quản lý người dùng thuộc Kho của mình.');
    }
    // Audit 2026-10-30 (AUD-036): manager chỉ quản lý NHÂN VIÊN / người chờ duyệt — đúng như danh sách UI cho manager
    // (listManagedUsers: role employee hoặc status pending). Trước đây manager cùng Kho gọi thẳng hàm này hạ quyền /
    // khoá / thu hồi được cả admin hoặc manager khác của Kho đó.
    const targetRole = snap.get('role') as string | undefined;
    if (targetRole === 'admin' || targetRole === 'manager') {
      throw new HttpsError('permission-denied', 'Quản lý không được sửa tài khoản Admin/Quản lý khác.');
    }
    // Không cho manager tự đổi Kho của user (đúng với UI — ô Kho chỉ editable với admin).
    if (departmentId !== undefined && departmentId !== targetDept) {
      throw new HttpsError('permission-denied', 'Manager không được đổi Kho của người dùng.');
    }
  }

  const updates: Record<string, unknown> = {};
  if (role !== undefined) updates.role = role;
  if (status !== undefined) updates.status = status;
  if (departmentId !== undefined) updates.departmentId = departmentId;
  if (employeeName !== undefined) updates.employeeName = employeeName;
  if (expiresAt !== undefined) {
    updates.expiresAt = expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : FieldValue.delete();
  }

  if (Object.keys(updates).length > 0) {
    await targetRef.update(updates);
  }

  const finalRole = (role ?? (snap.get('role') as Role) ?? 'pending');
  const finalStatus = (status ?? (snap.get('status') as Status) ?? null);
  const finalDepartmentId = (departmentId ?? (snap.get('departmentId') as string) ?? null);
  // Audit S04: trước đây đặt status 'expired' (nút Thu hồi) nhưng claim vẫn giữ role manager + Kho.
  await mergeCustomClaims(targetUid, effectiveRootClaims(finalRole, finalStatus, finalDepartmentId));

  if (notify) {
    await notifyUser(targetUid, notify);
  }

  return { success: true };
});

interface ListManagedUsersInput {
  mode: 'pending' | 'active' | 'expired';
}

const TIMESTAMP_FIELDS = ['createdAt', 'requestDate', 'expiresAt', 'lastLogin'] as const;

// Callable trả JSON qua RPC — Timestamp Firestore không "sống sót" qua ranh giới này (client
// sẽ nhận object thường không có .toDate()/.toMillis()), nên serialize sẵn về chuỗi ISO ở đây.
function serializeUserDoc(doc: QueryDocumentSnapshot): Record<string, unknown> {
  const data = doc.data();
  const out: Record<string, unknown> = { id: doc.id, ...data };
  for (const field of TIMESTAMP_FIELDS) {
    const value = data[field];
    if (value instanceof Timestamp) {
      out[field] = value.toDate().toISOString();
    }
  }
  return out;
}

// Thay thế query Firestore trực tiếp ở UserManagementView.tsx / usePendingApprovalCount.ts /
// NotificationDropdown.tsx — cả 3 nơi này trước đây đọc thẳng collection('users') qua
// firestore.rules isManager() (cho get/list KHÔNG giới hạn Kho), rồi mới tự lọc theo
// allowedKhos ở client. Lọc client không phải là bảo mật thật — 1 manager gọi thẳng
// đúng query đó (bỏ qua UI, vd DevTools) vẫn đọc được hồ sơ user (tên/email/ngày yêu
// cầu...) ở Kho khác. Hàm này chạy bằng Admin SDK (bypass rules), lọc theo Kho ở SERVER
// cho manager — không thể bị bỏ qua như cách cũ. Giữ nguyên đúng 2 cặp query cũ (mode
// pending/active x admin/manager, xem UserManagementView.tsx dòng ~164-174 bản cũ) để
// không đổi hành vi hiển thị cho luồng hợp lệ.
export const listManagedUsers = onCall({ region: CLIENT_REGIONS }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Cần đăng nhập.');
  }
  const callerRole = request.auth.token.role;
  if (callerRole !== 'admin' && callerRole !== 'manager') {
    throw new HttpsError('permission-denied', 'Chỉ admin/manager được xem danh sách người dùng.');
  }

  const { mode } = (request.data ?? {}) as ListManagedUsersInput;

  let query;
  if (callerRole === 'manager') {
    if (mode === 'active' || mode === 'expired') {
      query = db.collection('users').where('role', '==', 'employee');
    } else {
      query = db.collection('users').where('status', '==', 'pending');
    }
  } else {
    if (mode === 'active') {
      query = db.collection('users').where('status', '==', 'approved');
    } else if (mode === 'expired') {
      query = db.collection('users').where('status', 'in', ['expired', 'approved']);
    } else {
      query = db.collection('users').where('status', 'in', ['pending', 'new']);
    }
  }
  const snap = await query.get();

  let docs = snap.docs;
  if (callerRole === 'manager') {
    const callerDeptRaw = (request.auth.token.departmentId as string) ?? '';
    const allowedKhos = callerDeptRaw.split(',').map((s) => s.trim()).filter(Boolean);
    docs = docs.filter((d) => allowedKhos.includes((d.get('departmentId') as string) ?? ''));
  }

  return { users: docs.map(serializeUserDoc) };
});

interface DeleteExpiredUsersInput {
  uids?: unknown;
}

/** Trần số tài khoản mỗi lượt xoá — chọn tay từ danh sách, không cần nhiều hơn. */
const XOA_HAN_TOI_DA = 50;

/**
 * Xoá HẲN hồ sơ của tài khoản ĐÃ HẾT HẠN (2026-10-30, chủ dự án): xoá users/{uid} và mọi dữ liệu con (cài đặt, lịch, dữ liệu bán
 * hàng, thông báo), rồi đưa claims về 'pending' để token cũ không còn quyền Kho. Không xoá tài khoản đăng nhập Google: lần đăng nhập
 * sau hồ sơ được tạo mới như người dùng mới (phải xin truy cập lại).
 * Quyền: admin (Quản trị hệ thống) xoá mọi tài khoản hết hạn, kể cả Admin/Quản lý (trừ chủ hệ thống); manager chỉ xoá nhân viên hết hạn trong Kho của mình.
 * Mỗi lượt gọi tối đa XOA_HAN_TOI_DA tài khoản; giao diện chia danh sách dài thành nhiều lượt.
 */
export const deleteExpiredUsers = onCall({ region: CLIENT_REGIONS, timeoutSeconds: 300 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Cần đăng nhập.');
  }
  const callerRole = request.auth.token.role;
  if (callerRole !== 'admin' && callerRole !== 'manager') {
    throw new HttpsError('permission-denied', 'Chỉ admin/manager được xoá hồ sơ người dùng.');
  }
  const { uids } = (request.data ?? {}) as DeleteExpiredUsersInput;
  if (!Array.isArray(uids) || uids.length === 0) {
    throw new HttpsError('invalid-argument', 'Chưa chọn tài khoản nào để xoá.');
  }
  const danhSach = [...new Set(uids.filter((u): u is string => typeof u === 'string' && u.length > 0))];
  if (danhSach.length === 0 || danhSach.length > XOA_HAN_TOI_DA) {
    throw new HttpsError('invalid-argument', `Mỗi lượt chỉ xoá tối đa ${XOA_HAN_TOI_DA} tài khoản.`);
  }

  const khoCuaQuanLy = callerRole === 'manager'
    ? ((request.auth.token.departmentId as string) ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    : null;

  const canXoa: string[] = [];
  const boQua: { uid: string; lyDo: string }[] = [];
  for (const uid of danhSach) {
    if (uid === request.auth.uid) {
      boQua.push({ uid, lyDo: 'Không thể xoá chính mình' });
      continue;
    }
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) {
      boQua.push({ uid, lyDo: 'Không còn hồ sơ' });
      continue;
    }
    const role = snap.get('role') as string | undefined;
    const status = snap.get('status') as string | undefined;
    const email = snap.get('email') as string | undefined;
    const xoaDuoc: (string | undefined)[] = ['expired', 'pending', 'new', 'rejected'];
    if (!xoaDuoc.includes(status)) {
      boQua.push({ uid, lyDo: 'Chỉ xoá tài khoản đã hết hạn, chờ duyệt hoặc bị từ chối' });
      continue;
    }
    if (email === SUPER_ADMIN_EMAIL) {
      boQua.push({ uid, lyDo: 'Không xoá tài khoản chủ hệ thống' });
      continue;
    }
    // Quản trị hệ thống (admin) toàn quyền xoá mọi tài khoản hết hạn kể cả Admin/Quản lý; quản lý chỉ xoá nhân viên trong Kho mình.
    if ((role === 'admin' || role === 'manager') && callerRole !== 'admin') {
      boQua.push({ uid, lyDo: 'Chỉ Quản trị hệ thống được xoá Admin/Quản lý' });
      continue;
    }
    if (khoCuaQuanLy && !khoCuaQuanLy.includes((snap.get('departmentId') as string) ?? '')) {
      boQua.push({ uid, lyDo: 'Ngoài Kho của bạn' });
      continue;
    }
    canXoa.push(uid);
  }

  for (const uid of canXoa) {
    await db.recursiveDelete(db.collection('users').doc(uid));
    try {
      await mergeCustomClaims(uid, { role: 'pending', departmentId: null });
    } catch (err) {
      // Tài khoản Google đã mất trên Auth: hồ sơ đã xoá là đủ, không có token nào để thu quyền.
      console.warn('[deleteExpiredUsers] không đặt được claims cho', uid, err);
    }
  }
  console.info('[deleteExpiredUsers]', JSON.stringify({ xoa: canXoa.length, boQua: boQua.length, boi: request.auth.uid }));
  return { xoa: canXoa, boQua };
});
