import type { LogData } from '../types';
import { TriangleAlert, Info, AlertCircle } from 'lucide-react';

export function LogEntry({ log, onClick }: { log: LogData, onClick: () => void }) {
  let Icon = Info;
  let colorClass = 'text-primary';
  let bgBorderClass = 'bg-primary';

  let logType = typeof log.log_type === 'string' ? log.log_type.toLowerCase() : 'info';
  
  if (logType.includes('event') || logType.includes('error')) {
    Icon = AlertCircle;
    colorClass = 'text-tertiary';
    bgBorderClass = 'bg-tertiary';
  } else if (logType.includes('warning')) {
    Icon = TriangleAlert;
    colorClass = 'text-amber-400';
    bgBorderClass = 'bg-amber-400';
  }

  const timeStr = new Date(log.time * 1000).toLocaleTimeString();

  return (
    <div
      onClick={onClick}
      className="relative px-3 py-2 bg-surface-container-high/40 rounded-r-sm group hover:bg-surface-container-high transition-colors border-l-0 cursor-pointer"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${bgBorderClass}`}></div>
      <div className="flex justify-between items-start mb-1 gap-4">
        <span className={`text-[10px] font-bold ${colorClass} uppercase flex items-center gap-1.5 shrink-0`}>
          <Icon className="w-3.5 h-3.5" />
          {typeof log.log_type === 'string' ? log.log_type.toUpperCase() : 'INFO'}
        </span>
        <span className="text-[9px] font-mono text-on-surface-variant font-bold">{timeStr}</span>
      </div>
      <p className="text-[11px] text-on-surface mb-1 font-medium leading-relaxed">{log.description}</p>
      <div className="text-[9px] font-mono text-on-surface-variant/70 italic max-w-full truncate">{log.ip} // {log.device_name}</div>
    </div>
  );
}
