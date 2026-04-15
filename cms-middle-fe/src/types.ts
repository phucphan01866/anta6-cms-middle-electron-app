export interface SystemConnection {
  ip: string;
  port: string;
  status?: 'connecting' | 'connected' | 'disconnected';
  server_id?: string;
  sentCount?: number;
  receivedCount?: number;
  socketId?: string;
}

export interface SystemConfig {
  fe: { ip: string; port: string };
  be: { ip: string; port: string };
}

export interface LogData {
  id?: string;
  time: number;
  device_index: number;
  device_ip: string;
  device_type: string;
  device_name: string;
  log_type: string;
  description: string;
  snapshot?: string;
  server: {
    server_id: string;
    serial: string;
  };
  ip: string;
  raw?: any;
  cameraIp?: string;
}

export interface AddExternalServerProps {
  onSave: (ip: string, port: string, mode: 'receive' | 'send') => void;
  onClose: () => void;
  initialIp?: string;
  initialPort?: string;
  initialMode?: 'receive' | 'send';
}

export interface ServerData {
  id: string;
  serial: string;
  server_ip: string;
  server_name: string;
  version: string;
  location: string;
  day: number;
  month: number;
  year: number;
  sender_ip?: string;
  lastSeen?: string;
}

export interface DeviceItem {
  name: string;
  ip: string;
  type: string;
  index: number;
}

export interface DeviceData {
  server: { serial: string; server_id: string };
  devices: DeviceItem[];
  sender_ip?: string;
  lastSeen?: string;
}
