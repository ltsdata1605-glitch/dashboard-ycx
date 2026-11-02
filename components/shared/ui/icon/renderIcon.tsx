import React from 'react';
import { AppIcon } from './AppIcon';
import { isRegisteredIcon, type IconName } from './iconRegistry';
import type { IconSize } from './iconTokens';

/** Prop icon của component dùng chung: tên chức năng (khuyên dùng) hoặc node tự dựng (cách cũ). */
export type IconProp = IconName | React.ReactNode;

/**
 * Vẽ một prop icon: tên chức năng → `<AppIcon>` đúng token `size` của nơi chứa; node tự dựng → giữ
 * nguyên (để chỗ cũ không vỡ trong lúc chuyển). Dùng ở Tabs, ExportButton… thay vì mỗi nơi tự viết.
 */
export function renderIcon(icon: IconProp, size: IconSize, className?: string): React.ReactNode {
  if (isRegisteredIcon(icon)) {
    return <AppIcon name={icon} size={size} className={className} />;
  }
  return icon;
}
