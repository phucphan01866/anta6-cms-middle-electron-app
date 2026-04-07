import React, { useState } from 'react';
import type { SystemConfig } from '../types';
import { Cloud, Terminal, Trash2 } from 'lucide-react';
import { updateSocketUrlAsync } from '../socket';

export function ConfigExternalServer({ onSave, onClose, initialConfig }: { onSave: (config: SystemConfig) => void, onClose: () => void, initialConfig: SystemConfig }) {
  const [FE] = useState(initialConfig.fe);
  const [BE, setBE] = useState(initialConfig.be);
  const [mode] = useState<'interface' | 'system'>('system');

  const [isConnecting, setIsConnecting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("BE: ", BE)
    const url = `http://${BE.ip}:${BE.port}`;
    setIsConnecting(true);
    const result = await updateSocketUrlAsync(url);

    // Always update system config to reflect the user's intended target
    onSave({ fe: FE, be: BE });

    if (result) {
      onClose();
    } else {
      // Connection failed, but the config is saved so the UI shows the intended target.
      // We don't close the modal so the user can easily edit and try again.
      console.warn(`[CONNECT_FAILED] Target ${url} is unreachable.`);
    }
    setIsConnecting(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="w-full max-w-md bg-surface-container-low border border-outline-variant/30 rounded-lg shadow-[0_0_50px_rgba(192,132,252,0.1)] overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-outline-variant/20 bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_12px_rgba(192,132,252,0.5)]"></div>
            <div>
              <h3 className="text-sm font-black tracking-[0.2em] uppercase text-on-surface">Config System Connection</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface"
          >
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Mode Switcher removed as per request */}

          <div className="space-y-1.5 group">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest block ml-1 transition-colors group-focus-within:text-primary">
              Target IP Address
            </label>
            <div className="relative">
              <input
                type="text"
                value={BE.ip}
                onChange={(e) => setBE({ ...BE, ip: e.target.value })}
                placeholder="0.0.0.0"
                className="w-full bg-black/40 border border-outline-variant/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-sm px-4 py-3 text-sm font-mono text-on-surface outline-none transition-all placeholder:text-on-surface-variant/20"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                <Cloud className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 group">
            <label className="text-[10px] font-black text-primary uppercase tracking-widest block ml-1 transition-colors group-focus-within:text-primary">
              Access Port
            </label>
            <div className="relative">
              <input
                type="text"
                value={BE.port}
                onChange={(e) => setBE({ ...BE, port: e.target.value })}
                placeholder="5000"
                className="w-full bg-black/40 border border-outline-variant/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-sm px-4 py-3 text-sm font-mono text-on-surface outline-none transition-all placeholder:text-on-surface-variant/20"
                required
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                <Terminal className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-outline-variant/30 text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-surface-container-high transition-all text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                disabled={isConnecting}
                type="submit"
                className="flex-1 px-6 py-3 bg-primary text-primary-container text-[11px] font-black uppercase tracking-widest rounded-sm hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(192,132,252,0.2)]"
              >
                {isConnecting ? 'Connecting...' : 'Confirm Sync'}
              </button>
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 py-3 border border-tertiary/30 text-tertiary hover:bg-tertiary/10 transition-all rounded-sm text-[10px] font-black uppercase tracking-[0.2em]"
            >
              <Trash2 className="w-4 h-4" />
              Delete Server Connection
            </button>
          </div>
        </form>

        <div className="px-8 pb-6 text-center">
          <p className="text-[9px] text-on-surface-variant/40 font-mono italic">
            Note: Changes will re-initialize the socket handshake protocol.
          </p>
        </div>
      </div>
    </div>
  );
}
