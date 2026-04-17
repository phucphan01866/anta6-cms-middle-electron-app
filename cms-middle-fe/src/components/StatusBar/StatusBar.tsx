import { useState, useMemo } from 'react';
import type { LogData, SystemConnection, SystemConfig, ServerData, DeviceData } from '../../types';
import { Plus, Inbox, Activity, Terminal, Cpu, Globe, Send, Wifi, WifiOff, Loader2, ChevronDown, RefreshCw, Trash2 } from 'lucide-react';
import { AddExternalServer } from '../AddExternalServer';
import { ConfigSystem } from '../ConfigSystem';
import apiClient from '../../api/apiClient';
import { socket } from '../../socket';
import axios from 'axios';


function InfoTooltip({ children, content, side = "top" }: { children: React.ReactNode, content: string, side?: "top" | "bottom" }) {
  const isBottom = side === "bottom";
  return (
    <div className="relative w-fit group/tooltip flex items-center cursor-help">
      {children}
      <div className={`absolute left-1/2 -translate-x-1/2 ${isBottom ? 'top-full mt-1.5' : 'bottom-full mb-1.5'} w-max max-w-[200px] text-center z-50 pointer-events-none opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 bg-on-surface text-gray-700 text-[10px] px-2 py-1.5 rounded shadow-lg font-medium leading-tight`}>
        {content}
        <div className={`absolute left-1/2 -translate-x-1/2 ${isBottom ? 'bottom-full border-b-[4px] border-b-on-surface' : 'top-full border-t-[4px] border-t-on-surface'} border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent`}></div>
      </div>
    </div>
  );
}

