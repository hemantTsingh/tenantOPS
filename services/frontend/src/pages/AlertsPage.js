import React, { useState, useEffect } from "react";
import API from "../api";

const METRICS = [
  { value: "cpu_percent", label: "CPU Usage (%)" },
  { value: "memory_percent", label: "Memory Usage (%)" },
  { value: "disk_percent", label: "Disk Usage (%)" },
  { value: "response_time", label: "Response Time (ms)" },
  { value: "error_rate", label: "Error Rate (%)" },
  { value: "active_connections", label: "Active Connections" },
];

const OPERATORS = [
  { value: ">", label: "greater than" },
  { value: ">=", label: "greater than or equal" },
  { value: "<", label: "less than" },
  { value: "<=", label: "less than or equal" },
];

const DEFAULT_RULES = [
  { name: "High CPU", metric: "cpu_percent", operator: ">", threshold: 90, severity: "critical", target_type: "any", target_name: "" },
  { name: "High Memory", metric: "memory_percent", operator: ">", threshold: 85, severity: "warning", target_type: "any", target_name: "" },
  { name: "Disk Almost Full", metric: "disk_percent", operator: ">", threshold: 80, severity: "critical", target_type: "any", target_name: "" },
  { name: "Slow Response", metric: "response_time", operator: ">", threshold: 2000, severity: "warning", target_type: "any", target_name: "" },
  { name: "High Error Rate", metric: "error_rate", operator: ">", threshold: 5, severity: "critical", target_type: "any", target_name: "" },
];

