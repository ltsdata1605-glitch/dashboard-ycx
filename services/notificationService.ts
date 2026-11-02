import { db } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'info' | 'error';
    read: boolean;
    createdAt: Timestamp;
}

// Bắn thông báo cá nhân

// Bắn thông báo về các Admin và Quản lý theo mã Kho

export const markAsRead = async (userId: string, notificationId: string) => {
    try {
        const ref = doc(db, 'users', userId, 'notifications', notificationId);
        await updateDoc(ref, { read: true });
    } catch (e) {
        // Đợt 5: trước đây nuốt lỗi hoàn toàn — thông báo "đã đọc" ghi hỏng (mất mạng/thiếu
        // quyền) sẽ hiện lại là chưa đọc ở lần mở sau mà không ai biết vì sao. Ít nhất phải log,
        // đồng nhất với các catch khác trong chính file này.
        console.error("Lỗi đánh dấu đã đọc thông báo:", e);
    }
}

export const markAllAsRead = async (userId: string) => {
    try {
        const q = query(collection(db, 'users', userId, 'notifications'), where('read', '==', false));
        const snap = await getDocs(q);
        
        const batchUpdates = snap.docs.map(d => 
            updateDoc(doc(db, 'users', userId, 'notifications', d.id), { read: true })
        );
        await Promise.all(batchUpdates);
    } catch (e) {
        console.error("Lỗi đánh dấu đã đọc TẤT CẢ thông báo:", e);
    }
}
