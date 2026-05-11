import React from 'react';

export default function IncidentList({ incidents, onResolve }) {
  if (incidents.length === 0) {
    return (
      <div style={styles.empty}>
        <div style={styles.emptyIcon}>OK</div>
        <div style={styles.emptyTitle}>All systems operational</div>
        <div style={styles.emptyDesc}>No active incidents at this time</div>
      </div>
    );
  }
  return (
    <div>
      {incidents.map(inc => (
        <div key={inc.id} style={styles.card}>
          <div style={styles.cardLeft}>
            <div style={{...styles.severity, background: inc.severity === 'critical' ? '#450a0a' : '#431407', color: inc.severity === 'critical' ? '#fca5a5' : '#fdba74'}}>
              {inc.severity}
            </div>
            <div>
              <div style={styles.title}>{inc.title}</div>
              <div style={styles.meta}>{inc.service_name} - {new Date(inc.detected_at).toLocaleString()}</div>
              {inc.description && <div style={styles.desc}>{inc.description}</div>}
            </div>
          </div>
          <div style={styles.cardRight}>
            <div style={{...styles.statusBadge, background: inc.status === 'open' ? '#450a0a' : '#052e16', color: inc.status === 'open' ? '#fca5a5' : '#4ade80'}}>
              {inc.status}
            </div>
            {inc.status === 'open' && (
              <button style={styles.resolveBtn} onClick={() => onResolve(inc.id)}>Resolve</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  empty: { textAlign: 'center', padding: '80px 0' },
  emptyIcon: { fontSize: 48, color: '#22c55e', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 600, color: '#94a3b8', marginBottom: 8 },
  emptyDesc: { color: '#64748b', fontSize: 14 },
  card: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', marginBottom: 12 },
  cardLeft: { display: 'flex', gap: 16, flex: 1 },
  severity: { padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', height: 'fit-content', flexShrink: 0 },
  title: { color: '#f1f5f9', fontWeight: 600, fontSize: 15, marginBottom: 4 },
  meta: { color: '#64748b', fontSize: 13 },
  desc: { color: '#94a3b8', fontSize: 13, marginTop: 6 },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, marginLeft: 16 },
  statusBadge: { padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  resolveBtn: { padding: '8px 16px', background: '#052e16', border: '1px solid #166534', borderRadius: 6, color: '#4ade80', fontSize: 13, cursor: 'pointer', fontWeight: 500 },
};
