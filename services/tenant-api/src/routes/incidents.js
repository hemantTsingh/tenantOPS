const router = require("express").Router();
const { pool } = require("../db");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, s.name as service_name
       FROM incidents i JOIN services s ON i.service_id = s.id
       WHERE i.tenant_id = $1
       ORDER BY i.detected_at DESC LIMIT 50`,
      [req.user.tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/resolve", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE incidents SET status = $1, resolved_at = NOW()
       WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      ["resolved", req.params.id, req.user.tenantId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/internal", async (req, res) => {
  const { service_id, tenant_id, title, severity, description } = req.body;
  try {
    const existing = await pool.query(
      "SELECT id FROM incidents WHERE service_id = $1 AND status = $2",
      [service_id, "open"]
    );
    if (existing.rows.length > 0) return res.json({ ok: true, msg: "already open" });
    await pool.query(
      "INSERT INTO incidents (tenant_id, service_id, title, severity, description, status) VALUES ($1,$2,$3,$4,$5,$6)",
      [tenant_id, service_id, title, severity || "critical", description, "open"]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/internal/resolve", async (req, res) => {
  const { service_id } = req.body;
  try {
    await pool.query(
      "UPDATE incidents SET status = $1, resolved_at = NOW() WHERE service_id = $2 AND status = $3",
      ["resolved", service_id, "open"]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
