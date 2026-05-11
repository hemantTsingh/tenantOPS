const router = require("express").Router();
const { pool } = require("../db");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 100",
      [req.user.tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/internal", async (req, res) => {
  const { tenant_id, user_id, action, resource, ip_address, details } = req.body;
  try {
    await pool.query(
      "INSERT INTO audit_logs (tenant_id, user_id, action, resource, ip_address, details) VALUES ($1,$2,$3,$4,$5,$6)",
      [tenant_id, user_id, action, resource, ip_address, details]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/syslogs", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM syslogs ORDER BY created_at DESC LIMIT 200"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/syslogs", async (req, res) => {
  const { server, level, message, source } = req.body;
  try {
    await pool.query(
      "INSERT INTO syslogs (server, level, message, source) VALUES ($1,$2,$3,$4)",
      [server, level, message, source]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
