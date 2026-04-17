const express = require('express');
const axios = require('axios');
const { getClientSockets, servers, devices, connections } = require('../socketState');
const { getCMSBackendURL } = require('../config');
const { notifyStatusToClients } = require('../helpers/notify');
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
      if (conn.status !== 'connected') {
        conn.status = 'connected';
        notifyStatusToClients(conn.url, conn.mode, 'connected');
      }
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
            if (conn.status !== 'connected') {
              conn.status = 'connected';
              notifyStatusToClients(conn.url, conn.mode, 'connected');
            }
          } else {
            conn.status = 'disconnected';
            notifyStatusToClients(conn.url, conn.mode, 'disconnected');
          }
        } catch (loginErr) {
          console.error(`[FORWARD_AUTH_RETRY_FAIL] ${conn.url}: ${loginErr.message}`);
          conn.status = 'disconnected';
          notifyStatusToClients(conn.url, conn.mode, 'disconnected');
        }
      } else {
        console.error(`[FORWARD_FAIL] ${endpoint} to ${conn.url}: ${err.message}`);
        if (conn.status !== 'disconnected') {
          conn.status = 'disconnected';
          notifyStatusToClients(conn.url, conn.mode, 'disconnected');
        }
      }
    }
  }
}

// ─── Nhận thông tin server từ SVMS hoặc qua Sync ──────────────────────────────
/**
 * @route POST /api/v1/server
 * @description Receives server(s) info from SVMS (or another Middle BE).
 * Supports both single Object and Array.
 */
router.post('/api/v1/server', async (req, res) => {
  const clientSockets = getClientSockets();
  const senderIp = (req.ip || '').replace('::ffff:', '');
  const dataArr = Array.isArray(req.body) ? req.body : [req.body];

  for (const serverData of dataArr) {
    if (!serverData) continue;
    const serverId = serverData.id || serverData.serial || senderIp;
    servers.set(serverId, {
      ...serverData,
      svms_ipv4_ip: serverData.svms_ipv4_ip || senderIp,
      sender_ip: senderIp,
      lastSeen: new Date().toISOString()
    });
    // console.log(`[SERVER_INFO] Saved server from ${senderIp}: ${serverData.server_name || serverId}`);
  }

  // Emit toàn bộ servers hiện tại tới FE một lần thay vì nhiều lần
  clientSockets.emit('receive-server-information', {
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
  forwardToSendTargets('/api/v1/server', {
    ...req.body,
    svms_ipv4_ip: req.body.svms_ipv4_ip || senderIp,
  });
  return res.status(200).send({ success: true, count: dataArr.length });
});

// ─── Nhận danh sách devices từ SVMS hoặc qua Sync ───────────────────────────
/**
 * @route POST /api/v1/devices
 * @description Receives device lists from SVMS (or another Middle BE).
 * Supports both single Object and Array.
 */
router.post('/api/v1/devices', async (req, res) => {
  const clientSockets = getClientSockets();
  const senderIp = (req.ip || '').replace('::ffff:', '');
  const dataArr = Array.isArray(req.body) ? req.body : [req.body];

  for (const item of dataArr) {
    if (!item) continue;
    const { server, devices: deviceList } = item;
    const serverId = server?.server_id || server?.serial || senderIp;

    devices.set(serverId, {
      server,
      devices: deviceList || [],
      sender_ip: senderIp,
      lastSeen: new Date().toISOString()
    });
    // console.log(`[DEVICES_INFO] Saved ${(deviceList || []).length} devices for ${serverId}`);
  }

  // Emit toàn bộ devices hiện tại tới FE một lần
  clientSockets.emit('receive-devices-information', {
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
  forwardToSendTargets('/api/v1/devices', req.body);
  return res.status(200).send({ success: true, count: dataArr.length });
});


/**
 * Gửi toàn bộ servers và devices hiện có sang một target server cụ thể.
 * Được gọi sau khi healthcheck thành công ở create-connection.
 * @param {string} url - URL của target server (ví dụ: http://192.168.1.66:5050)
 * @param {string} accessToken - Bearer token để xác thực với target
 */
async function syncDataToTarget(url, accessToken) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'x-sync-forwarded': 'true' // Đánh dấu đây là dữ liệu sync ngang hàng để chặn loop
  };

  // 1. Gửi TẤT CẢ servers trong 1 array
  if (servers.size > 0) {
    const serversArray = Array.from(servers.values());
    try {
      await axios.post(`${url}/api/v1/server`, serversArray, { headers, timeout: 5000 });
      console.log(`[SYNC_DATA] Sent ${serversArray.length} servers inside 1 array to ${url}`);
    } catch (err) {
      console.error(`[SYNC_DATA_ERR] Failed to send servers array to ${url}: ${err.message}`);
    }
  }

  // 2. Gửi TẤT CẢ devices trong 1 array
  if (devices.size > 0) {
    const devicesArray = Array.from(devices.values());
    try {
      await axios.post(`${url}/api/v1/devices`, devicesArray, { headers, timeout: 5000 });
      console.log(`[SYNC_DATA] Sent ${devicesArray.length} device packages inside 1 array to ${url}`);
    } catch (err) {
      console.error(`[SYNC_DATA_ERR] Failed to send devices array to ${url}: ${err.message}`);
    }
  }
}

module.exports = { router, syncDataToTarget };
