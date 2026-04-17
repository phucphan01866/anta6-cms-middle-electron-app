import { useEffect, useState, useCallback } from 'react';
import { socket, updateSocketUrlAsync } from '../socket';
import type { LogData, SystemConnection, SystemConfig, ServerData, DeviceData } from '../types';
import apiClient from '../api/apiClient';
import axios from 'axios';

const env = {
  MAX_LOGS_LIST: Number(import.meta.env.VITE_MAX_LOGS_LIST) || 5000
};


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

  const [sendServers, setSendServers] = useState<SystemConnection[]>([]);
  const [receiveServers, setReceiveServers] = useState<SystemConnection[]>([]);

  useEffect(() => {
    const newBeURL = `http://${systemConfig.be.ip}:${systemConfig.be.port}`;
    const currentSocketURI = (socket.io as any).uri;

    // Khác nhau -> update socket
    if (currentSocketURI !== newBeURL) {
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
      setSendServers(data.sendList || []);
      setReceiveServers(data.receiveList || []);
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

    setReceiveServers(prev => {
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
          status: 'connected',
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
        server.status = 'connected';
      }

      if (isLogEvent) {
        server.receivedCount = (server.receivedCount || 0) + 1;
      }

      updatedServers[serverIdx] = server;
      return updatedServers;
    });
  };

  const updateSendServers = (ip: string, port: string, status: 'connecting' | 'connected' | 'disconnected') => {
    setSendServers(prev => {
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

    if (mode === 'send') {
      // GỌI ĐẾN BE CỦA MÌNH ĐỂ THỰC HIỆN KẾT NỐI ĐẾN SERVER ĐÍCH
      apiClient.post(`/api/v1/create-connection`, { ip, port, mode })
        .then((res: any) => {
          console.log(`[SYNC_SUCCESS] Backend response:`, res.data);
          // Sau khi tạo connection thành công → fetch lại full list từ BE
          fetchConnections();
        })
        .catch((err: any) => console.error(`[SYNC_ERROR] Failed to initiate sync:`, err));
    } else if (mode === 'receive') {
      // GỌI ĐẾN BE CỦA IP:PORT ĐỂ ĐÍCH KẾT NỐI ĐẾN SERVER HIỆN TẠI
      axios.post(`http://${ip}:${port}/api/v1/create-connection`,
        { ip: systemConfig.be.ip, port: systemConfig.be.port, mode: 'send' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      )
        .then((res: any) => {
          console.log(`[SYNC_SUCCESS] Target backend response:`, res.data);
          // Fetch mồi lại list, hệ thống sẽ tự cập nhật khi Data log đổ về
          fetchConnections();
        })
        .catch((err: any) => console.error(`[SYNC_ERROR] Failed to initiate sync on target:`, err));
    }
  };

  const handleRemoveConnection = useCallback((ip: string, port: string, mode: 'receive' | 'send') => {
    if (mode === 'send') {
      setSendServers(prev => prev.filter(s => !(s.ip === ip && s.port === port)));
    } else {
      setReceiveServers(prev => prev.filter(s => !(s.ip === ip && s.port === port)));
    }
  }, []);

  useEffect(() => {
    function onConnectingExternalServer(raw: any) {
      const { url } = raw;
      const parsed = new URL(url);
      updateSendServers(parsed.hostname, parsed.port, 'connecting');
    }

    function onConnectedExternalServer(raw: any) {
      const { url } = raw;
      const parsed = new URL(url);
      updateSendServers(parsed.hostname, parsed.port, 'connected');
    }

    function onLogDispatched(raw: any) {
      const { sentServerList } = raw;
      setSendServers(prev => prev.map(s => {
        if (sentServerList.includes('http://' + s.ip + ':' + s.port)) {
          return {
            ...s,
            sentCount: (s.sentCount || 0) + 1
          };
        }
        return s;
      }));
    }

    function onUpdateConnections(data: { sendList: SystemConnection[], receiveList: SystemConnection[] }) {
      console.log('[SOCKET] update-connections:', data);

      // Merge để không làm mất 'sentCount' và 'status' hiện tại
      setSendServers(prev => {
        return (data.sendList || []).map(newServer => {
          const existing = prev.find(p => p.ip === newServer.ip && p.port === newServer.port);
          return {
            ...newServer,
            sentCount: existing ? existing.sentCount : 0,
            status: existing && newServer.status === 'connected' ? existing.status : newServer.status
          };
        });
      });

      setReceiveServers(data.receiveList || []);
    }

    function onUpdateClients(clients: SystemConnection[]) {
      // Giờ đây update-client chỉ dùng để hiển thị các client đang kết nối VÀO BE (Active Monitoring)
      // Không ghi đè lên sendServers (Targets) nữa
    }

    function onDisconnectedExternalServer(raw: any) {
      const { url, type } = raw;
      if (type === 'send' || !type) {
        const parsed = new URL(url);
        updateSendServers(parsed.hostname, parsed.port, 'disconnected');
      } else {
        updateReceiveServer(raw);
      }
    }

    function onErrorExternalServer(raw: any) {
      // 'error' event is legacy — treat as disconnected
      const { url, type } = raw;
      if (type === 'send' || !type) {
        const parsed = new URL(url);
        updateSendServers(parsed.hostname, parsed.port, 'disconnected');
      } else {
        updateReceiveServer(raw);
      }
    }

    const onReceiveLog = (raw: any) => {
      const serverData = raw.body?.server || { server_id: 'UNKNOWN', serial: 'UNKNOWN' };
      const timeNumber = raw.timestamp ? new Date(raw.timestamp).getTime() / 1000 : Date.now() / 1000;

      const data = raw?.data || raw;

      const newLog: LogData = {
        id: crypto.randomUUID(),
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

      setLogs(prev => [newLog, ...prev].slice(0, env.MAX_LOGS_LIST));
    };

    // Cập nhật trực tiếp vào, thêm/sửa/xóa đã nằm ở server BE
    const onReceiveServerInformation = (raw: any) => {
      console.log('[SOCKET] receive-server-information:', raw);
      if (raw.allServers) {
        setServers(raw.allServers);
      } else if (raw.serverId && raw.data) {
        setServers(prev => ({ ...prev, [raw.serverId]: raw.data }));
      }
    };

    const onReceiveDevicesInformation = (raw: any) => {
      console.log('[SOCKET] receive-devices-information:', raw);
      if (raw.allDevices) {
        setDevices(raw.allDevices);
      } else if (raw.serverId && raw.data) {
        setDevices(prev => ({ ...prev, [raw.serverId]: raw.data }));
      }
    };

    // ─── Connectivity Monitor Events ──────────────────────────────────────────
    const onServerConnectionStatus = (raw: { serverId: string; connectionStatus: string; serverName?: string; type?: string }) => {
      console.log('[SOCKET] server-connection-status:', raw);
      setServers(prev => {
        const existing = prev[raw.serverId];
        if (!existing) return prev;
        return {
          ...prev,
          [raw.serverId]: {
            ...existing,
            connectionStatus: raw.connectionStatus as 'connected' | 'disconnected',
          }
        };
      });
    };

    const onDeviceConnectionStatus = (raw: { serverId: string; deviceIndex: number; connectionStatus: string }) => {
      console.log('[SOCKET] device-connection-status:', raw);
      setDevices(prev => {
        const existing = prev[raw.serverId];
        if (!existing) return prev;
        const updatedDevices = existing.devices.map(d =>
          String(d.index) === String(raw.deviceIndex)
            ? { ...d, connectionStatus: raw.connectionStatus as 'connected' | 'disconnected' }
            : d
        );
        return {
          ...prev,
          [raw.serverId]: { ...existing, devices: updatedDevices }
        };
      });
    };

    socket.on('external-server-connecting', onConnectingExternalServer);
    socket.on('external-server-connect', onConnectedExternalServer);
    socket.on('external-server-disconnect', onDisconnectedExternalServer);
    socket.on('external-server-err-connect', onErrorExternalServer);
    socket.on('receive-log', onReceiveLog);
    // update client hiện đang không dùng
    socket.on('update-client', onUpdateClients);
    socket.on('log-dispatched', onLogDispatched);
    socket.on('receive-server-information', onReceiveServerInformation);
    socket.on('receive-devices-information', onReceiveDevicesInformation);
    socket.on('update-connections', onUpdateConnections);
    socket.on('server-connection-status', onServerConnectionStatus);
    socket.on('device-connection-status', onDeviceConnectionStatus);
    socket.on('test', (data) => {
      // console.log('test data', data)
      alert('we got new url: ' + data);
    })

    return () => {
      socket.off('external-server-connecting', onConnectingExternalServer);
      socket.off('external-server-connect', onConnectedExternalServer);
      socket.off('external-server-disconnect', onDisconnectedExternalServer);
      socket.off('external-server-err-connect', onErrorExternalServer);
      socket.off('receive-log', onReceiveLog);
      socket.off('update-client', onUpdateClients);
      socket.off('log-dispatched', onLogDispatched);
      socket.off('receive-server-information', onReceiveServerInformation);
      socket.off('receive-devices-information', onReceiveDevicesInformation);
      socket.off('update-connections', onUpdateConnections);
      socket.off('server-connection-status', onServerConnectionStatus);
      socket.off('device-connection-status', onDeviceConnectionStatus);
      socket.off('test', (data) => {
        console.log('test data', data)
      })
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
    sendServers,
    receiveServers,
    handleAddExternalServer,
    handleRemoveConnection
  };
}
