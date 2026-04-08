const path = require('path');
require('dotenv').config(); // Load biến môi trường của BE (cms-middle-be/.env)
require('dotenv').config({ path: path.join(__dirname, '../.env.generated') }); // Đè các thông số IP/Port chung từ root

const { createServer } = require('http');
const { port } = require('./src/config');
const app = require('./src/app');
const socketState = require('./src/socketState');
const setupSocketEvents = require('./src/socketEvents');

const httpServer = createServer(app);

// Khởi tạo Socket.IO Server trên httpServer
socketState.init(httpServer);

// Đăng ký các socket event handlers
setupSocketEvents();

// ─── SERVER STARTUP ──────────────────────────────────────────────────────────
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`\n🚀 MIDDLE SERVER RUNNING AT: http://0.0.0.0:${port}`);
  console.log(`📡 CLIENT SOCKET SERVER READY (PORT ${port})\n`);
});