import React, { useState } from 'react';
import API from '../api';

export default function AddServiceModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', type: 'API', endpoint: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/api/services', form);
      onAdd();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Add Service</h2>
          <button style={styles.closeBtn} onClick={onClose}>X</button>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Service Name</label>
            <input style={styles.input} placeholder="Payment API" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Type</label>
            <select style={styles.input} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {['API', 'Database', 'Web Server', 'Microservice', 'Queue', 'Cache', 'Other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Endpoint URL (optional)</label>
            <input style={styles.input} placeholder="https://api.yourapp.com/health" value={form.endpoint} onChange={e => setForm({...form, endpoint: e.target.value})} />
          </div>
          <div style={styles.btnRow}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Adding...' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#1e293b', borderRadius: 16, padding: 32, width: 460, border: '1px solid #334155' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 700, color: '#f1f5f9' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 },
  error: { background: '#450a0a', border: '1px solid #991b1b', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 14 },
  field: { marginBottom: 20 },
  label: { display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, outline: 'none' },
  btnRow: { display: 'flex', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: '10px', background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 14 },
  submitBtn: { flex: 1, padding: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
};
