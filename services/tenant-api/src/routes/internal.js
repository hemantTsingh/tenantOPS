const router = require("express").Router();
const { pool } = require("../db");

router.get("/all", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT s.*, t.email as tenant_email FROM services s JOIN tenants t ON s.tenant_id = t.id WHERE s.status != $1",
      ["deleted"]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  const { status, response_time, uptime_percent, cpu_usage, memory_usage, requests_per_min, error_rate } = req.body;
  try {
    await pool.query(
      "UPDATE services SET status = $1, response_time = $2, uptime_percent = $3, last_checked = NOW() WHERE id = $4",
      [status, response_time, uptime_percent, req.params.id]
    );
    await pool.query(
      "INSERT INTO metrics (service_id, cpu_usage, memory_usage, response_time, requests_per_min, error_rate) VALUES ($1,$2,$3,$4,$5,$6)",
      [req.params.id, cpu_usage, memory_usage, response_time, requests_per_min, error_rate]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
