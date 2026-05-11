const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

router.get('/summary', auth, async (req, res) => {
  try {
    const services = await pool.query(
      'SELECT * FROM services WHERE tenant_id = $1',
      [req.user.tenantId]
    );
    const incidents = await pool.query(
      `SELECT * FROM incidents WHERE tenant_id = $1 AND status = 'open'`,
      [req.user.tenantId]
    );
    const totalServices = services.rows.length;
    const onlineServices = services.rows.filter(s => s.status === 'online').length;
    const avgUptime = totalServices
      ? (services.rows.reduce((a, b) => a + parseFloat(b.uptime_percent), 0) / totalServices).toFixed(2)
      : 100;
    const avgResponse = totalServices
      ? Math.round(services.rows.reduce((a, b) => a + b.response_time, 0) / totalServices)
      : 0;
    res.json({
      totalServices,
      onlineServices,
      avgUptime,
      avgResponse,
      activeIncidents: incidents.rows.length,
      services: services.rows,
      recentIncidents: incidents.rows.slice(0, 5)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
