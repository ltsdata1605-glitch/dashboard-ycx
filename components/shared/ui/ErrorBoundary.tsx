
import React, { ErrorInfo, ReactNode } from 'react';
import { AppIcon } from './icon/AppIcon';
import { Button } from './Button';
import { taiLaiKhiLoiChunk, dangRoiTrang, duocTuTaiLai } from './taiLaiKhiLoiChunk';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`ErrorBoundary [${this.props.name || 'Unknown'}]:`, error, errorInfo);
    
    // Auto-reload on chunk load/dynamic import failure to get the new build
    const errMsg = (error?.message || error?.stack || String(error) || '').toLowerCase();
    if (
      errMsg.includes('failed to fetch dynamically imported module') || 
      errMsg.includes('importing a module script failed') ||
      errMsg.includes('error loading dynamically imported module') ||
      errMsg.includes('chunkloaderror') ||
      errMsg.includes("reading 'default'") ||
      errMsg.includes('reading "default"') ||
      errMsg.includes('failed to load or has no default export')
    ) {
      // Chờ một nhịp và BỎ QUA khi trang đang rời đi — WebKit huỷ import dở dang lúc điều hướng (taiLaiKhiLoiChunk.ts).
      // Giới hạn 2 lần / 5 phút (duocTuTaiLai) — hết lượt thì để màn lỗi bên dưới hiện nút "Tải lại".
      if (!dangRoiTrang() && duocTuTaiLai()) taiLaiKhiLoiChunk();
    }
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errMsg = (this.state.error?.message || this.state.error?.stack || String(this.state.error) || '').toLowerCase();
      const isChunkLoadError = 
        errMsg.includes('failed to fetch dynamically imported module') || 
        errMsg.includes('importing a module script failed') ||
        errMsg.includes('error loading dynamically imported module') ||
        errMsg.includes('chunkloaderror') ||
        errMsg.includes("reading 'default'") ||
        errMsg.includes('reading "default"') ||
        errMsg.includes('failed to load or has no default export');

      return (
        <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-popup text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 mb-4">
            <AppIcon name="warning" size="xl" />
          </div>
          <h3 className="type-headline font-semibold text-rose-900 dark:text-rose-200 mb-2">
            Đã xảy ra lỗi tại {this.props.name || 'khu vực này'}
          </h3>
          <p className="text-sm text-rose-700 dark:text-rose-400 mb-4 max-w-md mx-auto">
            {isChunkLoadError 
              ? 'Không tải được một phần ứng dụng. Vui lòng thử tải lại trang.'
              : (this.state.error?.message || 'Vui lòng thử tải lại trang hoặc kiểm tra lại dữ liệu đầu vào.')}
          </p>
          <Button
            variant="danger" size="md"
            onClick={() => {
              if (isChunkLoadError) {
                // Force reload to get the new index.html with updated chunk hashes
                window.location.reload();
              } else {
                this.setState({ hasError: false, error: null });
              }
            }}
            className=""
          >
            {isChunkLoadError ? 'Tải lại trang' : 'Thử lại'}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
