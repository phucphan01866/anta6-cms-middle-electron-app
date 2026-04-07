import React, { useState } from 'react';
import type { ServerInfo, LogData } from '../../types';
import { ChevronDown, ChevronRight, TriangleAlert } from 'lucide-react';

export function ServerDropdown({ server, logs }: { server: ServerInfo, logs: LogData[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const totalDevices = server.devices?.length || 0;

  return (
    <div className="bg-surface-container/20 border border-outline-variant/10 rounded-sm overflow-hidden transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-surface-container/40 transition-colors group text-left"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1 rounded-sm ${isOpen ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest/50 text-on-surface-variant'}`}>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">{server.name} — Core Node</span>
            <span className="text-[8px] font-mono text-on-surface-variant/70 uppercase">Serial: {server.serial}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[7px] text-on-surface-variant uppercase font-black tracking-tighter">Devices Linked</span>
            <span className="text-[10px] font-mono text-primary font-black">{totalDevices < 10 ? `0${totalDevices}` : totalDevices}</span>
          </div>
          <div className={`w-1 h-5 rounded-full ${isOpen ? 'bg-primary' : 'bg-outline-variant/20'}`}></div>
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-outline-variant/5 animate-in slide-in-from-top-2 duration-300">
          {server.devices?.map(device => {
            const nodeLogs = logs.filter(l => l.cameraIp === device.device_ip);
            const alertCount = nodeLogs.length;
            const latestLog = nodeLogs[0];
            const lastTime = latestLog ? latestLog.time : 'N/A';
            return (
              <div key={device.device_ip} className="bg-surface-container-low/40 border border-outline-variant/10 px-4 pb-2 rounded-sm flex items-center justify-between hover:bg-surface-container-low transition-colors group/item">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 rounded-full bg-secondary/40 group-hover/item:bg-secondary transition-colors"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-on-surface uppercase tracking-tight">{device.device_name}</span>
                    <span className="text-[8px] font-mono text-on-surface-variant/70">{device.device_ip} • {device.type.toUpperCase()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-end min-w-[70px]">
                    <span className="text-[7px] text-on-surface-variant uppercase font-bold tracking-widest">Alerts</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-black font-mono ${alertCount > 0 ? 'text-tertiary' : 'text-on-surface-variant/40'}`}>
                        {alertCount}
                      </span>
                      <TriangleAlert className={`w-2.5 h-2.5 ${alertCount > 0 ? 'text-tertiary' : 'text-on-surface-variant/20'}`} />
                    </div>
                  </div>

                  <div className="flex flex-col items-end min-w-[90px]">
                    <span className="text-[7px] text-on-surface-variant uppercase font-bold tracking-widest">Sync</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-primary font-bold">{lastTime}</span>
                      <div className="w-1 h-1 rounded-full bg-primary/30 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
