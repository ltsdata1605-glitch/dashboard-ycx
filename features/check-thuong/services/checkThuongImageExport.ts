import { CheckThuongStoreSummary, CheckThuongGroupSummary } from '../types';
import { formatBonusMoney } from './checkThuongCalc';
import { deliverImage, type DeliveryResult } from '../../../components/shared/ui/imageDelivery';
import { exportElementAsImage, startExportJob, exportFooterText } from '../../../components/shared/export';

export interface ExportImageOptions {
    stores: CheckThuongStoreSummary[];
    limit?: number;
    channel?: string;
    customTitle?: string;
    fileName?: string;
    fontName?: string;
}

export interface ExportGroupImageOptions {
    groups: CheckThuongGroupSummary[];
    limit?: number;
    channel?: string;
    customTitle?: string;
    fileName?: string;
    fontName?: string;
}

/**
 * Tên siêu thị / mã kho / tiêu đề / tên file lấy từ file Excel người dùng tải lên rồi chèn vào
 * `innerHTML` của ảnh xuất — phải escape (audit A09, 2026-09-29): tên có `<`, `&` sẽ vỡ bố cục
 * hoặc bị trình duyệt hiểu thành thẻ HTML. Chữ bình thường không đổi → ảnh giữ nguyên như trước.
 */
export const escapeHtml = (value: unknown): string =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

