import React, { useState, useEffect } from "react";
import API from "../api";

export default function LogsPage() {
  const [tab, setTab] = useState("audit");
  const [auditLogs, setAuditLogs] = useState([]);
  const [syslogs, setSyslogs] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [auditRes, sysRes] = await Promise.all([
        API.get("/api/logs"),
        API.get("/api/logs/syslogs"),
      ]);
      setAuditLogs(auditRes.data);
      setSyslogs(sysRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const t = setInterval(fetchLogs, 30000);
    return () => clearInterval(t);
  }, []);

  const levelColor = (level) => {
    if (level === "ERROR") return { bg: "#450a0a", color: "#f87171" };
    if (level === "WARNING") return { bg: "#431407", color: "#fdba74" };
    return { bg: "#0f2a1a", color: "#4ade80" };
  };

  const actionColor = (action) => {
    if (action === "LOGIN") return { bg: "#1e3a5f", color: "#60a5fa" };
    if (action === "DELETE") return { bg: "#450a0a", color: "#f87171" };
    if (action === "CREATE") return { bg: "#0f2a1a", color: "#4ade80" };
    return { bg: "#1e293b", color: "#94a3b8" };
  };

  const filteredAudit = auditLogs.filter(l =>
    !filter || l.action?.toLowerCase().includes(filter.toLowerCase()) ||
    l.resource?.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredSys = syslogs.filter(l =>
    !filter || l.message?.toLowerCase().includes(filter.toLowerCase()) ||
    l.level?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div style={s.toolbar}>
        <div style={s.tabs}>
          <button style={tab === "audit" ? s.tabOn : s.tabOff} onClick={() => setTab("audit")}>
            Audit Logs ({auditLogs.length})
          </button>
          <button style={tab === "syslog" ? s.tabOn : s.tabOff} onClick={() => setTab("syslog")}>
            Syslogs ({syslogs.length})
          </button>
        </div>
        <div style={s.controls}>
          <input
            style={s.search}
            placeholder="Filter logs..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <button style={s.refreshBtn} onClick={fetchLogs}>Refresh</button>
        </div>
      </div>

      {loading && <div style={s.loading}>Loading logs...</div>}

      {tab === "audit" && (
        <div style={s.panel}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Time", "Action", "Resource", "IP Address", "Details"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAudit.length === 0 && (
                <tr><td colSpan={5} style={s.empty}>No audit logs yet. Actions like login will appear here.</td></tr>
              )}
              {filteredAudit.map((log, i) => (
                <tr key={i} style={{...s.tr, background: i % 2 === 0 ? "transparent" : "#ffffff05"}}>
                  <td style={s.td}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={s.td}>
                    <span style={{...s.badge, ...actionColor(log.action)}}>{log.action}</span>
                  </td>
                  <td style={s.td}>{log.resource || "—"}</td>
                  <td style={{...s.td, fontFamily: "monospace"}}>{log.ip_address || "—"}</td>
                  <td style={s.td}>{log.details || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "syslog" && (
        <div style={s.panel}>
          <table style={s.table}>
            <thead>
              <tr>
                {["Time", "Level", "Server", "Source", "Message"].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSys.length === 0 && (
                <tr><td colSpan={5} style={s.empty}>No syslogs yet. Agent sends logs every 30s.</td></tr>
              )}
              {filteredSys.map((log, i) => (
                <tr key={i} style={{...s.tr, background: i % 2 === 0 ? "transparent" : "#ffffff05"}}>
                  <td style={s.td}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={s.td}>
                    <span style={{...s.badge, ...levelColor(log.level)}}>{log.level}</span>
                  </td>
                  <td style={s.td}>{log.server}</td>
                  <td style={s.td}>{log.source}</td>
                  <td style={{...s.td, fontFamily: "monospace", fontSize: 11, maxWidth: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const s = {
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  tabs: { display: "flex", gap: 8 },
  tabOn: { padding: "8px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  tabOff: { padding: "8px 20px", background: "transparent", border: "1px solid #334155", borderRadius: 8, color: "#64748b", fontSize: 14, cursor: "pointer" },
  controls: { display: "flex", gap: 10 },
  search: { padding: "8px 14px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 13, outline: "none", minWidth: 200 },
  refreshBtn: { padding: "8px 16px", background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#94a3b8", fontSize: 13, cursor: "pointer" },
  panel: { background: "#1e293b", borderRadius: 12, border: "1px solid #334155", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", padding: "12px 16px", borderBottom: "1px solid #334155", background: "#0f172a" },
  tr: { borderBottom: "1px solid #1e293b" },
  td: { padding: "10px 16px", color: "#94a3b8", fontSize: 13, verticalAlign: "top" },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  empty: { textAlign: "center", color: "#64748b", padding: "40px", fontSize: 14 },
  loading: { color: "#64748b", textAlign: "center", padding: "20px", fontSize: 14 },
};
