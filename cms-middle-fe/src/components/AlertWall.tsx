import { useState } from 'react';
import type { LogData, DeviceData } from '../types';
import { CameraOff, Plus, Minus, X, Settings, MonitorSmartphone } from 'lucide-react';
import { CameraFeed } from './CameraFeed';

export function AlertWall({
  cameras,
  devices,
  onSelectLog,
  gridCols,
  setGridCols,
  grids,
  setGrids
}: {
  cameras: LogData[],
  devices: Record<string, DeviceData>,
  onSelectLog: (log: LogData) => void,
  gridCols: number,
  setGridCols: React.Dispatch<React.SetStateAction<number>>,
  grids: {
    gridID: number,
    device: {
      server_serial: string,
      server_id: string,
      device_ip: string,
      device_name: string,
      device_type: string
    }
  }[],
  setGrids: React.Dispatch<React.SetStateAction<{
    gridID: number,
    device: {
      server_serial: string,
      server_id: string,
      device_ip: string,
      device_name: string,
      device_type: string
    }
  }[]>>
}) {
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  const [showGridSettings, setShowGridSettings] = useState(false);

  const colsBreakPoints = [5, 5];

  return (
    <div className="AlertWall flex-1 p-1 overflow-y-auto custom-scrollbar bg-surface-container-low/20">
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGrids(prev => {
                        return prev.filter((_, i) => i !== idx);
                      });
                    }}
                    className={`opacity-0 group-hover:opacity-100 absolute top-0 right-0 z-10 w-10 h-10 bg-gradient-to-bl from-surface-container-high/90 from-[50%] to-transparent to-[50%] hover:from-primary/90 transition-all duration-300 ease-in-out cursor-pointer text-on-surface hover:text-white group flex items-start justify-end p-[6px]`}
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
                <div className="adadlute top-8 right-1 z-20 w-56 bg-surface-container-high border border-outline-variant/50 shadow-2xl rounded-md overflow-hidden flex flex-col max-h-56 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
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

        <div className="absolute bottom-4 right-4 opacity-25 hover:opacity-100 transition-all duration-300 z-10 adlute bottom-4 right-4 flex flex-col gap-2">
          {!showGridSettings ? (
            <button
              onClick={() => setShowGridSettings(true)}
              className="p-2.5 bg-surface-container-high/90 hover:bg-primary/90 text-on-surface hover:text-white border border-outline-variant/30 rounded-full shadow-lg transition-all duration-300 group backdrop-blur-md cursor-pointer"
              title="Grid Settings"
            >
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            </button>
          ) : (
            <div className="flex flex-col bg-surface-container-high/90 backdrop-blur-xl p-1.5 rounded-full border border-outline-variant/30 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 zoom-in-95 fade-in">
              <div className='flex flex-col gap-2'>
                <button
                  onClick={() => setGridCols(gridCols + 1)}
                  className="p-2 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-full transition-colors group cursor-pointer"
                  title="Increase Grid Columns"
                >
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
                <button
                  onClick={() => gridCols > 1 && setGridCols(gridCols - 1)}
                  className="p-2 bg-surface-container hover:bg-surface-container-highest text-on-surface rounded-full transition-colors group cursor-pointer"
                  title="Decrease Grid Columns"
                >
                  <Minus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>
              </div>
              <div className="h-[1px] w-full bg-outline-variant/20 my-1" />
              <button
                onClick={() => setShowGridSettings(false)}
                className="p-2 bg-error/10 hover:bg-surface-container-highest text-error hover:text-white rounded-full transition-all duration-300 group cursor-pointer"
                title="Close Settings"
              >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
