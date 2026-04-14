import { useState, useEffect, useRef, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StatusBar } from './components/StatusBar/StatusBar';
import { LogPopup } from './components/LogPopup';
import { useSocketManager } from './hooks/useSocketManager';
import { SlidersHorizontal, Terminal, Check, Cpu, MonitorSmartphone, Camera, CameraOff, Plus, Minus, X, Settings, Monitor, Network } from 'lucide-react';
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
    <div ref={ref} className="app-log-filter">
      <button
        onClick={() => setOpen(v => !v)}
        className={`app-log-filter-btn flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200 group border ${activeCount > 0
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
        <div className="absolute right-0 top-full mt-2 z-50 bg-surface-container-high border border-outline-variant/90 shadow-2xl rounded-lg w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

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

function AppGridCamera({ cameras, devices, onSelectLog }: { cameras: LogData[], devices: Record<string, DeviceData>, onSelectLog: (log: LogData) => void }) {
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [gridCols, setGridCols] = useState<number>(3);
  const [grids, setGrids] = useState<{
    gridID: number,
    device: {
      server_serial: string,
      server_id: string,
      device_ip: string,
      device_name: string,
      device_type: string
    }
  }[]>([]);
  const colsBreakPoints = [
    5, 5
  ]
  return (
    // <div className="app-surveillance-grid flex-1 p-6 overflow-y-auto custom-scrollbar bg-surface-container-low/20">
    //   {cameras.length > 0 ? (
    //     <div className="grid grid-cols-3 gap-3 auto-rows-max">
    //       {cameras.map((cam, idx) => (
    //         <CameraFeed key={idx} cam={cam} onClick={() => onSelectLog(cam)} />
    //       ))}
    //     </div>
    //   ) : (
    //     <div className="w-full h-full flex flex-col items-center justify-center opacity-30 gap-3">
    //       <Camera className="w-12 h-12" />
    //       <span className="text-[11px] uppercase tracking-widest font-black">No incoming video streams detected</span>
    //     </div>
    //   )}
    // </div>
    <div className="app-surveillance-grid flex-1 p-1 overflow-y-auto custom-scrollbar bg-surface-container-low/20">
      {/* {cameras.length > 0 ? (
        <div className={`grid grid-cols-${gridCols} grid-rows-${gridCols} gap-3 auto-rows-max`}>
          {cameras.map((cam, idx) => (
            <CameraFeed key={idx} cam={cam} onClick={() => onSelectLog(cam)} />
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center opacity-30 gap-3">
          <Camera className="w-12 h-12" />
          <span className="text-[11px] uppercase tracking-widest font-black">No incoming video streams detected</span>
        </div>
      )} */}
      <div
        className="relative h-full w-full grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridCols}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: Math.pow(gridCols, 2) }).map((_, idx) => {
          const gridItem = grids[idx];
          const camera = gridItem
            ? cameras.find(cam => cam.server?.server_id === gridItem.device.server_id && cam.device_ip === gridItem.device.device_ip)
            : undefined;
          return (
            <div
              key={idx}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('ring-2', 'ring-primary', 'ring-inset');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('ring-2', 'ring-primary', 'ring-inset');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-primary', 'ring-inset');
                const data = e.dataTransfer.getData('application/json');
                if (data) {
                  try {
                    const parsed = JSON.parse(data);
                    setGrids(prev => {
                      const clone = [...prev];
                      clone[idx] = { gridID: idx, device: parsed };
                      return clone;
                    });
                  } catch (err) { }
                }
              }}
              className="relative group camera-feed-item h-full w-full bg-surface-container-low/50 border border-outline-variant/10 rounded-xs overflow-hidden transition-all"
            >
              {camera ? (
                <>
                  <CameraFeed key={idx} cam={camera} onClick={() => onSelectLog(camera)} />
                  {/* <div className="no-camera w-full h-full flex flex-col items-center justify-center opacity-30 gap-[10%] text-center px-4 py-2">
                    <CameraOff className={`${gridCols > colsBreakPoints[1] ? 'w-[80%] h-[80%]' : gridCols > colsBreakPoints[0] ? 'w-8 h-8' : 'w-12 h-12'} transition-all`} />
                    <span className={`text-[11px] uppercase tracking-widest font-bold line-clamp-1 transition-all ${gridCols > colsBreakPoints[1] ? 'hidden' : ''}`}>
                      No incoming video streams detected
                    </span>
                  </div> */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGrids(prev => {
                        return prev.filter((_, i) => i !== idx);
                      });
                    }}
                    className={`opacity-0 group-hover:opacity-100 absolute top-0 right-0 z-10 w-10 h-10 bg-gradient-to-bl from-surface-container-high/90 from-[50%] to-transparent to-[50%] hover:from-primary/90 transition-all duration-300 ease-in-out cursor-pointer text-on-surface hover:text-white group flex items-start justify-end p-[6px]`}
                    title={gridItem ? 'Change Device' : 'Select Device'}
                  >
                    <div className="w-3 h-3 group-hover:scale-110 transition-transform opacity-70 group-hover:opacity-100 flex items-center justify-center">
                      <X className="w-full h-full" />
                    </div>
                  </button>
                </>
              ) : (
                <div className="no-camera w-full h-full flex flex-col items-center justify-center opacity-30 gap-[10%] text-center px-4 py-2">
                  <CameraOff className={`${gridCols > colsBreakPoints[1] ? 'w-[80%] h-[80%]' : gridCols > colsBreakPoints[0] ? 'w-8 h-8' : 'w-12 h-12'} transition-all`} />
                  <span className={`text-[11px] uppercase tracking-widest font-bold line-clamp-1 transition-all ${gridCols > colsBreakPoints[1] ? 'hidden' : ''}`}>
                    No incoming video streams detected
                  </span>
                </div>
              )}
              {openDropdownIdx === idx && (
                <div className="absolute top-8 right-1 z-20 w-56 bg-surface-container-high border border-outline-variant/50 shadow-2xl rounded-md overflow-hidden flex flex-col max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-outline-variant/10 bg-surface-container-highest shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                      Available Devices
                    </span>
                  </div>
                  {Object.values(devices).flatMap(server =>
                    server.devices?.map(dev => (
                      <button
                        key={`${server.server.server_id}-${dev.ip}`}
                        className="text-left px-3 py-2.5 text-[10px] text-on-surface hover:bg-surface-container-highest border-b border-outline-variant/10 last:border-b-0 transition-colors flex flex-col gap-0.5 group"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newGrids = [...grids];
                          newGrids[idx] = {
                            gridID: idx,
                            device: {
                              server_serial: server.server.serial,
                              server_id: server.server.server_id,
                              device_ip: dev.ip,
                              device_name: dev.name,
                              device_type: dev.type
                            }
                          };
                          setGrids(newGrids);
                          setOpenDropdownIdx(null);
                        }}
                      >
                        <div className="font-bold truncate group-hover:text-primary transition-colors">{dev.name}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-on-surface-variant font-mono">{dev.ip}</span>
                          <span className="text-[7px] px-1 py-0.5 rounded-sm bg-tertiary/10 text-tertiary uppercase tracking-wider">{dev.type || 'UNKNOWN'}</span>
                        </div>
                      </button>
                    )) || []
                  )}
                  {(!Object.values(devices).some(s => s.devices?.length > 0)) && (
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center gap-2 opacity-50">
                      <MonitorSmartphone className="w-6 h-6" />
                      <span className="text-[9px] uppercase tracking-widest font-bold">No Devices Found</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="opacity-25 hover:opacity-100 transition-all duration-300 z-10 absolute bottom-4 right-4 flex flex-col gap-2">
          {!showGridSettings ? (
            <button
              onClick={() => setShowGridSettings(true)}
              className="p-2.5 bg-surface-container-high/90 hover:bg-primary/90 text-on-surface hover:text-white border border-outline-variant/30 rounded-full shadow-lg transition-all duration-300 group backdrop-blur-md"
              title="Grid Settings"
            >
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            </button>
          ) : (
            <div className="flex flex-col bg-surface-container-high/90 backdrop-blur-xl p-1.5 rounded-full border border-outline-variant/30 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 zoom-in-95 fade-in">
              <div className='flex flex-col gap-2'>
                <button
                  onClick={() => setGridCols(gridCols + 1)}
                  className="p-2 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-full transition-colors group"
                  title="Increase Grid Columns"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={() => gridCols > 1 && setGridCols(gridCols - 1)}
                  className="p-2 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-full transition-colors group"
                  title="Decrease Grid Columns"
                >
                  <Minus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <div className="h-[1px] w-full bg-outline-variant/20 my-1" />
              <button
                onClick={() => setShowGridSettings(false)}
                className="p-2 bg-error/10 hover:bg-surface-container-highest text-on-surface rounded-full transition-colors group text-error hover:text-white rounded-full transition-all duration-300 group"
                title="Close Settings"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
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
  const [rightTab, setRightTab] = useState<'logs' | 'devices'>('logs');

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
    <div className="app-dashboard-root flex flex-col h-screen overflow-hidden bg-background text-on-surface font-sans selection:bg-primary/30 antialiased">
      <main className="app-dashboard-main flex-1 grid grid-cols-4 gap-0 overflow-hidden">
        {/* Main Section */}
        <div className="app-dashboard-left-section col-span-3 grid grid-rows-[1fr] overflow-hidden bg-background h-full border-r border-outline-variant/20">
          <div className="flex flex-col overflow-hidden h-full">
            <div className="px-6 py-4 flex items-center gap-4 border-b border-outline-variant/10 shrink-0">
              <button className='flex items-center gap-2'>
                <Monitor className="w-5 h-5 text-primary" />
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface">Alert Wall</h2>
              </button>
              <button className='flex items-center gap-2'>
                <Network className="w-5 h-5 text-primary" />
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-on-surface">Connections Monitor</h2>
              </button>
            </div>
            <AppGridCamera cameras={latestCameras} devices={devices} onSelectLog={setSelectedLog} />
          </div>
          {/* <div className="app-status-bar-wrapper shrink-0">
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
          </div> */}
        </div>

        {/* Right Section */}
        <aside className="app-dashboard-right-section col-span-1 bg-surface-container-lowest flex flex-col overflow-hidden shadow-2xl relative z-10 w-full">
          <div className="flex items-center border-b border-outline-variant/10 shrink-0">
            <button
              onClick={() => setRightTab('logs')}
              className={`flex-1 py-3 text-[10px] tracking-widest font-bold uppercase transition-colors flex items-center justify-center gap-2 ${rightTab === 'logs' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-on-surface-variant hover:bg-surface-container-low/50 border-b-2 border-transparent'}`}
            >
              <Terminal className="w-3.5 h-3.5" />Logs
            </button>
            <button
              onClick={() => setRightTab('devices')}
              className={`flex-1 py-3 text-[10px] tracking-widest font-bold uppercase transition-colors flex items-center justify-center gap-2 ${rightTab === 'devices' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-on-surface-variant hover:bg-surface-container-low/50 border-b-2 border-transparent'}`}
            >
              <MonitorSmartphone className="w-3.5 h-3.5" />Devices
            </button>
          </div>

          {rightTab === 'logs' ? (
            <>
              <div className="p-3 flex items-center justify-between border-b border-outline-variant/10 shrink-0 bg-surface-container-lowest">
                <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">Filter Logs</span>
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

              <div className="app-logs-container flex-1 overflow-y-auto custom-scrollbar p-0 bg-surface-container-low/10">
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
            </>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 bg-surface-container-low/10 flex flex-col gap-2 relative">
              <div className="text-[9px] uppercase tracking-widest text-on-surface-variant mb-2 text-center opacity-50 font-bold sticky top-0 py-1">Drag items to assign to grid cells</div>
              {Object.values(devices).flatMap(server => server.devices?.map(dev => (
                <div
                  key={`${server.server.server_id}-${dev.ip}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({
                      server_serial: server.server.serial,
                      server_id: server.server.server_id,
                      device_ip: dev.ip,
                      device_name: dev.name,
                      device_type: dev.type || 'vms'
                    }));
                  }}
                  className="p-3 bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 rounded-sm cursor-grab active:cursor-grabbing flex flex-col gap-1 shadow-sm transition-all text-on-surface group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-widest group-hover:text-primary transition-colors">{dev.name}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-surface-container-highest rounded text-on-surface-variant uppercase font-medium">{dev.type || 'vms'}</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono">{dev.ip}</span>
                </div>
              )))}
              {!Object.values(devices).some(s => s.devices?.length > 0) && (
                <div className="p-10 flex flex-col items-center justify-center opacity-30 gap-2 h-full text-center">
                  <MonitorSmartphone className="w-8 h-8" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">No Devices Found</span>
                </div>
              )}
            </div>
          )}
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
