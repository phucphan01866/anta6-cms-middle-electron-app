import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StatusBar } from './components/StatusBar/StatusBar';
import { LogPopup } from './components/LogPopup';
import { useSocketManager } from './hooks/useSocketManager';
import { Terminal } from 'lucide-react';
// import { Camera } from 'lucide-react'; // Surveillance Grid commented
// import { CameraFeed } from './components/CameraFeed'; // Surveillance Grid commented
import { LogEntry } from './components/LogEntry';
import type { LogData } from './types';
import LoginPage from './components/LoginPage';
import { authApi } from './api/authApi';

// Component bảo vệ Route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!authApi.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function Dashboard() {
  const {
    isConnected,
    logs,
    servers,
    devices,
    systemConfig,
    setSystemConfig,
    sendDictionary,
    receiveDictionary,
    handleAddExternalServer,
    handleRemoveConnection,
    socket
  } = useSocketManager();

  const [selectedLog, setSelectedLog] = useState<LogData | null>(null);

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

  // Surveillance Grid commented — latestCameras disabled
  // const latestCameras = useMemo(() => {
  //   const camMap = new Map<string, LogData>();
  //   logs.forEach(log => {
  //     const key = `${log.ip}-${log.device_ip}`;
  //     if (!camMap.has(key)) {
  //       camMap.set(key, log);
  //     }
  //   });
  //   return Array.from(camMap.values()).slice(0, 6);
  // }, [logs]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-on-surface font-sans selection:bg-primary/30 antialiased">
      <main className="flex-1 grid grid-cols-4 gap-0 overflow-hidden">
        {/* Main Section */}
        <div className="col-span-3 grid grid-rows-[1fr_0fr] overflow-hidden bg-background h-full border-r border-outline-variant/20">

          <div className="flex flex-col overflow-hidden h-full">
            {/* ── Surveillance Grid (Temporarily Commented) ──
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
            ── End Surveillance Grid ── */}
            <div className="shrink-0">
              <StatusBar
                socket={socket}
                isConnected={isConnected}
                systemConfig={systemConfig}
                onSaveSystemConfig={(config) => { setSystemConfig(config) }}
                sendDictionary={sendDictionary}
                receiveDictionary={receiveDictionary}
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
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-surface-container-low/10">
            {logs.length > 0 ? (
              <div className="flex flex-col">
                {logs.map((log, idx) => (
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
