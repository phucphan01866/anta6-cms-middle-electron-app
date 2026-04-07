// ─── CONFIG & URL HELPERS ─────────────────────────────────────────────────────
const port = process.env.THIS_PORT || 5050;

const getURL = (host, p) => (host && p ? `http://${host}:${p}` : null);
const getCMSBackendURL = () => getURL(process.env.BE_CMS_IP, process.env.BE_CMS_PORT);

const declaredRoutes = [
  '/api/v1/login',
  '/api/v1/logs',
  '/healthcheck',
  '/api/v1/create-connection',
  '/api/v1/remove-connection',
  '/api/v1/connections',
  '/server-information',
  '/api/v1/server',
  '/api/v1/devices',
];

module.exports = { port, getURL, getCMSBackendURL, declaredRoutes };
