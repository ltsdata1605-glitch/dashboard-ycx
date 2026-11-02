/**
 * Chia sẻ danh sách nhân viên Phân Ca theo Mã Kho — biData/{maKho}/phanCa/staffList.
 *
 * Cùng pattern với biDataService.ts ở bi-dashboard: manager/admin import danh sách nhân viên
 * → tự upload lên Firestore dùng chung; tài khoản cùng Kho mở Phân Ca → kéo về nếu chưa có
 * dữ liệu local. Import services/firebase.ts gốc chỉ lấy instance db (ngoại lệ ESLint đã khai).
 */

import { db } from '../../../services/firebase';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { parseKhoList } from '../../../utils/dataUtils';
import type { StaffInitialData } from '../types';

interface SharedStaffDoc {
    nams: StaffInitialData[];
    nus: StaffInitialData[];
    supermarketName: string;
    uploadedByUid: string;
    uploadedByName: string;
    updatedAt: unknown;
}

const staffDocRef = (maKho: string) => doc(db, 'biData', maKho, 'phanCa', 'staffList');

export async function uploadStaffListIfManager(
    user: User,
    departmentId: string | null | undefined,
    userRole: string | null | undefined,
    nams: StaffInitialData[],
    nus: StaffInitialData[],
    supermarketName: string,
): Promise<void> {
    if (!user || !departmentId) return;
    if (userRole !== 'admin' && userRole !== 'manager') return;

    const allowedKhos = parseKhoList(departmentId);
    if (allowedKhos.length === 0) return;

    const batch = writeBatch(db);
    allowedKhos.forEach(maKho => {
        batch.set(staffDocRef(maKho), {
            nams,
            nus,
            supermarketName,
            uploadedByUid: user.uid,
            uploadedByName: user.displayName || user.email || user.uid,
            updatedAt: serverTimestamp(),
        } satisfies SharedStaffDoc);
    });
    await batch.commit();
}

export async function fetchSharedStaffList(
    departmentId: string | null | undefined,
): Promise<{ nams: StaffInitialData[]; nus: StaffInitialData[]; supermarketName: string } | null> {
    if (!departmentId) return null;

    const allowedKhos = parseKhoList(departmentId);
    if (allowedKhos.length === 0) return null;

    for (const maKho of allowedKhos) {
        const snap = await getDoc(staffDocRef(maKho));
        if (snap.exists()) {
            const data = snap.data() as SharedStaffDoc;
            return { nams: data.nams, nus: data.nus, supermarketName: data.supermarketName };
        }
    }
    return null;
}
