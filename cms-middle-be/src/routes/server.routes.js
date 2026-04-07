const express = require('express');
const axios = require('axios');
const { getClientSockets, servers, devices, connections } = require('../socketState');
const { getCMSBackendURL } = require('../config');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Hàm forward dữ liệu (server/devices) tới tất cả target server có mode 'send'.
 * Có retry logic khi gặp lỗi 401 (giống forwardWithRetry trong logs.routes).
 */
async function forwardToSendTargets(endpoint, data) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cms.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin1234';
  const sendTargets = connections.filter(c => c.mode === 'send');

  for (const conn of sendTargets) {
    const sendRequest = (token) =>
      axios.post(`${conn.url}${endpoint}`, data, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });

    try {
      await sendRequest(conn.accessToken);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        try {
          const loginRes = await axios.post(`${conn.url}/api/v1/login`, {
            email: adminEmail,
            password: adminPass
          }, { timeout: 5000 });

          if (loginRes.data && loginRes.data.success && loginRes.data.data.accessToken) {
            conn.accessToken = loginRes.data.data.accessToken;
            await sendRequest(conn.accessToken);
          }
        } catch (loginErr) {
          console.error(`[FORWARD_AUTH_RETRY_FAIL] ${conn.url}: ${loginErr.message}`);
        }
      } else {
        console.error(`[FORWARD_FAIL] ${endpoint} to ${conn.url}: ${err.message}`);
      }
    }
  }
}

// ─── Nhận thông tin server từ SVMS ───────────────────────────────────────────
/**
 * @route POST /api/v1/server
 * @description Receives server info from SVMS, stores in-memory, emits to FE, forwards to CMS BE.
 */
router.post('/api/v1/server', async (req, res) => {
  const clientSockets = getClientSockets();
  const serverData = req.body;
  const senderIp = (req.ip || '').replace('::ffff:', '');

  // Lưu in-memory theo server id
  const serverId = serverData.id || serverData.serial || senderIp;
  servers.set(serverId, {
    ...serverData,
    sender_ip: senderIp,
    lastSeen: new Date().toISOString()
  });

  console.log(`[SERVER_INFO] Received from ${senderIp}: ${serverData.server_name || serverId}`);

  // Emit tới FE
  clientSockets.emit('receive-server', {
    serverId,
    data: servers.get(serverId),
    allServers: Object.fromEntries(servers)
  });

  // Forward tới CMS BE (nếu có)
  const CMS_BE_URL = getCMSBackendURL();
  if (CMS_BE_URL) {
    try {
      await axios.post(`${CMS_BE_URL}/api/v1/server`, req.body, { timeout: 5000 });
    } catch (err) {
      console.error(`[SERVER_FORWARD_FAIL] ${err.message}`);
    }
  }

  // Forward tới tất cả target server có mode 'send'
  forwardToSendTargets('/api/v1/server', serverData);

  return res.status(200).send({ success: true });
});

// ─── Nhận danh sách devices từ SVMS ─────────────────────────────────────────
/**
 * @route POST /api/v1/devices
 * @description Receives device list from SVMS, stores in-memory, emits to FE, forwards to CMS BE.
 */
router.post('/api/v1/devices', async (req, res) => {
  const clientSockets = getClientSockets();
  const { server, devices: deviceList } = req.body;
  const senderIp = (req.ip || '').replace('::ffff:', '');

  // Lưu in-memory theo server_id
  const serverId = server?.server_id || server?.serial || senderIp;
  devices.set(serverId, {
    server,
    devices: deviceList || [],
    sender_ip: senderIp,
    lastSeen: new Date().toISOString()
  });

  console.log(`[DEVICES_INFO] Received ${(deviceList || []).length} devices from ${serverId}`);

  // Emit tới FE
  clientSockets.emit('receive-devices', {
    serverId,
    data: devices.get(serverId),
    allDevices: Object.fromEntries(devices)
  });

  // Forward tới CMS BE (nếu có)
  const CMS_BE_URL = getCMSBackendURL();
  if (CMS_BE_URL) {
    try {
      await axios.post(`${CMS_BE_URL}/api/v1/devices`, req.body, { timeout: 5000 });
    } catch (err) {
      console.error(`[DEVICES_FORWARD_FAIL] ${err.message}`);
    }
  }

  // Forward tới tất cả target server có mode 'send'
  forwardToSendTargets('/api/v1/devices', req.body);

  return res.status(200).send({ success: true });
});

