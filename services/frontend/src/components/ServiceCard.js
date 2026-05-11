import React from 'react';

export default function ServiceCard({ service, onDelete, onSelect }) {
  const statusColor = service.status === 'online' ? '#22c55e' : service.status === 'error' ? '#ef4444' : '#f59e0b';
  const statusBg = service.status === 'online' ? '#052e16' : service.status === 'error' ? '#450a0a' : '#431407';

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.cardLeft}>
          <div style={{...styles.statusDot, background: statusColor}}></div>
          <div>
            <div style={styles.name}>{service.name}</div>
            <div style={styles.type}>{service.type}</div>
          </div>
        </div>
        <div style={{...styles.statusBadge, background: statusBg, color: statusColor}}>{service.status}</div>
      </div>
      {service.endpoint && <div style={styles.endpoint}>{service.endpoint}</div>}
      <div style={styles.stats}>
        <div style={styles.stat}>
          <div style={styles.statValue}>{service.uptime_percent}%</div>
          <div style={styles.statLabel}>Uptime</div>
        </div>
        <div style={styles.statDivider}></div>
        <div style={styles.stat}>
          <div style={styles.statValue}>{service.response_time}ms</div>
          <div style={styles.statLabel}>Response</div>
        </div>
        <div style={styles.statDivider}></div>
        <div style={styles.stat}>
          <div style={styles.statValue}>{service.last_checked ? 'Active' : 'Pending'}</div>
          <div style={styles.statLabel}>Status</div>
        </div>
      </div>
      <div style={styles.actions}>
        <button style={styles.viewBtn} onClick={() => onSelect(service)}>View Metrics</button>
        <button style={styles.deleteBtn} onClick={() => onDelete(service.id)}>Remove</button>
      </div>
    </div>
  );
}

const styles = {
  card: { background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  statusDot: { width: 8, height: 8, borderRadius: '50%' },
  name: { color: '#f1f5f9', fontWeight: 600, fontSize: 15 },
  type: { color: '#64748b', fontSize: 12, marginTop: 2 },
  statusBadge: { padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  endpoint: { color: '#64748b', fontSize: 12, marginBottom: 16, wordBreak: 'break-all' },
  stats: { display: 'flex', justifyContent: 'space-between', background: '#0f172a', borderRadius: 8, padding: '12px 16px', marginBottom: 16 },
  stat: { textAlign: 'center' },
  statValue: { color: '#f1f5f9', fontWeight: 600, fontSize: 15 },
  statLabel: { color: '#64748b', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, background: '#334155' },
  actions: { display: 'flex', gap: 8 },
  viewBtn: { flex: 1, padding: '8px', background: '#334155', border: 'none', borderRadius: 6, color: '#f1f5f9', fontSize: 13, cursor: 'pointer' },
  deleteBtn: { padding: '8px 14px', background: 'transparent', border: '1px solid #991b1b', borderRadius: 6, color: '#f87171', fontSize: 13, cursor: 'pointer' },
};
