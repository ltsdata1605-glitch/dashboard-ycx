/** Harness cho check-thuong-phan-tich-mo-bxh.spec.ts — gắn CheckThuongSearchView THẬT với dữ liệu giả có mục "Cơ hội vàng"
 *  (không cần đăng nhập / tải file). */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CheckThuongSearchView } from '../../../features/check-thuong/components/CheckThuongSearchView';

const ST = ['910 - ĐML Hùng Vương', '911 - ĐML Lê Lợi', '912 - ĐML Trần Phú'];
const dong = (st: string, ng: string, pct: number, cutoff: number, hang: number, thuong: number) =>
    ['', 'V1', 'M1', 'DML', st, ng, pct, 0, cutoff, hang, hang, thuong, 0, thuong];

export function mount() {
    const data: (string | number)[][] = [];
    // Môn có quỹ (siêu thị khác có thưởng), 910 chưa có thưởng và kém mốc 16 hạng → "Cơ hội vàng"
    data.push(dong(ST[0], 'T11 - ĐÈN NĂNG LƯỢNG MẶT TRỜI', 0.6, 10, 26, 0));
    data.push(dong(ST[1], 'T11 - ĐÈN NĂNG LƯỢNG MẶT TRỜI', 1.4, 10, 1, 500_000));
    data.push(dong(ST[2], 'T11 - ĐÈN NĂNG LƯỢNG MẶT TRỜI', 1.2, 10, 2, 300_000));
    data.push(dong(ST[0], 'T11 - CAMERA', 0.7, 10, 17, 0));
    data.push(dong(ST[1], 'T11 - CAMERA', 1.3, 10, 1, 400_000));
    data.push(dong(ST[0], 'T11 - QUẠT GIÓ', 1.56, 10, 2, 200_000));
    data.push(dong(ST[1], 'T11 - QUẠT GIÓ', 1.1, 10, 5, 100_000));
    const el = document.createElement('div');
    document.body.innerHTML = '';
    document.body.appendChild(el);
    createRoot(el).render(<CheckThuongSearchView competitionData={data} code1="910" code2="" formattedUploadTime="08:58 14/11/2026" onFileLoaded={() => {}} />);
}
