import { useEffect, useState, useCallback } from 'react';
import { socket, updateSocketUrlAsync } from '../socket';
import type { LogData, SystemConnection, SystemConfig, ServerData, DeviceData } from '../types';
import apiClient from '../api/apiClient';


export function useSocketManager() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  useEffect(() => {
    setIsConnected(socket.connected);
  }, [socket.connected]);

  const [logs, setLogs] = useState<LogData[]>([]);
  const [servers, setServers] = useState<Record<string, ServerData>>({});
  const [devices, setDevices] = useState<Record<string, DeviceData>>({});
  const [systemConfig, setSystemConfigState] = useState<SystemConfig>({
    fe: {
      ip: import.meta.env.VITE_HOST,
      port: import.meta.env.VITE_PORT
    },
    be: {
      ip: localStorage.getItem('BE_HOST') || import.meta.env.VITE_BE_HOST || 'localhost',
      port: localStorage.getItem('BE_PORT') || import.meta.env.VITE_BE_PORT || '5050'
    }
  });

  const setSystemConfig = useCallback((configOrUpdater: SystemConfig | ((prev: SystemConfig) => SystemConfig)) => {
    setSystemConfigState(prev => {
      const newConfig = typeof configOrUpdater === 'function' ? configOrUpdater(prev) : configOrUpdater;
      localStorage.setItem('BE_HOST', newConfig.be.ip);
      localStorage.setItem('BE_PORT', newConfig.be.port);
      return newConfig;
    });
  }, []);

  const [sendDictionary, setSendDictionary] = useState<SystemConnection[]>([]);
  const [receiveDictionary, setReceiveDictionary] = useState<SystemConnection[]>([]);

  useEffect(() => {
    const newBeURL = `http://${systemConfig.be.ip}:${systemConfig.be.port}`;
    const currentURI = (socket.io as any).uri;

    if (currentURI !== newBeURL) {
      console.log(`[SOCKET_RECONFIG] Target shifted to: ${newBeURL}. Initiating reconnection...`);
      updateSocketUrlAsync(newBeURL).then((success) => {
        setIsConnected(socket.connected);
        if (success) {
          console.log(`[SOCKET_SUCCESS] Link established with: ${newBeURL}`);
        } else {
          console.error(`[SOCKET_ERROR] Handshake failed with: ${newBeURL}`);
        }
      });
    }
  }, [systemConfig.be.ip, systemConfig.be.port]);

  // ─── Fetch connections from BE (source of truth) ────────────────────────────
  const fetchConnections = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/v1/connections');

      setSendDictionary(data.sendList || []);
      setReceiveDictionary(data.receiveList || []);
      console.log('[FETCH_CONNECTIONS] Synced from BE:', data);
    } catch (err) {
      console.error('[FETCH_CONNECTIONS] Failed:', err);
    }
  }, [systemConfig.be.ip, systemConfig.be.port]);

  // Fetch on mount + on socket reconnect
  useEffect(() => {
    fetchConnections();
    socket.on('connect', fetchConnections);
    return () => { socket.off('connect', fetchConnections); };
  }, [fetchConnections]);

  // ─── Delta updates via socket events ────────────────────────────────────────

  const updateReceiveServer = (raw: any, isLogEvent = false) => {
    const isDisconnectOrError = !!raw.url;
    let serverId = '';
    let sourceIp = '';

    if (isDisconnectOrError) {
      const parsed = new URL(raw.url);
      sourceIp = parsed.hostname;
    } else {
      serverId = (raw.body?.server?.server_id ?? '') + '-' + (raw.body?.server?.serial ?? '');
      sourceIp = (raw.ip ?? '').replace('::ffff:', '');
    }

    setReceiveDictionary(prev => {
      let serverIdx = -1;

      if (isDisconnectOrError) {
        serverIdx = prev.findIndex(s => s.ip === sourceIp);
      } else {
        serverIdx = prev.findIndex(s => s.ip === sourceIp && s.server_id === serverId);
        if (serverIdx === -1) {
          serverIdx = prev.findIndex(s => s.ip === sourceIp && (s.server_id === 'PENDING' || !s.server_id));
        }
      }

      if (serverIdx === -1) {
        if (isDisconnectOrError) return prev;
        // Entry không tồn tại — tạo mới (trường hợp log đến trước khi fetch kịp)
        const newServer: SystemConnection = {
          server_id: serverId,
          ip: sourceIp,
          port: '5588',
          status: 'auto - connected',
          receivedCount: isLogEvent ? 1 : 0
        };
        return [...prev, newServer];
      }

      const updatedServers = [...prev];
      const server = { ...updatedServers[serverIdx] };

      if (!isDisconnectOrError) {
        if (!server.server_id || server.server_id === 'PENDING') {
          server.server_id = serverId;
        }
      }

      if (raw.status) {
        server.status = raw.status;
      } else if (!isDisconnectOrError && !server.status) {
        server.status = 'auto - connected';
      }

      if (isLogEvent) {
        server.receivedCount = (server.receivedCount || 0) + 1;
      }

      updatedServers[serverIdx] = server;
      return updatedServers;
    });
  };

  const updateSendServers = (ip: string, port: string, status: any) => {
    setSendDictionary(prev => {
      const idx = prev.findIndex(s => s.ip === ip && s.port === port);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], status };
        return updated;
      }
      return [...prev, { ip, port, status }];
    });
  };

  const handleAddExternalServer = async (ip: string, port: string, mode: 'receive' | 'send') => {
    console.log(`[SYNC_INIT] Requesting local BE to connect to http://${ip}:${port} (${mode})`);

    // GỌI ĐẾN BE CỦA MÌNH ĐỂ THỰC HIỆN KẾT NỐI ĐẾN SERVER ĐÍCH
    apiClient.post(`/api/v1/create-connection`, { ip, port, mode })
      .then((res: any) => {
        console.log(`[SYNC_SUCCESS] Backend response:`, res.data);
        // Sau khi tạo connection thành công → fetch lại full list từ BE
        fetchConnections();
      })

      .catch((err: any) => console.error(`[SYNC_ERROR] Failed to initiate sync:`, err));

  };

  const handleRemoveConnection = useCallback((ip: string, port: string, mode: 'receive' | 'send') => {
    if (mode === 'send') {
      setSendDictionary(prev => prev.filter(s => !(s.ip === ip && s.port === port)));
    } else {
      setReceiveDictionary(prev => prev.filter(s => !(s.ip === ip && s.port === port)));
    }
  }, []);

  useEffect(() => {
    function onConnectedExternalServer(raw: any) {
      const { url, type, status } = raw;
      const parsed = new URL(url);
      if (type === 'send') {
        updateSendServers(parsed.hostname, parsed.port, status);
      } else {
        setReceiveDictionary(prev => {
          const idx = prev.findIndex(s => s.ip === parsed.hostname);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], status };
            return updated;
          }
          return [...prev, {
            server_id: 'UNKNOWN',
            ip: parsed.hostname,
            port: parsed.port || '5050',
            status: status
          }];
        });
      }
    }

    function onLogDispatched() {
      setSendDictionary(prev => prev.map(s => ({
        ...s,
        sentCount: (s.sentCount || 0) + 1
      })));
    }

    function onUpdateClients(clients: SystemConnection[]) {
      setSendDictionary(prev => {
        const pendings = prev.filter(s => s.status === 'connecting' || s.server_id === 'PENDING');

        const merged = clients.map(client => {
          const existing = prev.find(s => s.socketId === client.socketId || (s.ip === client.ip && s.port === client.port));
          return {
            ...client,
            sentCount: client.sentCount !== undefined ? client.sentCount : (existing ? (existing.sentCount || 0) : 0)
          };
        });

        pendings.forEach(p => {
          if (!merged.find(m => m.ip === p.ip)) {
            merged.push({ ...p, sentCount: p.sentCount || 0 });
          }
        });

        return merged;
      });
    }

    function onDisconnectedExternalServer(raw: any) {
      const { url, type, status } = raw;
      if (type === 'send') {
        const parsed = new URL(url);
        updateSendServers(parsed.hostname, parsed.port, status);
      } else {
        updateReceiveServer(raw);
      }
    }

    function onErrorExternalServer(raw: any) {
      const { url, type, status } = raw;
      if (type === 'send') {
        const parsed = new URL(url);
        updateSendServers(parsed.hostname, parsed.port, status);
      } else {
        updateReceiveServer(raw);
      }
    }

    const onReceiveLog = (raw: any) => {
      const serverData = raw.body?.server || { server_id: 'UNKNOWN', serial: 'UNKNOWN' };
      const timeNumber = raw.timestamp ? new Date(raw.timestamp).getTime() / 1000 : Date.now() / 1000;

      const data = raw?.data || raw;

      const newLog: LogData = {
        time: Math.floor(timeNumber),
        device_index: data.body?.device_index || 0,
        device_ip: data.body?.device_ip || '127.0.0.1',
        device_type: data.body?.device_type || 'camera',
        device_name: data.body?.device_name || 'Channel',
        log_type: data.body?.log_type || 'event.info',
        description: data.body?.description || 'Event received',
        snapshot: data.body?.snapshot,
        server: serverData,
        ip: data.ip,
        raw: raw,
        cameraIp: data.body?.device_ip || 'SYSTEM'
      };

      if (data.ip && data.ip !== '127.0.0.1' && data.ip !== '::1') {
        updateReceiveServer(data, true);
      }
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    };

    const onReceiveServer = (raw: any) => {
      console.log('[SOCKET] receive-server:', raw);
      if (raw.allServers) {
        setServers(raw.allServers);
      } else if (raw.serverId && raw.data) {
        setServers(prev => ({ ...prev, [raw.serverId]: raw.data }));
      }
    };

    const onReceiveDevices = (raw: any) => {
      console.log('[SOCKET] receive-devices:', raw);
      if (raw.allDevices) {
        setDevices(raw.allDevices);
      } else if (raw.serverId && raw.data) {
        setDevices(prev => ({ ...prev, [raw.serverId]: raw.data }));
      }
    };

    socket.on('external-connect', onConnectedExternalServer);
    socket.on('external-disconnect', onDisconnectedExternalServer);
    socket.on('external-err-connect', onErrorExternalServer);
    socket.on('receive-log', onReceiveLog);
    socket.on('update-clients', onUpdateClients);
    socket.on('log-dispatched', onLogDispatched);
    socket.on('receive-server', onReceiveServer);
    socket.on('receive-devices', onReceiveDevices);

    return () => {
      socket.off('external-connect', onConnectedExternalServer);
      socket.off('external-disconnect', onDisconnectedExternalServer);
      socket.off('external-err-connect', onErrorExternalServer);
      socket.off('receive-log', onReceiveLog);
      socket.off('update-clients', onUpdateClients);
      socket.off('log-dispatched', onLogDispatched);
      socket.off('receive-server', onReceiveServer);
      socket.off('receive-devices', onReceiveDevices);
    };
  }, []);

  return {
    socket,
    isConnected,
    logs,
    servers,
    devices,
    systemConfig,
    setSystemConfig,
    sendDictionary,
    receiveDictionary,
    handleAddExternalServer,
    handleRemoveConnection
  };
}
