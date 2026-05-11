const router = require("express").Router();
const { pool } = require("../db");

router.get("/install", (req, res) => {
  const fs = require("fs");
  const path = require("path");
  const scriptPath = path.join(__dirname, "../../agent-install.sh");
  try {
    const script = fs.readFileSync(scriptPath, "utf8");
    res.setHeader("Content-Type", "text/plain");
    res.send(script);
  } catch (err) {
    res.status(404).json({ error: "Not found: " + scriptPath });
  }
});

router.post("/report", async (req, res) => {
  const data = req.body;
  try {
    await pool.query(
      `INSERT INTO agent_reports (server, hostname, data, reported_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (server) DO UPDATE
       SET hostname = $2, data = $3, reported_at = NOW()`,
      [data.server, data.hostname, JSON.stringify(data)]
    );
    console.log("[agent] Report from " + data.server + " CPU:" + data.cpu_percent + "%");
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/status", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT server, hostname, data, reported_at FROM agent_reports WHERE reported_at > NOW() - INTERVAL \'10 minutes\'"
    );
    const out = {};
    for (const row of result.rows) {
      out[row.server] = { ...row.data, received_at: row.reported_at };
    }
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