export default function AlertsPage({ darkMode = true }) {
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [services, setServices] = useState([]);
  const [agentServers, setAgentServers] = useState([]);
  const [tab, setTab] = useState("rules");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", metric: "cpu_percent", operator: ">",
    threshold: "", severity: "warning",
    target_type: "any", target_name: "",
    notify_email: true, notify_slack: false, slack_webhook: ""
  });

  const fetchData = async () => {
    try {
      const [rulesRes, histRes, svcRes, agentRes] = await Promise.all([
        API.get("/api/alerts/rules"),
        API.get("/api/alerts/history"),
        API.get("/api/services"),
        API.get("/api/agent/status"),
      ]);
      setRules(rulesRes.data);
      setHistory(histRes.data);
      setServices(svcRes.data);
      setAgentServers(Object.keys(agentRes.data));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/alerts/rules", form);
      setShowAdd(false);
      setForm({ name: "", metric: "cpu_percent", operator: ">", threshold: "", severity: "warning", target_type: "any", target_name: "", notify_email: true, notify_slack: false, slack_webhook: "" });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleToggle = async (id) => {
    await API.patch(`/api/alerts/rules/${id}/toggle`);
    fetchData();
  };

  const handleDelete = async (id) => {
    await API.delete(`/api/alerts/rules/${id}`);
    fetchData();
  };

  const addDefaults = async () => {
    for (const rule of DEFAULT_RULES) {
      try { await API.post("/api/alerts/rules", rule); } catch (e) {}
    }
    fetchData();
  };

  const severityColor = (sv) => {
    if (sv === "critical") return { bg: "rgba(239,68,68,0.12)", color: "#f87171", border: "rgba(239,68,68,0.25)" };
    if (sv === "warning") return { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", border: "rgba(245,158,11,0.25)" };
    return { bg: "rgba(99,102,241,0.12)", color: "#818cf8", border: "rgba(99,102,241,0.25)" };
  };

  const targetLabel = (rule) => {
    if (!rule.target_type || rule.target_type === "any") return "All targets";
    if (rule.target_type === "server") return "Server: " + rule.target_name;
    if (rule.target_type === "service") return "Service: " + rule.target_name;
    return rule.target_name || "Any";
  };

  return (
    <div>
      <div style={s.toolbar}>
        <div style={s.tabs}>
          <button style={tab === "rules" ? s.tabOn : s.tabOff} onClick={() => setTab("rules")}>
            Alert Rules ({rules.length})
          </button>
          <button style={tab === "history" ? s.tabOn : s.tabOff} onClick={() => setTab("history")}>
            Alert History ({history.length})
          </button>
        </div>
        <div style={s.actions}>
          {tab === "rules" && rules.length === 0 && (
            <button style={s.defaultBtn} onClick={addDefaults}>+ Add Default Rules</button>
          )}
          {tab === "rules" && (
            <button style={s.addBtn} onClick={() => setShowAdd(true)}>+ New Rule</button>
          )}
        </div>
      </div>

      {tab === "rules" && (
        <div>
          {rules.length === 0 && (
            <div style={s.empty}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1" style={{ margin: "0 auto 16px", display: "block" }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <div style={s.emptyTitle}>No alert rules yet</div>
              <div style={s.emptyDesc}>Click "Add Default Rules" to get started with common thresholds</div>
            </div>
          )}
          {rules.map((rule) => {
            const sc = severityColor(rule.severity);
            return (
              <div key={rule.id} style={{ ...s.ruleCard, opacity: rule.enabled ? 1 : 0.5 }}>
                <div style={s.ruleLeft}>
                  <div style={s.ruleTop}>
                    <span style={s.ruleName}>{rule.name}</span>
                    <span style={{ ...s.badge, background: sc.bg, color: sc.color, border: "1px solid " + sc.border }}>{rule.severity}</span>
                    {!rule.enabled && <span style={{ ...s.badge, background: "rgba(100,116,139,0.1)", color: "#64748b", border: "1px solid rgba(100,116,139,0.2)" }}>disabled</span>}
                  </div>
                  <div style={s.ruleDesc}>
                    {METRICS.find(m => m.value === rule.metric)?.label || rule.metric} {rule.operator} {rule.threshold}
                  </div>
                  <div style={s.ruleMeta}>
                    <span style={s.chip}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                        <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                      {targetLabel(rule)}
                    </span>
                    {rule.notify_email && <span style={s.chip}>Email</span>}
                    {rule.notify_slack && <span style={s.chip}>Slack</span>}
                  </div>
                </div>
                <div style={s.ruleActions}>
                  <button style={rule.enabled ? s.disableBtn : s.enableBtn} onClick={() => handleToggle(rule.id)}>
                    {rule.enabled ? "Disable" : "Enable"}
                  </button>
                  <button style={s.deleteBtn} onClick={() => handleDelete(rule.id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "history" && (
        <div style={s.panel}>
          <table style={s.table}>
            <thead>
              <tr>{["Time", "Rule", "Metric", "Value", "Threshold", "Target", "Status"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={7} style={s.emptyCell}>No alerts fired yet</td></tr>
              )}
              {history.map((h, i) => (
                <tr key={i} style={{ ...s.tr, background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                  <td style={s.td}>{new Date(h.fired_at).toLocaleString()}</td>
                  <td style={s.td}>{h.rule_name}</td>
                  <td style={s.td}>{h.metric}</td>
                  <td style={{ ...s.td, color: "#ef4444", fontWeight: 600 }}>{parseFloat(h.value).toFixed(1)}</td>
                  <td style={s.td}>{h.threshold}</td>
                  <td style={s.td}>{h.server || "—"}</td>
                  <td style={s.td}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: h.status === "fired" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                      color: h.status === "fired" ? "#f87171" : "#4ade80",
                      border: "1px solid " + (h.status === "fired" ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"),
                    }}>{h.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>New Alert Rule</h2>
              <button style={s.closeBtn} onClick={() => setShowAdd(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleAdd}>
              <div style={s.field}>
                <label style={s.label}>Rule Name</label>
                <input style={s.input} placeholder="High CPU Alert" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>

              <div style={s.twoCol}>
                <div style={s.field}>
                  <label style={s.label}>Metric</label>
                  <select style={s.input} value={form.metric} onChange={e => setForm({ ...form, metric: e.target.value })}>
                    {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.label}>Condition</label>
                  <select style={s.input} value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })}>
                    {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={s.twoCol}>
                <div style={s.field}>
                  <label style={s.label}>Threshold Value</label>
                  <input style={s.input} type="number" placeholder="90" value={form.threshold} onChange={e => setForm({ ...form, threshold: e.target.value })} required />
                </div>
                <div style={s.field}>
                  <label style={s.label}>Severity</label>
                  <select style={s.input} value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                    {["info", "warning", "critical"].map(sv => <option key={sv} value={sv}>{sv}</option>)}
                  </select>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Apply To</label>
                <select style={s.input} value={form.target_type} onChange={e => setForm({ ...form, target_type: e.target.value, target_name: "" })}>
                  <option value="any">All servers and services</option>
                  <option value="server">Specific server (agent)</option>
                  <option value="service">Specific service</option>
                </select>
              </div>

              {form.target_type === "server" && (
                <div style={s.field}>
                  <label style={s.label}>Select Server</label>
                  {agentServers.length === 0 ? (
                    <div style={{ color: "#f59e0b", fontSize: 13, padding: "10px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10 }}>
                      No agent servers connected yet. Install the agent first.
                    </div>
                  ) : (
                    <select style={s.input} value={form.target_name} onChange={e => setForm({ ...form, target_name: e.target.value })} required>
                      <option value="">Choose a server...</option>
                      {agentServers.map(srv => (
                        <option key={srv} value={srv}>{srv}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {form.target_type === "service" && (
                <div style={s.field}>
                  <label style={s.label}>Select Service</label>
                  {services.length === 0 ? (
                    <div style={{ color: "#f59e0b", fontSize: 13, padding: "10px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10 }}>
                      No services added yet. Add services first.
                    </div>
                  ) : (
                    <select style={s.input} value={form.target_name} onChange={e => setForm({ ...form, target_name: e.target.value })} required>
                      <option value="">Choose a service...</option>
                      {services.map(svc => (
                        <option key={svc.id} value={svc.name}>{svc.name} ({svc.type})</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div style={s.field}>
                <label style={s.label}>Notifications</label>
                <div style={s.checkRow}>
                  <label style={s.checkLabel}>
                    <input type="checkbox" checked={form.notify_email} onChange={e => setForm({ ...form, notify_email: e.target.checked })} />
                    Email alert
                  </label>
                  <label style={s.checkLabel}>
                    <input type="checkbox" checked={form.notify_slack} onChange={e => setForm({ ...form, notify_slack: e.target.checked })} />
                    Slack alert
                  </label>
                </div>
              </div>

              {form.notify_slack && (
                <div style={s.field}>
                  <label style={s.label}>Slack Webhook URL</label>
                  <input style={s.input} placeholder="https://hooks.slack.com/..." value={form.slack_webhook} onChange={e => setForm({ ...form, slack_webhook: e.target.value })} />
                </div>
              )}

              <div style={s.btnRow}>
                <button type="button" style={s.cancelBtn} onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" style={s.submitBtn}>Create Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  tabs: { display: "flex", gap: 8 },
  tabOn: { padding: "8px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  tabOff: { padding: "8px 20px", background: "transparent", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, color: "#64748b", fontSize: 14, cursor: "pointer" },
  actions: { display: "flex", gap: 10 },
  addBtn: { padding: "8px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 15px rgba(99,102,241,0.3)" },
  defaultBtn: { padding: "8px 20px", background: "transparent", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, color: "#6366f1", fontSize: 14, cursor: "pointer" },
  empty: { textAlign: "center", padding: "60px 0" },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: "#94a3b8", marginBottom: 8 },
  emptyDesc: { color: "#64748b", fontSize: 14 },
  ruleCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)", borderRadius: 12, padding: 20, border: "1px solid rgba(99,102,241,0.12)", marginBottom: 12 },
  ruleLeft: { flex: 1 },
  ruleTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 6 },
  ruleName: { color: "#f1f5f9", fontWeight: 600, fontSize: 15 },
  ruleDesc: { color: "#64748b", fontSize: 13, marginBottom: 8 },
  ruleMeta: { display: "flex", gap: 6, flexWrap: "wrap" },
  chip: { background: "rgba(99,102,241,0.12)", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center" },
  ruleActions: { display: "flex", gap: 8, marginLeft: 20 },
  enableBtn: { padding: "6px 14px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 6, color: "#4ade80", fontSize: 13, cursor: "pointer" },
  disableBtn: { padding: "6px 14px", background: "transparent", border: "1px solid rgba(100,116,139,0.2)", borderRadius: 6, color: "#64748b", fontSize: 13, cursor: "pointer" },
  deleteBtn: { padding: "6px 14px", background: "transparent", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, color: "#f87171", fontSize: 13, cursor: "pointer" },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  panel: { background: "rgba(15,23,42,0.8)", backdropFilter: "blur(10px)", borderRadius: 12, border: "1px solid rgba(99,102,241,0.12)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", padding: "12px 16px", borderBottom: "1px solid rgba(99,102,241,0.1)", background: "rgba(0,0,0,0.2)" },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.03)" },
  td: { padding: "10px 16px", color: "#94a3b8", fontSize: 13 },
  emptyCell: { textAlign: "center", color: "#64748b", padding: "40px", fontSize: 14 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" },
  modal: { background: "rgba(15,23,42,0.95)", backdropFilter: "blur(20px)", borderRadius: 20, padding: 36, width: 520, border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: "#f1f5f9", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  closeBtn: { background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  field: { marginBottom: 18 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  label: { display: "block", color: "#94a3b8", fontSize: 13, marginBottom: 6, fontWeight: 500 },
  input: { width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, color: "#f1f5f9", fontSize: 14, outline: "none" },
  checkRow: { display: "flex", gap: 20 },
  checkLabel: { display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 14, cursor: "pointer" },
  btnRow: { display: "flex", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: "10px", background: "transparent", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, color: "#94a3b8", cursor: "pointer" },
  submitBtn: { flex: 1, padding: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 15px rgba(99,102,241,0.3)" },
};
