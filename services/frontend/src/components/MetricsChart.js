import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import API from "../api";

const RANGES = [
  { label: "Last 30 min", minutes: 30 },
  { label: "Last 1 hour", minutes: 60 },
  { label: "Last 6 hours", minutes: 360 },
  { label: "Last 24 hours", minutes: 1440 },
  { label: "Last 7 days", minutes: 10080 },
  { label: "Custom", minutes: null },
];

export default function MetricsChart({ services }) {
  const [selected, setSelected] = useState("");
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState(RANGES[1]);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [limit, setLimit] = useState(100);

  const fetchMetrics = async (svcId) => {
    if (!svcId) return;
    setLoading(true);
    try {
      let params = { limit };
      if (range.minutes) {
        const from = new Date(Date.now() - range.minutes * 60 * 1000);
        params.from = from.toISOString();
        params.to = new Date().toISOString();
      } else if (customFrom && customTo) {
        params.from = new Date(customFrom).toISOString();
        params.to = new Date(customTo).toISOString();
      }
      const query = new URLSearchParams(params).toString();
      const res = await API.get(`/api/services/${svcId}/metrics?${query}`);
      const formatted = res.data.reverse().map((m, i) => ({
        time: new Date(m.recorded_at).toLocaleTimeString(),
        cpu: parseFloat(m.cpu_usage) || 0,
        memory: parseFloat(m.memory_usage) || 0,
        response: parseInt(m.response_time) || 0,
        requests: parseInt(m.requests_per_min) || 0,
        errors: parseFloat(m.error_rate) || 0,
      }));
      setMetrics(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected) fetchMetrics(selected);
  }, [selected, range, customFrom, customTo]);

  const selectedService = services.find(s => String(s.id) === String(selected));

  const charts = [
    { key: "cpu", label: "CPU Usage (%)", color: "#6366f1" },
    { key: "memory", label: "Memory Usage (%)", color: "#22c55e" },
    { key: "response", label: "Response Time (ms)", color: "#f59e0b" },
    { key: "requests", label: "Requests / min", color: "#06b6d4" },
    { key: "errors", label: "Error Rate (%)", color: "#ef4444" },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={s.tooltip}>
          <div style={s.tooltipTime}>{label}</div>
          {payload.map((p, i) => (
            <div key={i} style={{...s.tooltipRow, color: p.color}}>
              {p.name}: <strong>{p.value}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (services.length === 0) return (
    <div style={s.empty}>
      <div style={s.emptyTitle}>No services added yet</div>
      <div style={s.emptyDesc}>Add services in the Services tab to view metrics</div>
    </div>
  );

  return (
    <div>
      {/* Controls */}
      <div style={s.controls}>
        <div style={s.controlGroup}>
          <label style={s.label}>Service</label>
          <select style={s.select} value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">Select service...</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>

        <div style={s.controlGroup}>
          <label style={s.label}>Time Range</label>
          <select style={s.select} value={range.label} onChange={e => setRange(RANGES.find(r => r.label === e.target.value))}>
            {RANGES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
          </select>
        </div>

        {range.minutes === null && (
          <>
            <div style={s.controlGroup}>
              <label style={s.label}>From</label>
              <input style={s.input} type="datetime-local" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <div style={s.controlGroup}>
              <label style={s.label}>To</label>
              <input style={s.input} type="datetime-local" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          </>
        )}

        <div style={s.controlGroup}>
          <label style={s.label}>Max Points</label>
          <select style={s.select} value={limit} onChange={e => setLimit(e.target.value)}>
            {[50, 100, 200, 500].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <button style={s.refreshBtn} onClick={() => fetchMetrics(selected)} disabled={!selected}>
          Refresh
        </button>
      </div>

      {/* Service status bar */}
      {selectedService && (
        <div style={s.statusBar}>
          <div style={s.statusLeft}>
            <div style={{...s.dot, background: selectedService.status === "online" ? "#22c55e" : "#ef4444"}}></div>
            <div style={s.svcName}>{selectedService.name}</div>
            <div style={s.svcType}>{selectedService.type}</div>
          </div>
          <div style={s.statusRight}>
            <div style={s.statPill}>Uptime: {selectedService.uptime_percent}%</div>
            <div style={s.statPill}>Avg Response: {selectedService.response_time}ms</div>
            <div style={s.statPill}>Status: {selectedService.status}</div>
            <div style={s.statPill}>{metrics.length} data points</div>
          </div>
        </div>
      )}

      {!selected && (
        <div style={s.empty}>
          <div style={s.emptyTitle}>Select a service to view metrics</div>
          <div style={s.emptyDesc}>Use the dropdown above to choose which service to analyse</div>
        </div>
      )}

      {selected && loading && <div style={s.loading}>Loading metrics...</div>}

      {selected && !loading && metrics.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyTitle}>No data in this time range</div>
          <div style={s.emptyDesc}>Try a wider range or wait for the collector to run (every 30s)</div>
        </div>
      )}

      {selected && !loading && metrics.length > 0 && (
        <div>
          {charts.map(chart => (
            <div key={chart.key} style={s.chartCard}>
              <div style={s.chartHeader}>
                <div style={s.chartTitle}>{chart.label}</div>
                <div style={s.chartMeta}>
                  {metrics.length} points · {range.label}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={metrics} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} name={chart.label} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  controls: { display: "flex", alignItems: "flex-end", gap: 12, background: "#1e293b", borderRadius: 12, padding: 20, border: "1px solid #334155", marginBottom: 20, flexWrap: "wrap" },
  controlGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { color: "#94a3b8", fontSize: 12, fontWeight: 500 },
  select: { padding: "8px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 13, outline: "none" },
  input: { padding: "8px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 13, outline: "none" },
  refreshBtn: { padding: "8px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", alignSelf: "flex-end" },
  statusBar: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#1e293b", borderRadius: 10, padding: "12px 20px", border: "1px solid #334155", marginBottom: 16 },
  statusLeft: { display: "flex", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: "50%" },
  svcName: { color: "#f1f5f9", fontWeight: 600, fontSize: 14 },
  svcType: { color: "#64748b", fontSize: 12, marginLeft: 4 },
  statusRight: { display: "flex", gap: 8 },
  statPill: { background: "#0f172a", border: "1px solid #334155", borderRadius: 6, padding: "4px 10px", color: "#64748b", fontSize: 12 },
  empty: { textAlign: "center", padding: "60px 0" },
  emptyTitle: { fontSize: 18, fontWeight: 600, color: "#94a3b8", marginBottom: 8 },
  emptyDesc: { color: "#64748b", fontSize: 14 },
  loading: { textAlign: "center", color: "#64748b", padding: "40px", fontSize: 14 },
  chartCard: { background: "#1e293b", borderRadius: 12, padding: 24, border: "1px solid #334155", marginBottom: 16 },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  chartTitle: { color: "#f1f5f9", fontSize: 14, fontWeight: 600 },
  chartMeta: { color: "#64748b", fontSize: 12 },
  tooltip: { background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px" },
  tooltipTime: { color: "#64748b", fontSize: 11, marginBottom: 6 },
  tooltipRow: { fontSize: 13, marginBottom: 2 },
};
