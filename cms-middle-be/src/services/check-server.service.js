const net = require('net');
const cron = require('node-cron');
const { servers } = require('../socketState');
const { port: defaultPort } = require('../config');

/**
 * Pings a server using TCP connection
 * @param {string} ip 
 * @param {number} port 
 * @returns {Promise<{online: boolean, duration?: number}>}
 */
const pingServer = (ip, port) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const startTime = Date.now();
    
    // 3 seconds timeout for ping
    socket.setTimeout(3000);
    
    socket.on('connect', () => {
      const duration = Date.now() - startTime;
      socket.destroy();
      resolve({ online: true, duration });
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve({ online: false });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ online: false });
    });
    
    socket.connect(port, ip);
  });
};

/**
 * Starts the background monitoring task
 */
const startMonitoring = () => {
  console.log('⏲️  Monitoring service initialized (30s interval)');
  
  // Run every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    const timestamp = new Date().toLocaleString();
    
    if (servers.size === 0) {
      // console.log(`[${timestamp}] [MONITOR] No servers registered to ping.`);
      return;
    }

    console.log(`\n[${timestamp}] 📡 SERVER HEALTH CHECK (${servers.size} servers)`);
    
    const results = [];
    for (const [id, serverData] of servers.entries()) {
      const ip = serverData.server_ip || serverData.sender_ip;
      // Use server_port if available, otherwise fallback to BE default port
      const port = serverData.server_port || defaultPort;
      const name = serverData.server_name || id;
      
      const res = await pingServer(ip, port);
      results.push({
        Server: name,
        Address: `${ip}:${port}`,
        Status: res.online ? '✅ ONLINE' : '❌ OFFLINE',
        Latency: res.duration ? `${res.duration}ms` : '-'
      });
    }
    
    console.table(results);
  });
};

module.exports = { startMonitoring };
