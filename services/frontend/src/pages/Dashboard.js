import React, { useState, useEffect } from "react";
import API from "../api";
import ServiceCard from "../components/ServiceCard";
import AddServiceModal from "../components/AddServiceModal";
import IncidentList from "../components/IncidentList";
import MetricsChart from "../components/MetricsChart";
import AgentDashboard from "../components/AgentDashboard";
import AlertsPage from "./AlertsPage";

export default function Dashboard({ user, tenant, onLogout, darkMode, setDarkMode }) {
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("tenantops_tab") || "overview");

  const switchTab = (tab) => {
    localStorage.setItem("tenantops_tab", tab);
    setActiveTab(tab);
  };

  const fetchData = async () => {
    try {
      const [sumRes, incRes] = await Promise.all([
        API.get("/api/dashboard/summary"),
        API.get("/api/incidents"),
      ]);
      setSummary(sumRes.data);
      setIncidents(incRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, []);

  const handleResolve = async (id) => {
    await API.patch(`/api/incidents/${id}/resolve`);
    fetchData();
  };

  const handleDeleteService = async (id) => {
    await API.delete(`/api/services/${id}`);
    fetchData();
  };

  const statusColor = (status) =>
    status === "online" ? "#22c55e" : status === "error" ? "#ef4444" : "#f59e0b";

  const dm = darkMode;
  const bg = dm ? "#080f1a" : "#f1f5f9";
  const sidebarBg = dm ? "rgba(10,15,30,0.97)" : "rgba(255,255,255,0.97)";
  const sidebarBorder = dm ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)";
  const cardBg = dm ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.9)";
  const cardBorder = dm ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.12)";
  const textPrimary = dm ? "#f1f5f9" : "#1e293b";
  const textSecondary = dm ? "#94a3b8" : "#64748b";
  const navActiveBg = dm ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)";
  const dividerColor = dm ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)";

  const navItems = [
    {
      id: "overview", label: "Overview",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
    },
    {
      id: "services", label: "Services",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
    },
    {
      id: "incidents", label: "Incidents",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    },
    {
      id: "metrics", label: "Metrics",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    },
    {
      id: "alerts", label: "Alerts",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    },
    {
      id: "agent", label: "Server",
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    },
  ];

  const statCards = summary ? [
    {
      label: "Total Services", value: summary.totalServices, color: "#6366f1", glow: "rgba(99,102,241,0.25)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
    },
    {
      label: "Online", value: summary.onlineServices, color: "#22c55e", glow: "rgba(34,197,94,0.25)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    },
    {
      label: "Avg Uptime", value: summary.avgUptime + "%", color: "#06b6d4", glow: "rgba(6,182,212,0.25)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
    },
    {
      label: "Avg Response", value: summary.avgResponse + "ms", color: "#f59e0b", glow: "rgba(245,158,11,0.25)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
    },
    {
      label: "Active Alerts", value: summary.activeIncidents, color: summary.activeIncidents > 0 ? "#ef4444" : "#22c55e", glow: summary.activeIncidents > 0 ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.15)",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    },
  ] : [];

  const openIncidents = incidents.filter(i => i.status === "open").length;
  const pageTitle = { overview: "Overview", services: "Services", incidents: "Incidents", metrics: "Metrics", alerts: "Alert Rules", agent: "Server Monitor" }[activeTab];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: bg, fontFamily: "'Inter', sans-serif" }}>

      {/* Sidebar */}
      <div style={{
        width: 240, background: sidebarBg, backdropFilter: "blur(20px)",
        borderRight: "1px solid " + sidebarBorder,
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
        boxShadow: dm ? "4px 0 30px rgba(0,0,0,0.4)" : "4px 0 20px rgba(99,102,241,0.06)",
      }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid " + sidebarBorder }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, color: "#fff", fontSize: 16,
              boxShadow: "0 0 20px rgba(99,102,241,0.5)",
              fontFamily: "'Space Grotesk', sans-serif",
              flexShrink: 0,
            }}>T</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.3px" }}>TenantOPS</div>
              <div style={{ fontSize: 9, color: "#6366f1", fontWeight: 700, letterSpacing: "0.1em" }}>INFRASTRUCTURE</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "10px 10px", flex: 1 }}>
          <div style={{ fontSize: 10, color: textSecondary, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 12px 4px" }}>Navigation</div>
          {navItems.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 10, cursor: "pointer",
              marginBottom: 2, transition: "all 0.15s",
              color: activeTab === item.id ? "#6366f1" : textSecondary,
              background: activeTab === item.id ? navActiveBg : "transparent",
              border: activeTab === item.id ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
              fontWeight: activeTab === item.id ? 600 : 400,
              fontSize: 13,
            }} onClick={() => switchTab(item.id)}>
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === "incidents" && openIncidents > 0 && (
                <div style={{ background: "#ef4444", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{openIncidents}</div>
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 16px 18px", borderTop: "1px solid " + sidebarBorder }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0,
            }}>{tenant && tenant.company ? tenant.company[0].toUpperCase() : "T"}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: textPrimary, fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tenant && tenant.company}</div>
              <div style={{ color: "#6366f1", fontSize: 10, fontWeight: 600, textTransform: "capitalize", letterSpacing: "0.05em" }}>{tenant && tenant.plan} plan</div>
            </div>
          </div>
          <button onClick={onLogout} style={{
            width: "100%", padding: "7px", background: "transparent",
            border: "1px solid " + sidebarBorder, borderRadius: 8,
            color: textSecondary, cursor: "pointer", fontSize: 12,
          }}>Sign out</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>

        {/* Header */}
        <div style={{
          padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
          background: dm ? "rgba(8,15,26,0.95)" : "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid " + cardBorder,
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div>
            <h1 style={{
              fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6, #a78bfa)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              fontFamily: "'Space Grotesk', sans-serif", margin: 0,
            }}>{pageTitle}</h1>
            <p style={{ color: textSecondary, fontSize: 12, marginTop: 2, margin: 0 }}>
              Welcome back, <span style={{ color: textPrimary, fontWeight: 500 }}>{user && user.name}</span>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setDarkMode(!dm)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 10, cursor: "pointer",
              background: dm ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)", color: textSecondary, fontSize: 12, fontWeight: 500,
            }}>
              {dm ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
              {dm ? "Light" : "Dark"}
            </button>

            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: 20, padding: "6px 12px", color: "#4ade80", fontSize: 12, fontWeight: 500,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }}></div>
              Live
            </div>

            {activeTab === "services" && (
              <button onClick={() => setShowAdd(true)} style={{
                padding: "8px 16px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
              }}>+ Add Service</button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 28px", flex: 1 }}>

          {activeTab === "overview" && summary && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 20 }}>
                {statCards.map((stat, i) => (
                  <div key={i} style={{
                    background: cardBg, backdropFilter: "blur(10px)",
                    borderRadius: 16, padding: 18,
                    border: "1px solid " + cardBorder,
                    boxShadow: dm ? "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.03)" : "0 4px 20px rgba(99,102,241,0.06)",
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10, marginBottom: 12,
                      background: stat.color + "18",
                      border: "1px solid " + stat.color + "35",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: stat.color, boxShadow: "0 0 12px " + stat.glow,
                    }}>{stat.icon}</div>
                    <div style={{
                      fontSize: 28, fontWeight: 800, color: textPrimary, marginBottom: 3,
                      fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.5px",
                    }}>{stat.value}</div>
                    <div style={{ color: textSecondary, fontSize: 11, fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{
                  background: cardBg, backdropFilter: "blur(10px)",
                  borderRadius: 16, padding: 22,
                  border: "1px solid " + cardBorder,
                  boxShadow: dm ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(99,102,241,0.05)",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 3, height: 14, background: "linear-gradient(to bottom, #6366f1, #8b5cf6)", borderRadius: 2 }}></div>
                    Services Health
                  </div>
                  {summary.services.length === 0 && (
                    <div style={{ color: textSecondary, fontSize: 13, textAlign: "center", padding: "16px 0" }}>No services yet. Go to Services tab.</div>
                  )}
                  {summary.services.map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid " + dividerColor }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: statusColor(s.status), flexShrink: 0, boxShadow: "0 0 6px " + statusColor(s.status) }}></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: textPrimary, fontSize: 13, fontWeight: 500 }}>{s.name}</div>
                        <div style={{ color: textSecondary, fontSize: 11, marginTop: 1 }}>{s.type}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: statusColor(s.status), fontWeight: 600, fontSize: 12 }}>{s.status}</div>
                        <div style={{ color: textSecondary, fontSize: 11 }}>{s.uptime_percent}% uptime</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: cardBg, backdropFilter: "blur(10px)",
                  borderRadius: 16, padding: 22,
                  border: "1px solid " + cardBorder,
                  boxShadow: dm ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(99,102,241,0.05)",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: textPrimary, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 3, height: 14, background: "linear-gradient(to bottom, #ef4444, #f97316)", borderRadius: 2 }}></div>
                    Recent Incidents
                  </div>
                  {incidents.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.5" style={{ margin: "0 auto 10px", display: "block" }}>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                      <div style={{ color: "#22c55e", fontWeight: 600, fontSize: 13 }}>All systems operational</div>
                      <div style={{ color: textSecondary, fontSize: 12, marginTop: 3 }}>No active incidents</div>
                    </div>
                  ) : incidents.slice(0, 5).map(inc => (
                    <div key={inc.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid " + dividerColor }}>
                      <div style={{
                        padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase", flexShrink: 0,
                        background: inc.severity === "critical" ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)",
                        color: inc.severity === "critical" ? "#f87171" : "#fbbf24",
                        border: "1px solid " + (inc.severity === "critical" ? "rgba(239,68,68,0.25)" : "rgba(245,158,11,0.25)"),
                      }}>{inc.severity}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: textPrimary, fontSize: 12, fontWeight: 500 }}>{inc.title}</div>
                        <div style={{ color: textSecondary, fontSize: 11, marginTop: 1 }}>{inc.service_name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "services" && (
            <div>
              {(!summary || summary.services.length === 0) && (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={textSecondary} strokeWidth="1" style={{ margin: "0 auto 16px", display: "block" }}>
                    <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                  </svg>
                  <div style={{ fontSize: 18, fontWeight: 600, color: textSecondary, marginBottom: 8 }}>No services monitored yet</div>
                  <div style={{ color: textSecondary, fontSize: 14, marginBottom: 24, opacity: 0.7 }}>Add your first service to start monitoring</div>
                  <button onClick={() => setShowAdd(true)} style={{
                    padding: "12px 28px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                  }}>+ Add Your First Service</button>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {summary && summary.services.map(s => (
                  <ServiceCard key={s.id} service={s} onDelete={handleDeleteService} onSelect={() => {}} />
                ))}
              </div>
            </div>
          )}

          {activeTab === "incidents" && <IncidentList incidents={incidents} onResolve={handleResolve} />}
          {activeTab === "metrics" && <MetricsChart services={(summary && summary.services) || []} />}
          {activeTab === "alerts" && <AlertsPage darkMode={darkMode} />}
          {activeTab === "agent" && <AgentDashboard />}
        </div>
      </div>

      {showAdd && <AddServiceModal onClose={() => setShowAdd(false)} onAdd={() => { setShowAdd(false); fetchData(); }} />}
    </div>
  );
}
