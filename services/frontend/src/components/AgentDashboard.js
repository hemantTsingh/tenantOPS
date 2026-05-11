import React, { useState, useEffect } from "react";
import API from "../api";

export default function AgentDashboard() {
  const [agents, setAgents] = useState({});
  const [selected, setSelected] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [logs, setLogs] = useState({ audit: [], syslog: [] });
  const [logTab, setLogTab] = useState("syslog");
  const [logFilter, setLogFilter] = useState("");

  const fetchAgent = async () => {
    try {
      const res = await API.get("/api/agent/status");
      const data = res.data;
      setAgents(data);
      setLastUpdated(new Date().toLocaleTimeString());
      if (!selected && Object.keys(data).length > 0) {
        setSelected(Object.keys(data)[0]);
      }
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async () => {
    try {
      const [auditRes, sysRes] = await Promise.all([
        API.get("/api/logs"),
        API.get("/api/logs/syslogs"),
      ]);
      setLogs({ audit: auditRes.data, syslog: sysRes.data });
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAgent();
    fetchLogs();
    const t = setInterval(() => { fetchAgent(); fetchLogs(); }, 30000);
    return () => clearInterval(t);
  }, []);

  const data = selected ? agents[selected] : null;
  const serverList = Object.keys(agents);

  const fmt = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes > 1e9) return (bytes / 1e9).toFixed(1) + " GB";
    if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + " MB";
    return (bytes / 1e3).toFixed(1) + " KB";
  };

  const color = (val) => val > 80 ? "#ef4444" : val > 60 ? "#f59e0b" : "#22c55e";
  const isStale = (ts) => !ts || (Date.now() / 1000 - ts) > 120;

  if (serverList.length === 0) return (
    <div style={s.empty}>
      <div style={s.emptyTitle}>No agent connected</div>
      <div style={s.emptyDesc}>Run the TenantOPS agent on your server to see live system metrics</div>
    </div>
  );

  return (
    <div>
      <div style={s.serverSelector}>
        <div style={s.selectorLabel}>Connected Servers ({serverList.length})</div>
        <div style={s.serverTabs}>
          {serverList.map(srv => {
            const d = agents[srv];
            const stale = isStale(d && d.timestamp);
            return (
              <div key={srv} style={{...s.serverTab, ...(selected === srv ? s.serverTabActive : {})}} onClick={() => setSelected(srv)}>
                <div style={{...s.tabDot, background: stale ? "#f59e0b" : "#22c55e"}}></div>
                <div>
                  <div style={s.tabName}>{srv}</div>
                  <div style={s.tabHost}>{d && d.hostname}</div>
                </div>
                {stale && <div style={s.staleBadge}>stale</div>}
              </div>
            );
          })}
        </div>
      </div>

      {data && (
        <div>
          <div style={s.serverHeader}>
            <div style={s.serverInfo}>
              <div style={s.serverIcon}>S</div>
              <div>
                <div style={s.serverName}>{data.server}</div>
                <div style={s.serverHost}>{data.hostname}</div>
              </div>
            </div>
            <div style={s.liveTag}><span style={s.liveDot}></span>Live - {lastUpdated}</div>
          </div>

          <div style={s.gaugeGrid}>
            {[
              { label: "CPU Usage", value: data.cpu_percent || 0, sub: (data.cpu_percent || 0).toFixed(1) + "% utilized" },
              { label: "Memory", value: data.memory_percent || 0, sub: fmt(data.memory_used) + " / " + fmt(data.memory_total) },
              { label: "Disk", value: data.disk_percent || 0, sub: fmt(data.disk_used) + " / " + fmt(data.disk_total) },
            ].map((g, i) => (
              <div key={i} style={s.gaugeCard}>
                <div style={s.gaugeLabel}>{g.label}</div>
                <div style={{...s.gaugeValue, color: color(g.value)}}>{g.value.toFixed(1)}%</div>
                <div style={s.gaugeTrack}>
                  <div style={{...s.gaugeFill, width: Math.min(g.value, 100) + "%", background: color(g.value)}}></div>
                </div>
                <div style={s.gaugeSub}>{g.sub}</div>
              </div>
            ))}
          </div>

          <div style={s.statsRow}>
            {[
              { label: "Connections", value: data.active_connections || 0 },
              { label: "Processes", value: data.running_processes || 0 },
              { label: "Users", value: (data.logged_in_users && data.logged_in_users.length) || 0 },
              { label: "Net In", value: fmt(data.net_bytes_recv) },
              { label: "Net Out", value: fmt(data.net_bytes_sent) },
            ].map((st, i) => (
              <div key={i} style={s.statCard}>
                <div style={s.statValue}>{st.value}</div>
                <div style={s.statLabel}>{st.label}</div>
              </div>
            ))}
          </div>

          <div style={s.twoCol}>
            <div style={s.panel}>
              <div style={s.panelTitle}>Docker Containers ({(data.docker_containers && data.docker_containers.length) || 0})</div>
              {(data.docker_containers || []).map((c, i) => (
                <div key={i} style={s.rowItem}>
                  <div style={{...s.dot, background: c.status.includes("Up") ? "#22c55e" : "#ef4444"}}></div>
                  <div style={{flex: 1}}>
                    <div style={s.itemName}>{c.name}</div>
                    <div style={s.itemSub}>{c.image}</div>
                  </div>
                  <div style={{...s.badge, background: c.status.includes("Up") ? "#052e16" : "#450a0a", color: c.status.includes("Up") ? "#4ade80" : "#f87171"}}>
                    {c.status.includes("Up") ? "running" : "stopped"}
                  </div>
                </div>
              ))}
              {(!data.docker_containers || data.docker_containers.length === 0) && <div style={s.empty2}>No containers</div>}
            </div>

            <div style={s.panel}>
              <div style={s.panelTitle}>Logged In Users ({(data.logged_in_users && data.logged_in_users.length) || 0})</div>
              {(data.logged_in_users || []).map((u, i) => (
                <div key={i} style={s.rowItem}>
                  <div style={s.avatar}>{u.name[0].toUpperCase()}</div>
                  <div style={{flex: 1}}>
                    <div style={s.itemName}>{u.name}</div>
                    <div style={s.itemSub}>{u.terminal}</div>
                  </div>
                  <div style={{...s.badge, background: "#1e3a5f", color: "#60a5fa"}}>active</div>
                </div>
              ))}
              {(!data.logged_in_users || data.logged_in_users.length === 0) && <div style={s.empty2}>No users logged in</div>}
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.panelTitle}>Top 10 Processes by CPU</div>
            <table style={s.table}>
              <thead>
                <tr>{["PID", "Name", "CPU %", "Memory %", "Status"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {(data.top_processes || []).map((p, i) => (
                  <tr key={i} style={{...s.tr, background: i % 2 === 0 ? "transparent" : "#ffffff08"}}>
                    <td style={s.td}>{p.pid}</td>
                    <td style={s.td}>{p.name}</td>
                    <td style={{...s.td, color: p.cpu > 50 ? "#ef4444" : p.cpu > 20 ? "#f59e0b" : "#94a3b8"}}>{p.cpu}%</td>
                    <td style={{...s.td, color: p.memory > 20 ? "#f59e0b" : "#94a3b8"}}>{p.memory}%</td>
                    <td style={s.td}>
                      <span style={{...s.badge, background: p.status === "running" ? "#052e16" : "#1e293b", color: p.status === "running" ? "#4ade80" : "#94a3b8"}}>{p.status}</span>
                    </td>
                  </tr>
                ))}
                {(!data.top_processes || data.top_processes.length === 0) && (
                  <tr><td colSpan={5} style={{...s.td, textAlign: "center", color: "#64748b"}}>No process data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={s.panel}>
            <div style={s.logsHeader}>
              <div style={s.panelTitle}>Logs</div>
              <div style={s.logControls}>
                <div style={s.logTabs}>
                  <button style={logTab === "syslog" ? s.logTabOn : s.logTabOff} onClick={() => setLogTab("syslog")}>
                    Syslogs ({logs.syslog.length})
                  </button>
                  <button style={logTab === "audit" ? s.logTabOn : s.logTabOff} onClick={() => setLogTab("audit")}>
                    Audit ({logs.audit.length})
                  </button>
                </div>
                <input style={s.logSearch} placeholder="Filter..." value={logFilter} onChange={e => setLogFilter(e.target.value)} />
              </div>
            </div>
            <table style={s.table}>
              <thead>
                <tr>
                  {logTab === "syslog"
                    ? ["Time", "Level", "Source", "Message"].map(h => <th key={h} style={s.th}>{h}</th>)
                    : ["Time", "Action", "Resource", "IP"].map(h => <th key={h} style={s.th}>{h}</th>)
                  }
                </tr>
              </thead>
              <tbody>
                {logTab === "syslog" && logs.syslog
                  .filter(l => !logFilter || (l.message && l.message.toLowerCase().includes(logFilter.toLowerCase())) || (l.source && l.source.toLowerCase().includes(logFilter.toLowerCase())))
                  .slice(0, 50)
                  .map((log, i) => {
                    const lc = (log.level === "ERROR" || log.level === "CRITICAL") ? { bg: "#450a0a", color: "#f87171" }
                             : log.level === "WARNING" ? { bg: "#431407", color: "#fdba74" }
                             : { bg: "#0f2a1a", color: "#4ade80" };
                    return (
                      <tr key={i} style={{...s.tr, background: i % 2 === 0 ? "transparent" : "#ffffff05"}}>
                        <td style={{...s.td, whiteSpace: "nowrap"}}>{new Date(log.created_at).toLocaleTimeString()}</td>
                        <td style={s.td}><span style={{...s.badge, background: lc.bg, color: lc.color}}>{log.level}</span></td>
                        <td style={{...s.td, color: "#64748b"}}>{log.source}</td>
                        <td style={{...s.td, fontFamily: "monospace", fontSize: 11, maxWidth: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{log.message}</td>
                      </tr>
                    );
                  })
                }
                {logTab === "audit" && logs.audit
                  .filter(l => !logFilter || (l.action && l.action.toLowerCase().includes(logFilter.toLowerCase())))
                  .slice(0, 50)
                  .map((log, i) => {
                    const ac = log.action === "LOGIN" ? { bg: "#1e3a5f", color: "#60a5fa" }
                             : log.action === "LOGIN_FAILED" ? { bg: "#450a0a", color: "#f87171" }
                             : log.action === "DELETE" ? { bg: "#450a0a", color: "#f87171" }
                             : { bg: "#0f2a1a", color: "#4ade80" };
                    return (
                      <tr key={i} style={{...s.tr, background: i % 2 === 0 ? "transparent" : "#ffffff05"}}>
                        <td style={{...s.td, whiteSpace: "nowrap"}}>{new Date(log.created_at).toLocaleString()}</td>
                        <td style={s.td}><span style={{...s.badge, background: ac.bg, color: ac.color}}>{log.action}</span></td>
                        <td style={s.td}>{log.resource || "-"}</td>
                        <td style={{...s.td, fontFamily: "monospace"}}>{log.ip_address || "-"}</td>
                      </tr>
                    );
                  })
                }
                {((logTab === "syslog" && logs.syslog.length === 0) || (logTab === "audit" && logs.audit.length === 0)) && (
                  <tr><td colSpan={4} style={{...s.td, textAlign: "center", color: "#64748b", padding: "30px"}}>No logs yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  empty: { textAlign: "center", padding: "80px 0" },
  emptyTitle: { fontSize: 20, fontWeight: 600, color: "#94a3b8", marginBottom: 8 },
  emptyDesc: { color: "#64748b", fontSize: 14 },
  serverSelector: { background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155", marginBottom: 20 },
  selectorLabel: { color: "#94a3b8", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 },
  serverTabs: { display: "flex", gap: 10, flexWrap: "wrap" },
  serverTab: { display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 8, border: "1px solid #334155", cursor: "pointer", background: "#0f172a" },
  serverTabActive: { border: "1px solid #6366f1", background: "#1e1e3f" },
  tabDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  tabName: { color: "#f1f5f9", fontSize: 13, fontWeight: 600 },
  tabHost: { color: "#64748b", fontSize: 11, marginTop: 2 },
  staleBadge: { background: "#431407", color: "#fdba74", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 600 },
  serverHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e293b", borderRadius: 12, padding: "16px 24px", border: "1px solid #334155", marginBottom: 20 },
  serverInfo: { display: "flex", alignItems: "center", gap: 12 },
  serverIcon: { width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18 },
  serverName: { color: "#f1f5f9", fontWeight: 600, fontSize: 16 },
  serverHost: { color: "#64748b", fontSize: 13, marginTop: 2 },
  liveTag: { display: "flex", alignItems: "center", gap: 6, background: "#052e16", border: "1px solid #166534", borderRadius: 20, padding: "6px 14px", color: "#4ade80", fontSize: 13 },
  liveDot: { width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" },
  gaugeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 },
  gaugeCard: { background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155" },
  gaugeLabel: { color: "#94a3b8", fontSize: 13, marginBottom: 8 },
  gaugeValue: { fontSize: 32, fontWeight: 700, marginBottom: 10 },
  gaugeTrack: { height: 6, background: "#334155", borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  gaugeFill: { height: "100%", borderRadius: 3, transition: "width 0.5s ease" },
  gaugeSub: { color: "#64748b", fontSize: 12 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 },
  statCard: { background: "#1e293b", borderRadius: 10, padding: 16, border: "1px solid #334155", textAlign: "center" },
  statValue: { color: "#f1f5f9", fontWeight: 700, fontSize: 20, marginBottom: 4 },
  statLabel: { color: "#64748b", fontSize: 11 },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  panel: { background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155", marginBottom: 16 },
  panelTitle: { color: "#f1f5f9", fontWeight: 600, fontSize: 15, marginBottom: 16 },
  rowItem: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #0f172a" },
  dot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  avatar: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 },
  itemName: { color: "#f1f5f9", fontSize: 14, fontWeight: 500 },
  itemSub: { color: "#64748b", fontSize: 12, marginTop: 2 },
  badge: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0 },
  empty2: { color: "#64748b", fontSize: 14, textAlign: "center", padding: "20px 0" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", padding: "8px 12px", borderBottom: "1px solid #334155" },
  tr: { borderBottom: "1px solid #1e293b" },
  td: { padding: "10px 12px", color: "#94a3b8", fontSize: 13 },
  logsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  logControls: { display: "flex", alignItems: "center", gap: 10 },
  logTabs: { display: "flex", gap: 6 },
  logTabOn: { padding: "6px 14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" },
  logTabOff: { padding: "6px 14px", background: "transparent", border: "1px solid #334155", borderRadius: 6, color: "#64748b", fontSize: 12, cursor: "pointer" },
  logSearch: { padding: "6px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#f1f5f9", fontSize: 12, outline: "none", width: 160 },
};
