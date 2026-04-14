import type { LogData } from '../types';

export function CameraFeed({ cam, onClick }: { cam: LogData, onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="camera-feed-container group relative bg-surface-container-lowest overflow-hidden rounded-sm border border-outline-variant/20 shadow-inner cursor-pointer transition-all duration-300"
    >
      {cam.snapshot ? (
        <img
          src={`data:image/jpeg;base64,${cam.snapshot}`}
          alt={cam.device_name}
          className="camera-feed-image w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="camera-feed-loading w-full h-full flex flex-col items-center justify-center bg-surface-container-low/50 gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-outline-variant/30 border-t-secondary animate-spin"></div>
          <span className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">Synchronizing Feed...</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>

      <div className="absolute top-3 left-3 flex flex-col">
        <span className="text-[10px] font-bold text-primary tracking-widest bg-black/50 px-2 py-0.5 backdrop-blur-md rounded-sm border border-outline-variant/10">
          {cam.server?.serial?.toUpperCase() || 'UNKNOWN'} // {cam.device_name?.toUpperCase()}
        </span>
        <span className="text-[9px] text-on-surface-variant font-mono mt-1 ml-1 font-bold drop-shadow-md">
          {cam.device_ip}
        </span>
      </div>
    </div>
  );
}