export async function exportLeaderboardToImage({
    stores,
    limit,
    channel = 'ALL',
    customTitle,
    fileName,
    fontName = 'UTM Avo'
}: ExportImageOptions): Promise<DeliveryResult> {
    const listToExport = limit ? stores.slice(0, limit) : stores;
    if (listToExport.length === 0) {
        throw new Error('Không có dữ liệu siêu thị để xuất ảnh!');
    }

    // Chiều rộng tối ưu vừa vặn cho màn hình điện thoại (khoảng 450px)
    const TARGET_WIDTH = 450;

    // 1. Wrapper container ẩn ngoài màn hình
    const wrapper = document.createElement('div');
    wrapper.id = 'check-thuong-export-wrapper';
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.zIndex = '-99999';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.overflow = 'hidden';
    wrapper.style.width = `${TARGET_WIDTH}px`;

    // 2. Phần tử nội dung capture chuẩn kích thước điện thoại
    const captureTarget = document.createElement('div');
    captureTarget.id = 'check-thuong-capture-target';
    captureTarget.style.width = `${TARGET_WIDTH}px`;
    captureTarget.style.backgroundColor = '#ffffff';
    captureTarget.style.color = '#0f172a';
    captureTarget.style.fontFamily = `'${fontName}', 'UTM Avo', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    captureTarget.style.padding = '12px 14px';
    captureTarget.style.boxSizing = 'border-box';
    captureTarget.style.display = 'block';
    captureTarget.style.border = '1.5px solid #cbd5e1';
    captureTarget.style.borderRadius = '12px';
    captureTarget.style.overflow = 'hidden';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const dateFileStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    const totalBonusAll = listToExport.reduce((sum, s) => sum + s.totalBonus, 0);
    const totalBonusMil = Math.round(totalBonusAll / 1000000);

    const channelText = channel === 'ALL' ? 'Tất Cả Kênh' : `Kênh: ${channel}`;
    const displayTitle = customTitle || (channel !== 'ALL' ? `TOP ${listToExport.length} THƯỞNG CAO • KÊNH ${channel}` : `TOP ${listToExport.length} SIÊU THỊ THƯỞNG CAO`);

    let rowsHtml = '';
    listToExport.forEach((store, index) => {
        const rank = index + 1;
        const rankColor = rank === 1 ? '#d97706' : rank === 2 ? '#475569' : rank === 3 ? '#b45309' : '#64748b';
        const rankWeight = rank <= 3 ? '800' : '700';
        const bonusMil = Math.round(store.totalBonus / 1000000);
        const bgRow = index % 2 === 1 ? '#f8fafc' : '#ffffff';
        const pctColor = store.achievedPercent >= 70 ? '#059669' : store.achievedPercent >= 50 ? '#0284c7' : '#d97706';

        rowsHtml += `
            <tr style="background-color: ${bgRow}; border-bottom: 1px solid #f1f5f9; font-size: 10.5px; line-height: 1.2;">
                <td style="padding: 4px 2px; text-align: center; font-weight: ${rankWeight}; color: ${rankColor}; width: 32px;">#${rank}</td>
                <td style="padding: 4px 2px; text-align: center; font-weight: 800; color: #0284c7; width: 42px;">${escapeHtml(store.storeCode)}</td>
                <td style="padding: 4px 6px; font-weight: 600; color: #1e293b; width: 178px; max-width: 178px; white-space: normal; overflow-wrap: anywhere; word-break: break-word;">${escapeHtml(store.storeName)}</td>
                <td style="padding: 4px 3px; text-align: center; font-weight: 700; color: #059669; width: 48px; white-space: nowrap;">${store.achievedCount} <span style="color: #94a3b8; font-size: 9px; font-weight: 500;">/ ${store.totalCategories}</span></td>
                <td style="padding: 4px 3px; text-align: center; width: 66px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 3px;">
                        <span style="font-weight: 800; font-size: 10px; color: ${pctColor};">${store.achievedPercent}%</span>
                        <div style="width: 22px; height: 4px; background: #e2e8f0; border-radius: 999px; overflow: hidden; display: inline-block;">
                            <div style="width: ${Math.min(100, store.achievedPercent)}%; height: 100%; background: ${pctColor}; border-radius: 999px;"></div>
                        </div>
                    </div>
                </td>
                <td style="padding: 4px 4px; text-align: right; font-weight: 900; color: #059669; font-size: 11px; width: 48px; white-space: nowrap;">${bonusMil.toLocaleString('vi-VN')} Tr</td>
            </tr>
        `;
    });

    captureTarget.innerHTML = `
        <div style="margin-bottom: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; font-family: inherit;">
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 16px;">🏆</span>
                    <h1 style="margin: 0; font-size: 13px; font-weight: 900; color: #0f172a; letter-spacing: -0.01em; text-transform: uppercase; font-family: inherit;">
                        ${escapeHtml(displayTitle)}
                    </h1>
                </div>
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 2.5px 7px; white-space: nowrap;">
                    <span style="font-size: 9px; font-weight: 700; color: #059669; text-transform: uppercase;">Tổng: </span>
                    <span style="font-size: 11.5px; font-weight: 900; color: #047857; font-family: inherit;">${formatBonusMoney(totalBonusAll).full}</span>
                </div>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px; font-size: 9px; color: #64748b; font-family: inherit;">
                <span style="truncate; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(channelText)}${fileName ? ` • ${escapeHtml(fileName)}` : ''}</span>
                <span style="color: #94a3b8; shrink-0;">${timeStr}</span>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed; font-family: inherit;">
            <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #cbd5e1; font-size: 10px; text-transform: uppercase; color: #475569; letter-spacing: 0.03em; font-weight: 800; line-height: 1.2;">
                    <th style="padding: 5px 2px; text-align: center; width: 32px;">Hạng</th>
                    <th style="padding: 5px 2px; text-align: center; width: 42px;">Kho</th>
                    <th style="padding: 5px 6px; width: 178px; text-align: center;">Tên Siêu Thị</th>
                    <th style="padding: 5px 3px; text-align: center; width: 48px;">Đạt 100%</th>
                    <th style="padding: 5px 3px; text-align: center; width: 66px;">%Đạt</th>
                    <th style="padding: 5px 4px; text-align: center; width: 48px;">Thưởng</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

    `;

    wrapper.appendChild(captureTarget);
    document.body.appendChild(wrapper);

    // Kế hoạch "Hợp nhất xuất ảnh" (2026-10-01): chụp qua bộ xuất ảnh CHUNG, bộ quy tắc 'raw' (giữ nguyên mẫu
    // bảng xếp hạng đã thiết kế) → cùng bảng chờ, chân ảnh, độ nét có trần canvas iOS (audit A08) như mọi nơi.
    // Dòng chân cũ 9px "Check Thưởng • … / Hiển thị Top N" thay bằng chân ảnh chung (vẫn ghi Top N).
    const job = startExportJob({ title: `Xuất ảnh Top ${listToExport.length}${channel && channel !== 'ALL' ? ` kênh ${channel}` : ''}` });
    let ok = false;
    try {
        const blob = await exportElementAsImage(captureTarget, 'check-thuong.png', {
            preset: 'raw', mode: 'blob-only',
            footer: `Top ${listToExport.length} dẫn đầu · ${exportFooterText()}`,
        });
        if (!blob || blob.size < 500) {
            throw new Error('Không thể tạo dữ liệu ảnh (kết quả rỗng)');
        }

        const channelSlug = (channel && channel !== 'ALL') ? `Kenh_${channel.replace(/[^a-zA-Z0-9]/g, '_')}_` : '';
        // Trước đây luôn tải file (a.click) — trên iPhone không mở được Lưu ảnh/LINE/Zalo. Nay giao
        // ảnh qua khâu chung: máy tính tải về, điện thoại mở bảng chia sẻ.
        job.stage('Đang lưu ảnh…');
        const ketQua = await deliverImage(blob, `Top_${listToExport.length}_${channelSlug}Thuong_Cao_${dateFileStr}.png`);
        ok = true;
        return ketQua;
    } finally {
        job.result(`Top ${listToExport.length}`, ok ? 'ok' : 'failed');
        job.finish();
        if (wrapper.parentNode) {
            wrapper.parentNode.removeChild(wrapper);
        }
    }
}

export async function exportGroupLeaderboardToImage({
    groups,
    limit,
    channel = 'ALL',
    customTitle,
    fileName,
    fontName = 'UTM Avo'
}: ExportGroupImageOptions): Promise<DeliveryResult> {
    const listToExport = limit ? groups.slice(0, limit) : groups;
    if (listToExport.length === 0) {
        throw new Error('Không có dữ liệu nhóm thi đua để xuất ảnh!');
    }

    const TARGET_WIDTH = 500;

    const wrapper = document.createElement('div');
    wrapper.id = 'check-thuong-group-export-wrapper';
    wrapper.style.position = 'fixed';
    wrapper.style.top = '0';
    wrapper.style.left = '0';
    wrapper.style.zIndex = '-99999';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.overflow = 'hidden';
    wrapper.style.width = `${TARGET_WIDTH}px`;

    const captureTarget = document.createElement('div');
    captureTarget.id = 'check-thuong-group-capture-target';
    captureTarget.style.width = `${TARGET_WIDTH}px`;
    captureTarget.style.backgroundColor = '#ffffff';
    captureTarget.style.color = '#0f172a';
    captureTarget.style.fontFamily = `'${fontName}', 'UTM Avo', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    captureTarget.style.padding = '12px 14px';
    captureTarget.style.boxSizing = 'border-box';
    captureTarget.style.display = 'block';
    captureTarget.style.border = '1.5px solid #cbd5e1';
    captureTarget.style.borderRadius = '12px';
    captureTarget.style.overflow = 'hidden';

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const dateFileStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    const totalBonusAll = listToExport.reduce((sum, g) => sum + g.totalBonus, 0);
    const totalBonusMil = Math.round(totalBonusAll / 1000000);

    const channelText = channel === 'ALL' ? 'Tất Cả Kênh' : `Kênh: ${channel}`;
    const displayTitle = customTitle || (channel !== 'ALL' ? `TOP THƯỞNG NHÓM THI ĐUA • KÊNH ${channel}` : `TOP THƯỞNG CÁC NHÓM THI ĐUA`);

    let rowsHtml = '';
    listToExport.forEach((group, index) => {
        const bonusFmt = formatBonusMoney(group.totalBonus).full;
        const rankColor = index === 0 ? '#d97706' : index === 1 ? '#475569' : index === 2 ? '#b45309' : '#64748b';
        const rankBg = index === 0 ? '#fef3c7' : index === 1 ? '#f1f5f9' : index === 2 ? '#ffedd5' : 'transparent';
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';

        rowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0; font-size: 10.5px; background-color: ${bgColor}; line-height: 1.35;">
                <td style="padding: 6px 2px; text-align: center; font-weight: 800; color: ${rankColor}; background-color: ${rankBg}; border-radius: 4px; width: 34px;">
                    #${group.rank}
                </td>
                <td style="padding: 6px 6px; font-weight: 700; color: #0f172a; text-align: left; width: 150px;">
                    <div style="font-size: 11px;">${escapeHtml(group.groupName)}</div>
                    ${channel === 'ALL' ? `<span style="font-size: 8.5px; padding: 1px 4px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 600;">${escapeHtml(group.channel)}</span>` : ''}
                </td>
                <td style="padding: 6px 4px; text-align: right; font-weight: 800; color: #0284c7; width: 68px;">
                    ${bonusFmt}
                </td>
                <td style="padding: 6px 3px; text-align: center; color: #475569; font-size: 9.5px; width: 70px;">
                    ${group.storesWithBonusCount}/${group.storeCount} kho<br>
                    <span style="color: #059669; font-weight: 700;">${group.storesWithBonusPercent}%</span>
                </td>
                <td style="padding: 6px 3px; text-align: center; color: #475569; font-size: 9.5px; width: 60px;">
                    ${group.achieved100Count} kho<br>
                    <span style="color: #64748b;">(${group.achieved100Percent}%)</span>
                </td>
                <td style="padding: 6px 4px; text-align: left; font-size: 9px; color: #334155; width: 118px;">
                    ${group.topStore ? `
                        <div style="font-weight: 700; color: #b45309; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 115px;" title="${escapeHtml(group.topStore.rawStore)}">
                            ${escapeHtml(group.topStore.storeCode)} - ${escapeHtml(group.topStore.storeName)}
                        </div>
                        <div style="color: #0284c7; font-weight: 700; font-size: 9px;">${formatBonusMoney(group.topStore.bonus).full}</div>
                    ` : '<span style="color: #94a3b8;">-</span>'}
                </td>
            </tr>
        `;
    });

    captureTarget.innerHTML = `
        <div style="margin-bottom: 10px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <h3 style="margin: 0; font-size: 13px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.01em; font-family: inherit;">
                    ${escapeHtml(displayTitle)}
                </h3>
                <span style="font-size: 11px; font-weight: 800; color: #0284c7; font-family: inherit;">
                    ${totalBonusMil.toLocaleString('vi-VN')} Tr
                </span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px; font-size: 9px; color: #64748b; font-family: inherit;">
                <span style="max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(channelText)}${fileName ? ` • ${escapeHtml(fileName)}` : ''} • ${listToExport.length} nhóm</span>
                <span style="color: #94a3b8;">${timeStr}</span>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed; font-family: inherit;">
            <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #cbd5e1; font-size: 9.5px; text-transform: uppercase; color: #475569; letter-spacing: 0.03em; font-weight: 800; line-height: 1.2;">
                    <th style="padding: 5px 2px; text-align: center; width: 34px;">Hạng</th>
                    <th style="padding: 5px 6px; text-align: left; width: 150px;">Nhóm Thi Đua</th>
                    <th style="padding: 5px 4px; text-align: right; width: 68px;">Thưởng</th>
                    <th style="padding: 5px 3px; text-align: center; width: 70px;">Có Thưởng</th>
                    <th style="padding: 5px 3px; text-align: center; width: 60px;">Đạt 100%</th>
                    <th style="padding: 5px 4px; text-align: left; width: 118px;">Kho Cao Nhất</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>
    `;

    wrapper.appendChild(captureTarget);
    document.body.appendChild(wrapper);

    const job = startExportJob({ title: `Xuất ảnh Top nhóm thi đua${channel && channel !== 'ALL' ? ` kênh ${channel}` : ''}` });
    let ok = false;
    try {
        const blob = await exportElementAsImage(captureTarget, 'check-thuong-nhom.png', {
            preset: 'raw', mode: 'blob-only',
            footer: `Top ${listToExport.length} nhóm thi đua · ${exportFooterText()}`,
        });
        if (!blob || blob.size < 500) {
            throw new Error('Không thể tạo dữ liệu ảnh (kết quả rỗng)');
        }

        const channelSlug = (channel && channel !== 'ALL') ? `Kenh_${channel.replace(/[^a-zA-Z0-9]/g, '_')}_` : '';
        job.stage('Đang lưu ảnh…');
        const ketQua = await deliverImage(blob, `Top_${listToExport.length}_Nhom_${channelSlug}Thuong_Cao_${dateFileStr}.png`);
        ok = true;
        return ketQua;
    } finally {
        job.result(`Top ${listToExport.length} nhóm`, ok ? 'ok' : 'failed');
        job.finish();
        if (wrapper.parentNode) {
            wrapper.parentNode.removeChild(wrapper);
        }
    }
}
