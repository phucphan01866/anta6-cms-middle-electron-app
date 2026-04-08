const express = require('express');
const axios = require('axios');
const { getClientSockets, connections } = require('../socketState');
const { notifyStatusToClients } = require('../helpers/notify');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Hàm hỗ trợ re-login và retry nếu gặp 401
 */
async function forwardWithRetry(conn, logData) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cms.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin1234';



  const sendRequest = (token) => {
    return axios.post(`${conn.url}/api/v1/logs`, logData, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000
    });
  };

  try {
    // Thử gửi log với token hiện có
    await sendRequest(conn.accessToken);
    return true;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      console.log(`[AUTH_RETRY] Token expired for ${conn.url}, attempting re-login...`);
      try {
        const loginRes = await axios.post(`${conn.url}/api/v1/login`, {
          email: adminEmail,
          password: adminPass
        }, { timeout: 5000 });


        if (loginRes.data && loginRes.data.success && loginRes.data.data.accessToken) {
          conn.accessToken = loginRes.data.data.accessToken;
          console.log(`[AUTH_RETRY] Re-login successful for ${conn.url}`);
          // Thử lại lần cuối
          await sendRequest(conn.accessToken);
          return true;
        }
      } catch (loginErr) {
        console.error(`[AUTH_RETRY_FAIL] Could not re-login to ${conn.url}: ${loginErr.message}`);
      }
    }
    throw err; // Ném lỗi gốc nếu không phải 401 hoặc retry thất bại
  }
}

// ─── Nhận log từ nguồn gốc (Camera, VMS, etc.) ──────────────────────────────
/**
 * @route POST /api/v1/logs
 * @description Receives logs from sources, broadcasts to FE clients, and forwards to registered target servers.
 */
router.post('/api/v1/logs', async (req, res) => {
  console.log('received requets from :', req.originalUrl)

  const clientSockets = getClientSockets();

  if (req.body && !req.body.sender_ip) {
    req.body.sender_ip = (req.socket?.remoteAddress || req.ip || '').replace('::ffff:', '');
  }

  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    originalUrl: req.originalUrl,
    statusCode: res.statusCode,
    ip: req.ip,
    body: req.body,
  };

  // 1. Phát dữ liệu cho các Client của mình (Frontend) qua Socket.IO
  clientSockets.emit('receive-log', logData);
  clientSockets.emit('log-dispatched', { timestamp: logData.timestamp });

  // Track receivedCount và server_id
  const senderIp = (req.ip || '').replace('::ffff:', '');
  connections.forEach(entry => {
    if (entry.ip === senderIp) {
      entry.receivedCount = (entry.receivedCount || 0) + 1;
      if ((!entry.server_id || entry.server_id === 'PENDING') && req.body?.server?.server_id) {
        entry.server_id = req.body.server.server_id + '-' + (req.body.server.serial || '');
      }
    }
  });

  // 2. Forward log tới các target server đã đăng ký (mode === 'send') qua HTTP POST
  const sendTargets = connections.filter(c => c.mode === 'send');
  for (const conn of sendTargets) {
    try {
      await forwardWithRetry(conn, req.body);
      conn.sentCount = (conn.sentCount || 0) + 1;
      if (conn.status !== 'connected') {
        conn.status = 'connected';
        notifyStatusToClients(conn.url, conn.mode, 'connected');
      }
    } catch (err) {
      console.error(`  ├─ [FORWARD_FAIL] ${conn.url}: ${err.message}`);
      if (conn.status !== 'error') {
        conn.status = 'error';
        notifyStatusToClients(conn.url, conn.mode, 'error');
      }
    }
  }

  return res.status(200).send({ success: true });
});



module.exports = router;