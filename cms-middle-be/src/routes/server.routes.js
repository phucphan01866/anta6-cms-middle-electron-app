const express = require('express');
const axios = require('axios');
const { getClientSockets, servers, devices } = require('../socketState');
const { getCMSBackendURL } = require('../config');

const router = express.Router();

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

  return res.status(200).send({ success: true });
});

module.exports = router;
