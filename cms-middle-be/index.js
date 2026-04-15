const path = require('path');
require('dotenv').config(); // Load biến môi trường của BE (cms-middle-be/.env)
require('dotenv').config({ path: path.join(__dirname, '../.env.generated') }); // Đè các thông số IP/Port chung từ root

const { createServer } = require('http');
const app = require('./src/app');

const httpServer = createServer(app);

// ─── SERVER STARTUP ──────────────────────────────────────────────────────────
httpServer.listen(5050, '192.168.1.66', () => {
  console.log(`\n🚀 MIDDLE SERVER RUNNING AT: http://192.168.1.66:5050\n`);
});
