const router = require("express").Router();
const { pool } = require("../db");
const auth = require("../middleware/auth");
const nodemailer = require("nodemailer");

// Get all rules for tenant
router.get("/rules", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM alert_rules WHERE tenant_id = $1 ORDER BY created_at DESC",
      [req.user.tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create rule
router.post("/rules", auth, async (req, res) => {
  const { name, metric, operator, threshold, duration_minutes, severity, notify_email, notify_slack, slack_webhook } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO alert_rules 
       (tenant_id, name, metric, operator, threshold, duration_minutes, severity, notify_email, notify_slack, slack_webhook)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user.tenantId, name, metric, operator, threshold, duration_minutes || 0, severity || "warning", notify_email !== false, notify_slack || false, slack_webhook || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle rule on/off
router.patch("/rules/:id/toggle", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE alert_rules SET enabled = NOT enabled WHERE id = $1 AND tenant_id = $2 RETURNING *",
      [req.params.id, req.user.tenantId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete rule
router.delete("/rules/:id", auth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM alert_rules WHERE id = $1 AND tenant_id = $2",
      [req.params.id, req.user.tenantId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get alert history
router.get("/history", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ah.*, ar.name as rule_name 
       FROM alert_history ah 
       LEFT JOIN alert_rules ar ON ah.rule_id = ar.id
       WHERE ah.tenant_id = $1 
       ORDER BY ah.fired_at DESC LIMIT 100`,
      [req.user.tenantId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Internal — check rules against current metrics (called by collector)
router.post("/internal/check", async (req, res) => {
  const { tenant_id, service_id, server, metrics } = req.body;
  try {
    const rules = await pool.query(
      "SELECT * FROM alert_rules WHERE tenant_id = $1 AND enabled = true",
      [tenant_id]
    );

    const fired = [];

    for (const rule of rules.rows) {
      const value = metrics[rule.metric];
      if (value === undefined) continue;

      let triggered = false;
      if (rule.operator === ">" && value > rule.threshold) triggered = true;
      if (rule.operator === ">=" && value >= rule.threshold) triggered = true;
      if (rule.operator === "<" && value < rule.threshold) triggered = true;
      if (rule.operator === "<=" && value <= rule.threshold) triggered = true;

      if (triggered) {
        // Check if already fired recently (last 5 min)
        const recent = await pool.query(
          `SELECT id FROM alert_history 
           WHERE rule_id = $1 AND tenant_id = $2 
           AND fired_at > NOW() - INTERVAL '5 minutes'
           AND status = 'fired'`,
          [rule.id, tenant_id]
        );

        if (recent.rows.length === 0) {
          await pool.query(
            `INSERT INTO alert_history (tenant_id, rule_id, service_id, server, metric, value, threshold, status)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [tenant_id, rule.id, service_id || null, server || null, rule.metric, value, rule.threshold, "fired"]
          );

          fired.push({ rule: rule.name, metric: rule.metric, value, threshold: rule.threshold });

          // Send email if configured
          if (rule.notify_email) {
            const tenantResult = await pool.query("SELECT email FROM tenants WHERE id = $1", [tenant_id]);
            if (tenantResult.rows.length > 0) {
              sendAlertEmail(tenantResult.rows[0].email, rule, value, server, service_id).catch(console.error);
            }
          }

          // Send Slack if configured
          if (rule.notify_slack && rule.slack_webhook) {
            sendSlackAlert(rule.slack_webhook, rule, value, server).catch(console.error);
          }
        }
      }
    }

    res.json({ checked: rules.rows.length, fired: fired.length, alerts: fired });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function sendAlertEmail(to, rule, value, server, service_id) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"TenantOPS Alerts" <${process.env.SMTP_USER}>`,
      to,
      subject: `🔴 Alert: ${rule.name} triggered`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e293b; padding: 24px; border-radius: 12px;">
            <h2 style="color: #f1f5f9; margin: 0 0 16px;">🔴 TenantOPS Alert</h2>
            <div style="background: #0f172a; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <p style="color: #94a3b8; margin: 0 0 8px; font-size: 13px;">RULE</p>
              <p style="color: #f1f5f9; margin: 0; font-size: 18px; font-weight: bold;">${rule.name}</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
              <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
                <p style="color: #94a3b8; margin: 0 0 4px; font-size: 12px;">METRIC</p>
                <p style="color: #f1f5f9; margin: 0; font-weight: bold;">${rule.metric}</p>
              </div>
              <div style="background: #450a0a; padding: 12px; border-radius: 8px;">
                <p style="color: #94a3b8; margin: 0 0 4px; font-size: 12px;">CURRENT VALUE</p>
                <p style="color: #f87171; margin: 0; font-weight: bold;">${value}</p>
              </div>
              <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
                <p style="color: #94a3b8; margin: 0 0 4px; font-size: 12px;">THRESHOLD</p>
                <p style="color: #f1f5f9; margin: 0; font-weight: bold;">${rule.operator} ${rule.threshold}</p>
              </div>
              <div style="background: #0f172a; padding: 12px; border-radius: 8px;">
                <p style="color: #94a3b8; margin: 0 0 4px; font-size: 12px;">SERVER</p>
                <p style="color: #f1f5f9; margin: 0; font-weight: bold;">${server || "N/A"}</p>
              </div>
            </div>
            <a href="${process.env.APP_URL || "http://13.203.64.25:3000"}" 
               style="display: block; text-align: center; background: #6366f1; color: white; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: bold;">
              View Dashboard
            </a>
          </div>
        </div>
      `,
    });
    console.log(`[alerts] Email sent to ${to}`);
  } catch (err) {
    console.error("[alerts] Email failed:", err.message);
  }
}

async function sendSlackAlert(webhook, rule, value, server) {
  try {
    const axios = require("axios");
    await axios.post(webhook, {
      text: `🔴 *TenantOPS Alert*: ${rule.name}`,
      attachments: [{
        color: "danger",
        fields: [
          { title: "Metric", value: rule.metric, short: true },
          { title: "Value", value: String(value), short: true },
          { title: "Threshold", value: `${rule.operator} ${rule.threshold}`, short: true },
          { title: "Server", value: server || "N/A", short: true },
        ]
      }]
    });
    console.log("[alerts] Slack notification sent");
  } catch (err) {
    console.error("[alerts] Slack failed:", err.message);
  }
}

module.exports = router;