export function StatusBar({
  isConnected, logs, sendServers, receiveServers, onSave, systemConfig, onSaveSystemConfig, onRemoveConnection, servers, devices
}: {
  socket: any,
  isConnected: boolean,
  logs: LogData[],
  sendServers: SystemConnection[],
  receiveServers: SystemConnection[],
  systemConfig: SystemConfig;
  servers: Record<string, ServerData>;
  devices: Record<string, DeviceData>;
  onSave: (ip: string, port: string, mode: 'receive' | 'send') => void,
  onSaveSystemConfig: (config: SystemConfig) => void,
  onRemoveConnection: (ip: string, port: string, mode: 'receive' | 'send') => void,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const [isNetworkFormOpen, setIsNetworkFormOpen] = useState(false);
  const [isConfigSystemOpen, setIsConfigSystemOpen] = useState(false);

  // Group log stats per device_ip per server
  const deviceLogStats = useMemo(() => {
    const stats: Record<string, Record<string, { deviceName: string; deviceIp: string; logCount: number }>> = {};
    (logs || []).forEach(log => {
      const serverId = log.server?.server_id || log.server?.serial || 'UNKNOWN_SERVER';
      if (!stats[serverId]) stats[serverId] = {};
      const deviceKey = log.device_ip || log.device_name || 'UNKNOWN_DEVICE';
      if (!stats[serverId][deviceKey]) {
        stats[serverId][deviceKey] = { deviceName: log.device_name || 'N/A', deviceIp: log.device_ip || 'N/A', logCount: 0 };
      }
      stats[serverId][deviceKey].logCount += 1;
    });
    return stats;
  }, [logs]);

  // Find logs that don't match any configured server/device
  const orphanDevices = useMemo(() => {
    const knownKeys = new Set<string>();
    Object.values(servers).forEach(srv => {
      const serverId = srv.id || srv.serial || srv.server_ip || srv.svms_ipv4_ip || '';
      const matchedDevices = devices[serverId] || devices[srv.id] || devices[srv.serial];
      if (matchedDevices && matchedDevices.devices) {
        matchedDevices.devices.forEach((d: any) => {
          if (d.ip) knownKeys.add(`${serverId}::${d.ip}`);
          if (d.name) knownKeys.add(`${serverId}::${d.name}`);
        });
      }
    });

    const orphans: { name: string, ip: string, logCount: number }[] = [];
    Object.keys(deviceLogStats).forEach(serverId => {
      // Check if server is entirely unknown
      const isServerUnknown = !Object.values(servers).some(s => s.id === serverId || s.serial === serverId || s.server_ip === serverId);

      Object.keys(deviceLogStats[serverId]).forEach(deviceKey => {
        const key = `${serverId}::${deviceKey}`;
        // If server is unknown, or server is known but device is unknown
        if (isServerUnknown || !knownKeys.has(key)) {
          const stat = deviceLogStats[serverId][deviceKey];
          orphans.push({
            name: stat.deviceName,
            ip: stat.deviceIp,
            logCount: stat.logCount
          });
        }
      });
    });
    // console.log('Orphan Devices:', orphans);
    return orphans;
  }, [deviceLogStats, servers, devices]);

  const tabs = [
    { name: 'Current Connection' },
    { name: 'Receiving Data From' },
    { name: 'Sending Data To' },
  ];

  function reconnectSocket() {
    socket.connect();
  }

  return (
    <div className="status-bar-container relative border-t border-outline-variant/10 bg-surface-container-low flex flex-col h-64">
      {activeTab !== 0 && (
        <button onClick={() => setIsNetworkFormOpen(true)} className={` hover:scale-110 transition-scale duration-300 z-1 cursor-pointer right-3 bottom-3 absolute rounded-lg p-2 bg-primary text-white hover:shadow-md hover:scale-105 transition-all duration-300`}>
          <Plus className="w-4 h-4" />
        </button>
      )}

      {/* <button onClick={() =>
        apiClient.get('/show-connections').then((res) => {
          console.log('res', res.data.connections);
        })
        // console.log(
        //   'Current Logs:', logs, '\n',
        //   'servers :', servers, '\n',
        //   'devices: ', devices, '\n',
        //   'sendServers: ', sendServers, '\n',
        //   'receiveServers: ', receiveServers, '\n',
        // )
      } className={` hover:scale-110 transition-scale duration-300 z-1 cursor-pointer right-[3.25rem] bottom-3 absolute rounded-lg p-2 bg-tertiary text-white hover:shadow-md hover:scale-105 transition-all duration-300`} title="Print logs to console">
        <Terminal className="w-4 h-4" />
      </button> */}

      {isNetworkFormOpen && (
        <AddExternalServer
          onClose={() => setIsNetworkFormOpen(false)}
          onSave={onSave}
          initialIp={import.meta.env.VITE_DEV_FORWARD_IP}
          initialPort={import.meta.env.VITE_DEV_FORWARD_PORT}
          initialMode={activeTab === 1 ? 'receive' : 'send'}
        />
      )}
      {isConfigSystemOpen && (
        <ConfigSystem
          initialConfig={systemConfig}
          onSave={onSaveSystemConfig}
          onClose={() => setIsConfigSystemOpen(false)}
        />
      )}
      <div className="status-bar-tabs flex border-b border-outline-variant/10 px-6">
        {tabs.map((tab, idx) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(idx)}
            className={`status-bar-tab-btn px-6 py-3 text-[10px] font-bold tracking-[0.2em] uppercase transition-all duration-300 border-b-2 ${activeTab === idx
              ? "border-primary text-primary bg-surface-container/30"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
          >
            {tab.name}
          </button>
        ))}
      </div>
      <div className="status-bar-content flex-1 px-6 py-4 overflow-scroll custom-scrollbar relative">
        {activeTab === 0 && (
          <div className="grid grid-cols-2 gap-8 max-w-2xl animate-in fade-in duration-500">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">This Machine Host IP</span>
                <button
                  onClick={() => setIsConfigSystemOpen(true)}
                  className="text-[9px] font-black text-primary hover:text-primary/80 uppercase tracking-tighter border-b border-primary/20 hover:border-primary transition-all cursor-pointer"
                >
                  Edit Configuration
                </button>
              </div>
              <div className="text-2xl font-black text-primary font-mono tracking-tight">{systemConfig.be.ip}:{systemConfig.be.port}</div>
              <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden mt-2">
                <div className="h-full bg-primary/40 w-3/4"></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  onClick={() => { if (!isConnected) { reconnectSocket() } }}
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-secondary ring-4 ring-secondary/20' : 'bg-tertiary ring-4 ring-tertiary/20 cursor-pointer'} animate-pulse`}></div>
                <div className={`text-2xl font-black font-mono tracking-tight ${isConnected ? 'text-secondary' : 'text-tertiary'}`}>
                  STATUS: {isConnected ? 'STABLE' : 'NOT CONNECTED'}
                </div>
              </div>
              <p className="text-[9px] text-on-surface-variant/60 font-medium uppercase mt-2">{isConnected ? 'Connected to system' : 'Not connected to system'}</p>
            </div>
          </div>
        )}

        {(activeTab === 1 || activeTab === 2) && (
          <div className="flex flex-col h-full animate-in fade-in duration-500 gap-6">

            {/* Active Connections List */}
            <div className="flex-1 flex flex-col gap-3">
              <span className="text-[9px] font-bold tracking-widest uppercase text-on-surface-variant">Active Connections</span>

              {activeTab === 1 && Object.keys(servers).length === 0 && orphanDevices.length === 0 && (
                <div className="py-10 flex flex-col items-center justify-center opacity-20 gap-2">
                  <Inbox className="w-8 h-8" />
                  <span className="text-[10px] uppercase font-bold">No servers connected</span>
                </div>
              )}
              {activeTab === 1 && (Object.values(servers).length > 0 || orphanDevices.length > 0) && (
                <div className="grid gap-3">
                  {Object.values(servers).map((srv, idx) => {
                    const serverId = srv.id || srv.serial || srv.server_ip || srv.svms_ipv4_ip || '';
                    const matchedDevices = devices[serverId] || devices[srv.id] || devices[srv.serial];
                    const deviceStats = deviceLogStats[serverId] || deviceLogStats[srv.id] || deviceLogStats[srv.serial] || {};

                    return (
                      <div key={idx} className="server-item-card bg-surface-container border border-outline-variant/10 px-4 py-4 rounded-sm border-l-4 border-l-secondary/50 shadow-sm transition-all hover:bg-surface-container-high/30">
                        {/* Server Header */}
                        <div className="flex items-center justify-between border-b border-outline-variant/5">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary/10 rounded-lg shrink-0">
                              <Cpu className="w-5 h-5 text-secondary" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <InfoTooltip content="Tên Server">
                                <span className="text-[14px] font-black text-on-surface tracking-tight leading-none uppercase">{srv.server_name || srv.id}</span>
                              </InfoTooltip>
                              <div className="flex items-center gap-3 pt-1">
                                <InfoTooltip content="Mã định danh Server (Server ID)">
                                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">{srv.id || srv.serial}</span>
                                </InfoTooltip>
                                <span className="w-1 h-1 rounded-full bg-outline-variant/30"></span>
                                <InfoTooltip content="Địa chỉ IP gốc của Server">
                                  <span className="text-[9px] font-mono text-on-surface-variant">IP: {srv.svms_ipv4_ip || srv.server_ip || srv.sender_ip}</span>
                                </InfoTooltip>
                                <span className="w-1 h-1 rounded-full bg-outline-variant/30"></span>
                                <InfoTooltip content="Phiên bản VMS">
                                  <span className="text-[9px] font-mono text-on-surface-variant">v{srv.version}</span>
                                </InfoTooltip>
                              </div>
                            </div>
                          </div>
                          {/* Aggregate stats placeholder or purely visual element */}
                          <div className="flex flex-col items-end gap-1 px-3 py-1 bg-surface-container/50 rounded-md border border-outline-variant/10">
                            <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">DEVICES ASSIGNED</span>
                            <span className="text-[12px] font-black font-mono text-on-surface">{matchedDevices?.devices?.length || 0}</span>
                          </div>
                        </div>

                        {/* Devices list with per-device log counts */}
                        {matchedDevices && matchedDevices.devices.length > 0 ? (
                          <div className="grid gap-1.5">
                            {matchedDevices.devices.map((device, dIdx) => {
                              const dStats = deviceStats[device.ip] || deviceStats[device.name];
                              const logCount = dStats?.logCount || 0;
                              return (
                                <DeviceItemRow
                                  key={dIdx}
                                  name={device.name}
                                  ip={device.ip}
                                  type={device.type}
                                  logCount={logCount}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="pl-2 px-3 py-3 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest flex items-center justify-center gap-2 bg-surface-container-lowest/10 rounded-sm border border-dashed border-outline-variant/10">
                            <Activity className="w-3.5 h-3.5 opacity-50" />
                            Chưa nhận được cấu hình devices cho server này
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Orphan / Unknown Devices Card - "Server khác" */}
                  <UnknownDevicesCard orphanDevices={orphanDevices} />
                </div>
              )}

              {activeTab === 2 && sendServers.length === 0 && (
                <div className="py-10 flex flex-col items-center justify-center opacity-20 gap-2">
                  <Inbox className="w-8 h-8" />
                  <span className="text-[10px] uppercase font-bold">No send targets configured</span>
                </div>
              )}
              {activeTab === 2 && sendServers.length > 0 && (
                <div className="grid gap-3">
                  {sendServers.map((s, idx) => (
                    <SendTargetCard key={idx} conn={s} />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function UnknownDevicesCard({ orphanDevices }: { orphanDevices: { name: string; ip: string; logCount: number }[] }) {
  if (!orphanDevices || orphanDevices.length === 0) return null;

  return (
    <div className="unknown-devices-card bg-surface-container border border-outline-variant/10 px-4 py-4 rounded-sm border-l-4 border-l-tertiary/50 shadow-sm mt-4">
      {/* Server Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-tertiary/10 rounded-lg shrink-0">
            <Globe className="w-5 h-5 text-tertiary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <InfoTooltip content="Các logs không có cấu hình Server/Device tương ứng">
              <span className="text-[14px] font-black text-on-surface tracking-tight leading-none uppercase">Server khác</span>
            </InfoTooltip>
            <div className="flex items-center gap-3 pt-1">
              <InfoTooltip content="Trạng thái">
                <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">UNREGISTERED</span>
              </InfoTooltip>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 px-3 py-1 bg-surface-container/50 rounded-md border border-outline-variant/10">
          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">UNKNOWN DEVICES</span>
          <span className="text-[12px] font-black font-mono text-tertiary">{orphanDevices.length}</span>
        </div>
      </div>

      {/* Devices list with per-device log counts */}
      <div className="grid gap-1.5">
        {orphanDevices.map((device, dIdx) => (
          <DeviceItemRow
            key={dIdx}
            name={device.name}
            ip={device.ip}
            logCount={device.logCount}
            isOrphan={true}
          />
        ))}
      </div>
    </div>
  );
}

function DeviceItemRow({
  name,
  ip,
  type,
  logCount,
  isOrphan = false
}: {
  name: string;
  ip: string;
  type?: string;
  logCount: number;
  isOrphan?: boolean;
}) {
  return (
    <div className="device-item-row flex items-center gap-4 px-3 py-2 bg-surface-container-lowest/30 rounded-md border border-outline-variant/5 hover:border-outline-variant/20 transition-colors">
      <InfoTooltip content="Phân loại thiết bị" side="bottom">
        <span className={`text-[9px] font-mono min-w-[80px] text-center px-2 py-0.5 rounded-sm border shadow-[0_0_8px_rgba(var(--color-${isOrphan ? "tertiary" : "secondary"}),0.1)] ${isOrphan ? "text-tertiary bg-tertiary/10 border-tertiary/20" : "text-secondary bg-secondary/10 border-secondary/20"}`}>
          {isOrphan ? "Unknown" : (type ? type.charAt(0).toUpperCase() + type.slice(1).toLowerCase() : "Unknown")}
        </span>
      </InfoTooltip>
      <InfoTooltip content="Tên Thiết bị" side="bottom">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex-1 truncate max-w-[200px] block">{name}</span>
      </InfoTooltip>
      <div className="flex w-full items-center justify-between gap-2">
        <InfoTooltip content="IP Thiết bị" side="bottom">
          <span className="text-[10px] font-mono text-on-surface-variant/70 min-w-[120px]">{ip}</span>
        </InfoTooltip>
        <InfoTooltip content="Tổng Logs nhận được">
          <span className={`text-[10px] font-black font-mono px-3 py-1 rounded border min-w-[80px] text-center transition-all ${logCount > 0 ? 'text-secondary bg-secondary/10 border-secondary/20 shadow-[0_0_8px_rgba(var(--color-secondary),0.1)]' : 'text-on-surface-variant/40 bg-surface-container border-outline-variant/10'}`}>
            {logCount} logs
          </span>
        </InfoTooltip>
      </div>
    </div>
  );
}

function SendTargetCard({ conn }: { conn: SystemConnection }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const status = conn.status || 'connecting';

  const handleRemoveConnection = async () => {
    console.log('[DEBUG] remove-connection for:', conn.ip);
    setIsMenuOpen(false);
    try {
      await apiClient.post('/api/v1/remove-connection', {
        ip: conn.ip,
        port: conn.port,
      });
    } catch (e) {
      console.error('[DEBUG] Failed to remove connection', e);
    }
  };

  const handleReconnect = async () => {
    console.log('[DEBUG] reconnect for:', conn.ip);
    // Gọi API -> BE sẽ bắn socket event -> useSocketManager cập nhật sendServers -> conn.status tự thay đổi
    await apiClient.post('/api/v1/reconnect-connection', {
      ip: conn.ip,
      port: conn.port,
    });
  };

  const statusConfig = {
    connecting: {
      dot: 'bg-amber-400 ring-amber-400/20',
      badge: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
      label: 'CONNECTING',
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      border: 'border-l-amber-400/60',
    },
    connected: {
      dot: 'bg-secondary ring-secondary/20',
      badge: 'text-secondary bg-secondary/10 border-secondary/30 hover:bg-secondary/20 cursor-pointer',
      label: 'CONNECTED',
      icon: <Wifi className="w-3 h-3" />,
      border: 'border-l-secondary/60',
    },
    disconnected: {
      dot: 'bg-tertiary ring-tertiary/20',
      badge: 'text-tertiary bg-tertiary/10 border-tertiary/30 hover:bg-tertiary/20 cursor-pointer',
      label: 'DISCONNECTED',
      icon: <WifiOff className="w-3 h-3" />,
      border: 'border-l-tertiary/60',
    },
  } as const;

  const cfg = statusConfig[status] ?? statusConfig.disconnected;

  return (
    <div className={`send-target-card bg-surface-container border border-outline-variant/10 px-4 py-3 rounded-sm flex items-center justify-between border-l-4 ${cfg.border} transition-all hover:bg-surface-container-high/30`}>
      <div className="flex items-start gap-4">
        <div className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ring-4 ${cfg.dot} ${status === 'connecting' ? 'animate-pulse' : ''}`}></div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">SEND TARGET</span>
          <div className="flex items-end gap-2">
            <span className="text-lg font-black text-on-surface font-mono tracking-tight leading-none">{conn.ip}</span>
            <span className="text-[11px] font-mono text-on-surface-variant/60 mb-0.5">:{conn.port}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-1">
          <span className="text-[8px] font-bold text-on-surface-variant uppercase">LOGS SENT</span>
          <span className="text-[13px] font-black font-mono text-on-surface flex items-center gap-1">
            <Send className="w-3 h-3 text-on-surface-variant/50" />
            <button onClick={() => apiClient.get('/test').then(res => console.log(res))}>{conn.sentCount || 0}</button>
          </span>
        </div>

        <div className="flex flex-col items-end gap-1 border-l border-outline-variant/10 pl-4 relative">
          <span className="text-[8px] font-bold text-on-surface-variant uppercase">STATUS</span>

          {status === 'connected' ? (
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs font-mono border flex items-center gap-1.5 transition-colors ${cfg.badge}`}
              >
                {cfg.icon}
                {cfg.label}
                <ChevronDown className={`w-3 h-3 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-surface-container-high border border-outline-variant shadow-xl rounded-md min-w-[140px] overflow-hidden animate-in fade-in zoom-in duration-200">
                  <button
                    onClick={handleRemoveConnection}
                    className="w-full text-left px-3 py-2 text-[10px] font-bold text-tertiary hover:bg-tertiary/10 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    REMOVE CONNECTION
                  </button>
                </div>
              )}
            </div>
          ) : status === 'disconnected' ? (
            <InfoTooltip content="Kết nối lại" side="top">
              <button
                onClick={handleReconnect}
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs font-mono border flex items-center gap-1.5 transition-colors ${cfg.badge}`}
              >
                <RefreshCw className="w-3 h-3" />
                {cfg.label}
              </button>
            </InfoTooltip>
          ) : (
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-xs font-mono border flex items-center gap-1.5 ${cfg.badge}`}>
              {cfg.icon}
              {cfg.label}
            </span>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </div>
  );
}