// ─── [SYNC] Nhận server data từ Middle khác ──────────────────────────────────
/**
 * @route POST /api/v1/sync/server
 * @description Nhận server info được sync từ một Middle server khác.
 * Chỉ lưu in-memory và emit lên FE. KHÔNG forward tiếp để tránh loop.
 */
router.post('/api/v1/sync/server', authMiddleware, (req, res) => {
  const clientSockets = getClientSockets();
  const serverData = req.body;
  const senderIp = (req.ip || '').replace('::ffff:', '');
  console.log('synced server')
  const serverId = serverData.id || serverData.serial || senderIp;
  servers.set(serverId, {
    ...serverData,
    sender_ip: senderIp,
    lastSeen: new Date().toISOString()
  });

  console.log(`[SYNC_RECV] Server '${serverData.server_name || serverId}' synced from ${senderIp}`);

  clientSockets.emit('receive-server', {
    serverId,
    data: servers.get(serverId),
    allServers: Object.fromEntries(servers)
  });

  return res.status(200).send({ success: true });
});

// ─── [SYNC] Nhận devices data từ Middle khác ─────────────────────────────────
/**
 * @route POST /api/v1/sync/devices
 * @description Nhận device list được sync từ một Middle server khác.
 * Chỉ lưu in-memory và emit lên FE. KHÔNG forward tiếp để tránh loop.
 */
router.post('/api/v1/sync/devices', authMiddleware, (req, res) => {
  const clientSockets = getClientSockets();
  const { server, devices: deviceList } = req.body;
  const senderIp = (req.ip || '').replace('::ffff:', '');
  console.log('synced devices')
  const serverId = server?.server_id || server?.serial || senderIp;
  devices.set(serverId, {
    server,
    devices: deviceList || [],
    sender_ip: senderIp,
    lastSeen: new Date().toISOString()
  });

  console.log(`[SYNC_RECV] ${(deviceList || []).length} devices for '${serverId}' synced from ${senderIp}`);

  clientSockets.emit('receive-devices', {
    serverId,
    data: devices.get(serverId),
    allDevices: Object.fromEntries(devices)
  });

  return res.status(200).send({ success: true });
});

/**
 * Gửi toàn bộ servers và devices hiện có sang một target server cụ thể.
 * Được gọi sau khi healthcheck thành công ở create-connection.
 * @param {string} url - URL của target server (ví dụ: http://192.168.1.66:5050)
 * @param {string} accessToken - Bearer token để xác thực với target
 */
async function syncDataToTarget(url, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  // 1. Gửi danh sách server
  for (const [id, serverData] of servers.entries()) {
    try {
      await axios.post(`${url}/api/v1/sync/server`, serverData, { headers, timeout: 5000 });
      console.log(`[SYNC_DATA] Sent server ${id} to ${url}`);
    } catch (err) {
      console.error(`[SYNC_DATA_ERR] Failed to send server ${id} to ${url}: ${err.message}`);
    }
  }

  // 2. Gửi danh sách devices
  for (const [id, devicesData] of devices.entries()) {
    try {
      await axios.post(`${url}/api/v1/sync/devices`, devicesData, { headers, timeout: 5000 });
      console.log(`[SYNC_DATA] Sent devices for server ${id} to ${url}`);
    } catch (err) {
      console.error(`[SYNC_DATA_ERR] Failed to send devices for server ${id} to ${url}: ${err.message}`);
    }
  }
}

module.exports = { router, syncDataToTarget };
