// ── TitleBar — Custom Electron Title Bar ──────────────────────────────────────
// Drag region + custom window control buttons (Close / Maximize / Minimize)
// Phải được render ở top-level trong Dashboard, bên ngoài mọi overflow:hidden container.

import { Minus, Square, X } from 'lucide-react';

// Type mở rộng cho window.electronAPI (được inject bởi preload.js)
declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow:    () => void;
    };
  }
}

export function TitleBar() {
  const api = window.electronAPI;

  // Nếu không chạy trong Electron (dev browser), render nothing hoặc placeholder
  if (!api) return null;

  return (
    <div
      className="TitleBar app-title-bar flex items-center justify-between shrink-0 h-8 bg-surface-container-low select-none border-b border-outline-variant/10"
      // webkit-app-region: drag cho phép kéo cửa sổ từ vùng này
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* App label / logo - có thể thay bằng SVG hoặc text */}
      <span className="px-3 text-[10px] font-black tracking-[0.25em] uppercase text-on-surface-variant/50">
        CMS Middle
      </span>

      {/* Window control buttons — no-drag để click được */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Minimize */}
        <button
          id="titlebar-minimize"
          onClick={api.minimizeWindow}
          className="h-8 w-10 flex items-center justify-center hover:bg-surface-container-high transition-colors group"
          title="Thu nhỏ"
        >
          <Minus className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-on-surface transition-colors" />
        </button>

        {/* Maximize / Restore */}
        <button
          id="titlebar-maximize"
          onClick={api.maximizeWindow}
          className="h-8 w-10 flex items-center justify-center hover:bg-surface-container-high transition-colors group"
          title="Phóng to"
        >
          <Square className="w-3 h-3 text-on-surface-variant group-hover:text-on-surface transition-colors" />
        </button>

        {/* Close */}
        <button
          id="titlebar-close"
          onClick={api.closeWindow}
          className="h-8 w-10 flex items-center justify-center hover:bg-red-500/80 transition-colors group"
          title="Đóng"
        >
          <X className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}
