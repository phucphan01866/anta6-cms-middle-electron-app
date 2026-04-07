const express = require('express');
const axios = require('axios');
const { connections } = require('../socketState');
const { notifyStatusToClients, getActiveClients, removeConnection, disconnectClientSocket } = require('../helpers/notify');
const authMiddleware = require('../middleware/auth.middleware');
const { syncDataToTarget } = require('./server.routes');

const router = express.Router();

// Áp dụng middleware cho tất cả các route trong file này
router.use(authMiddleware);


// Ngắt kết nối một client đang kết nối vào server này (theo socketId)
/**
 * @route POST /api/v1/disconnect-client
 * @description Forcefully disconnects a connected socket client by its ID.
 * @body {string} socketId.required - ID of the socket client to disconnect.
 * @returns {object} 200 - { success: true, message: string }
 * @returns {object} 404 - { success: false, message: string } - If socketId is not found.
 */
router.post('/api/v1/disconnect-client', async (req, res) => {
  const { socketId } = req.body;
  if (!socketId) return res.status(400).send({ success: false, message: 'Missing socketId' });

  const result = await disconnectClientSocket(socketId);
  return res.status(result.success ? 200 : 404).send(result);
});


// Đăng ký một target server để forward logs (chỉ lưu metadata, không tạo socket)
/**
 * @route POST /api/v1/create-connection
 * @description Registers a target server for log forwarding and checks its status.
 * @body {string} ip.required - IP address of the target server.
 * @body {number} port.required - Port number of the target server.
 * @body {string} mode - Connection mode (default: 'send').
 * @returns {object} 200 - { success: true, message: string, ip: string, port: number, status: string }
 */
router.post('/api/v1/create-connection', async (req, res) => {
  const { ip, port, mode } = req.body;
  // console.log("create-connection to ", ip, port, mode);
  if (!ip || !port) return res.status(400).send({ success: false, message: 'Missing IP or Port' });

  const url = `http://${ip}:${port}`;
  const existing = connections.find(c => c.url === url);
  if (existing) {
    return res.status(200).send({ success: true, message: 'Already configured', status: existing.status });
  }

  const connMode = mode || 'send';
  let status = 'registered';

  // Kiểm tra target server có online không bằng healthcheck
  try {
    await axios.get(`${url}/healthcheck`, { timeout: 3000 });
    status = 'connected';

    // THỰC HIỆN LOGIN ĐỂ LẤY TOKEN
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@cms.com';
      const adminPass = process.env.ADMIN_PASSWORD || 'admin1234';

      const loginRes = await axios.post(`${url}/api/v1/login`, {
        email: adminEmail,
        password: adminPass
      }, { timeout: 5000 });
      // getClientSockets().emit('test', loginRes);

      console.log(loginRes)

      if (loginRes.data && loginRes.data.success && loginRes.data.data.accessToken) {
        console.log(`[AUTH] Login successful to ${url}`);
        const accessToken = loginRes.data.data.accessToken;
        connections.push({ url, ip, port, mode: connMode, status, server_id: 'PENDING', receivedCount: 0, sentCount: 0, accessToken });

        // Tự động đồng bộ dữ liệu nếu là mode 'send'
        if (connMode === 'send') {
          syncDataToTarget(url, accessToken);
        }
      } else {
        console.warn(`[AUTH_WARN] Login to ${url} failed or returned no token`);
        connections.push({ url, ip, port, mode: connMode, status, server_id: 'PENDING', receivedCount: 0, sentCount: 0 });
      }
    } catch (authErr) {
      console.error(`[AUTH_ERROR] Could not login to ${url}: ${authErr}`);
      // getClientSockets().emit('test', authErr);
      status = 'auth_error';
      removeConnection(url);
    }
  } catch {
    status = 'unreachable';
    connections.push({ url, ip, port, mode: connMode, status, server_id: 'PENDING', receivedCount: 0, sentCount: 0 });
  }
  // getClientSockets().emit('test', connections);
  notifyStatusToClients(url, connMode, status === 'connected' ? 'connected' : 'error');

  return res.status(200).send({ success: true, message: `Registered ${url} (status: ${status})`, ip, port, status });
});


// Xóa connection khỏi danh sách
/**
 * @route POST /api/v1/remove-connection
 * @description Removes a registered connection from the connections list.
 * @body {string} ip.required - IP of the connection to remove.
 * @body {number} port.required - Port of the connection to remove.
 * @returns {object} 200 - { success: true, message: string }
 * @returns {object} 404 - { success: false, message: string } - If connection not found.
 */
router.post('/api/v1/remove-connection', (req, res) => {
  const { ip, port } = req.body;
  if (!ip || !port) return res.status(400).send({ success: false, message: 'Missing IP or Port' });

  const url = `http://${ip}:${port}`;
  const result = removeConnection(url);

  return res.status(result.success ? 200 : 404).send(result);
});

// Lấy danh sách connections (source of truth cho FE)
/**
 * @route GET /api/v1/connections
 * @description Retrieves current connection list (active clients and registered servers).
 * @returns {object} 200 - { sendList: Array, receiveList: Array }
 */
router.get('/api/v1/connections', async (req, res) => {
  // sendList = các client đang kết nối vào server này (FE, nodes cấp dưới)
  const sendList = (await getActiveClients()).map(({ mode, ...rest }) => rest);

  // receiveList = các server đã đăng ký (metadata)
  const receiveList = connections.map(c => ({
    ip: c.ip,
    port: c.port,
    status: c.status,
    server_id: c.server_id || 'PENDING',
    receivedCount: c.receivedCount || 0,
  }));

  res.json({ sendList, receiveList });
});

module.exports = router;
