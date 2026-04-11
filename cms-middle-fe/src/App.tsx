import { useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StatusBar } from './components/StatusBar/StatusBar';
import { LogPopup } from './components/LogPopup';
import { useSocketManager } from './hooks/useSocketManager';
import { SlidersHorizontal, Terminal, Check, Cpu, MonitorSmartphone, Camera } from 'lucide-react';
import { LogEntry } from './components/LogEntry';
import { CameraFeed } from './components/CameraFeed';
import type { LogData, ServerData, DeviceData } from './types';
import LoginPage from './components/LoginPage';
import { authApi } from './api/authApi';


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!authApi.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// ── LogFilter Dropdown Component ─────────────────────────────────────────────
function LogFilter({
  servers,
  devices,
  selectedServers,
  selectedDevices,
  onToggleServer,
  onToggleDevice,
}: {
  servers: Record<string, ServerData>;
  devices: Record<string, DeviceData>;
  selectedServers: Set<string>;
  selectedDevices: Set<string>;
  onToggleServer: (id: string) => void;
  onToggleDevice: (ip: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const serverList = Object.values(servers);
  const deviceList = useMemo(() => {
    const seen = new Set<string>();
    return Object.values(devices).flatMap(d => d.devices || []).filter(d => {
      if (!d.ip || seen.has(d.ip)) return false;
      seen.add(d.ip);
      return true;
    });
  }, [devices]);

  const activeCount = selectedServers.size + selectedDevices.size;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 group border ${activeCount > 0
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-transparent hover:border-outline-variant/30 text-on-surface-variant hover:text-primary'
          }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        {activeCount > 0 && (
          <span className="text-[9px] font-black font-mono bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-surface-container-high border border-outline-variant/20 shadow-2xl rounded-lg w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

          {/* Servers */}
          <div className="px-3 pt-3 pb-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Cpu className="w-3 h-3 text-secondary" />
              <span className="text-[9px] font-black uppercase tracking-widest text-secondary">Servers</span>
            </div>
            {serverList.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant/40 py-1 pl-1">Chưa có server nào</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {serverList.map(srv => {
                  const id = srv.id || srv.serial;
                  const checked = selectedServers.has(id);
                  return (
                    <button
                      key={id}
                      onClick={() => onToggleServer(id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-container transition-colors w-full text-left"
                    >
                      <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-secondary border-secondary' : 'border-outline-variant'
                        }`}>
                        {checked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                      <span className="text-[11px] font-semibold text-on-surface truncate">{srv.server_name || id}</span>
                      <span className="text-[9px] font-mono text-on-surface-variant/50 ml-auto shrink-0">{srv.server_ip}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mx-3 my-1 border-t border-outline-variant/10" />

          {/* Devices */}
          <div className="px-3 pb-3 pt-1">
            <div className="flex items-center gap-1.5 mb-2">
              <MonitorSmartphone className="w-3 h-3 text-tertiary" />
              <span className="text-[9px] font-black uppercase tracking-widest text-tertiary">Devices</span>
            </div>
            {deviceList.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant/40 py-1 pl-1">Chưa có device nào</p>
            ) : (
              <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto custom-scrollbar">
                {deviceList.map(dev => {
                  const checked = selectedDevices.has(dev.ip);
                  return (
                    <button
                      key={dev.ip}
                      onClick={() => onToggleDevice(dev.ip)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface-container transition-colors w-full text-left"
                    >
                      <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-tertiary border-tertiary' : 'border-outline-variant'
                        }`}>
                        {checked && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                      <span className="text-[11px] font-semibold text-on-surface truncate">{dev.name}</span>
                      <span className="text-[9px] font-mono text-on-surface-variant/50 ml-auto shrink-0">{dev.ip}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function Dashboard() {
  const {
    isConnected,
    logs,
    servers,
    devices,
    systemConfig,
    setSystemConfig,
    sendServers,
    receiveServers,
    handleAddExternalServer,
    handleRemoveConnection,
    socket
  } = useSocketManager();

  const [selectedLog, setSelectedLog] = useState<LogData | null>(null);
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set());
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());

  const toggleServer = (id: string) =>
    setSelectedServers(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleDevice = (ip: string) =>
    setSelectedDevices(prev => { const s = new Set(prev); s.has(ip) ? s.delete(ip) : s.add(ip); return s; });

  // Lọc logs theo server và/hoặc device đang được chọn
  const filteredLogs = useMemo(() => {
    if (selectedServers.size === 0 && selectedDevices.size === 0) return logs;
    return logs.filter(log => {
      const logServerId = log.server?.server_id || log.server?.serial || '';
      const serverMatch = selectedServers.size > 0 && selectedServers.has(logServerId);
      const deviceMatch = selectedDevices.size > 0 && selectedDevices.has(log.device_ip);
      // Log hiển thị nếu khớp với bất kỳ filter nào đang bật
      return serverMatch || deviceMatch;
    });
  }, [logs, selectedServers, selectedDevices]);


  // Logout on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[DASHBOARD] Escape pressed, logging out...');
        authApi.logout();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const latestCameras = useMemo(() => {
    const camMap = new Map<string, LogData>();
    logs.forEach(log => {
      const key = `${log.ip}-${log.device_ip}`;
      if (!camMap.has(key)) {
        camMap.set(key, log);
      }
    });
    return Array.from(camMap.values()).slice(0, 6);
  }, [logs]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-on-surface font-sans selection:bg-primary/30 antialiased">
      <main className="flex-1 grid grid-cols-4 gap-0 overflow-hidden">
        {/* Main Section */}
        <div className="col-span-3 grid grid-rows-[1fr_0fr] overflow-hidden bg-background h-full border-r border-outline-variant/20">

          <div className="flex flex-col overflow-hidden h-full">
            <div className="p-4 flex items-center gap-2 border-b border-outline-variant/10 shrink-0">
              <Camera className="w-4 h-4 text-primary" />
              <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface">Surveillance Grid</h2>
            </div>

            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-surface-container-low/20">
              {latestCameras.length > 0 ? (
                <div className="grid grid-cols-3 gap-6 auto-rows-max">
                  {latestCameras.map((cam, idx) => (
                    <CameraFeed key={idx} cam={cam} onClick={() => setSelectedLog(cam)} />
                  ))}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center opacity-30 gap-3">
                  <Camera className="w-12 h-12" />
                  <span className="text-[11px] uppercase tracking-widest font-black">No incoming video streams detected</span>
                </div>
              )}
            </div>
            <div className="shrink-0">
              <StatusBar
                socket={socket}
                isConnected={isConnected}
                systemConfig={systemConfig}
                onSaveSystemConfig={(config) => { setSystemConfig(config) }}
                sendServers={sendServers}
                receiveServers={receiveServers}
                logs={logs}
                servers={servers}
                devices={devices}
                onSave={(ip, port, mode) => handleAddExternalServer(ip, port, mode)}
                onRemoveConnection={(ip: string, port: string, mode: 'receive' | 'send') => handleRemoveConnection(ip, port, mode)}
              />
            </div>
          </div>
        </div>

        {/* Right Section - Realtime Intelligence Log */}
        <aside className="col-span-1 bg-surface-container-lowest flex flex-col overflow-hidden shadow-2xl relative z-10">
          <div className="p-4 flex items-center justify-between border-b border-outline-variant/10 shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="text-primary w-4 h-4" />
              <h2 className="font-headline text-xs tracking-[0.15em] uppercase text-on-surface mt-0.5">System Intelligence Log</h2>
            </div>
            <div className="flex items-center p-1 cursor-pointer transition-all duration-200 group">
              <LogFilter
                servers={servers}
                devices={devices}
                selectedServers={selectedServers}
                selectedDevices={selectedDevices}
                onToggleServer={toggleServer}
                onToggleDevice={toggleDevice}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-surface-container-low/10">
            {filteredLogs.length > 0 ? (
              <div className="flex flex-col">
                {filteredLogs.map((log, idx) => (
                  <div key={idx} className="border-b border-outline-variant/5">
                    <LogEntry log={log} onClick={() => setSelectedLog(log)} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 flex flex-col items-center justify-center opacity-20 gap-2 h-full text-center">
                <Terminal className="w-8 h-8" />
                <span className="text-[10px] uppercase font-bold tracking-widest">Logs queue empty</span>
              </div>
            )}
          </div>
        </aside>
      </main>

      {selectedLog && (
        <LogPopup
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
