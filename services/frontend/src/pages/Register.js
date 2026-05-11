import React, { useState } from 'react';
import API from '../api';

export default function Register({ onLogin, onSwitch }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', plan: 'starter' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/api/auth/register', form);
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>T</div>
          <span style={styles.logoText}>TenantOPS</span>
        </div>
        <p style={styles.subtitle}>Start monitoring your infrastructure</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          {[
            { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Hemant Singh' },
            { key: 'company', label: 'Company Name', type: 'text', placeholder: 'Acme Corp' },
            { key: 'email', label: 'Work Email', type: 'email', placeholder: 'hemant@acme.com' },
            { key: 'password', label: 'Password', type: 'password', placeholder: 'password' },
          ].map(f => (
            <div key={f.key} style={styles.field}>
              <label style={styles.label}>{f.label}</label>
              <input style={styles.input} type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})} required />
            </div>
          ))}
          <div style={styles.field}>
            <label style={styles.label}>Plan</label>
            <select style={styles.input} value={form.plan} onChange={e => setForm({...form, plan: e.target.value})}>
              <option value="starter">Starter - Free</option>
              <option value="growth">Growth - $199/mo</option>
              <option value="enterprise">Enterprise - $999/mo</option>
            </select>
          </div>
          <button style={loading ? styles.btnDisabled : styles.btn} disabled={loading}>
            {loading ? 'Creating account...' : 'Start Free Trial'}
          </button>
        </form>
        <p style={styles.switchText}>
          Already have an account? <span style={styles.link} onClick={onSwitch}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
  card: { background: '#1e293b', borderRadius: 16, padding: 40, width: 440, border: '1px solid #334155' },
  logo: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  logoIcon: { width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#fff' },
  logoText: { fontSize: 24, fontWeight: 700, color: '#f1f5f9' },
  subtitle: { color: '#64748b', fontSize: 14, marginBottom: 32 },
  error: { background: '#450a0a', border: '1px solid #991b1b', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, marginBottom: 20, fontSize: 14 },
  field: { marginBottom: 16 },
  label: { display: 'block', color: '#94a3b8', fontSize: 13, marginBottom: 6, fontWeight: 500 },
  input: { width: '100%', padding: '10px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, outline: 'none' },
  btn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
  btnDisabled: { width: '100%', padding: '12px', background: '#334155', border: 'none', borderRadius: 8, color: '#64748b', fontSize: 15, fontWeight: 600, cursor: 'not-allowed', marginTop: 8 },
  switchText: { textAlign: 'center', marginTop: 24, color: '#64748b', fontSize: 14 },
  link: { color: '#6366f1', cursor: 'pointer', fontWeight: 500 },
};
