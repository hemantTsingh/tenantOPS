const router = require("express").Router();
const { pool } = require("../db");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM services WHERE tenant_id = $1 ORDER BY created_at DESC",
      [req.user.tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  const { name, type, endpoint } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO services (tenant_id, name, type, endpoint, status) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [req.user.tenantId, name, type, endpoint, "monitoring"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM services WHERE id = $1 AND tenant_id = $2",
      [req.params.id, req.user.tenantId]
    );
    res.json({ message: "Service removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/metrics", auth, async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    let query = "SELECT * FROM metrics WHERE service_id = $1";
    const params = [req.params.id];

    if (from) {
      params.push(new Date(from));
      query += ` AND recorded_at >= $${params.length}`;
    }
    if (to) {
      params.push(new Date(to));
      query += ` AND recorded_at <= $${params.length}`;
    }

    query += " ORDER BY recorded_at DESC";
    query += ` LIMIT $${params.length + 1}`;
    params.push(parseInt(limit) || 100);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
