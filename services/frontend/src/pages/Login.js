import React, { useState, useEffect } from 'react';
import API from '../api';

const NEWS = [
  "AI-powered threat detection reduces incident response time by 73%",
  "Zero-trust architecture becomes standard for enterprise monitoring",
  "Real-time observability cuts MTTR from hours to minutes",
  "Machine learning anomaly detection prevents 89% of outages",
  "Cloud-native monitoring sees 340% adoption growth in 2026",
  "Automated runbooks resolve 60% of incidents without human intervention",
  "eBPF-based monitoring delivers kernel-level visibility with zero overhead",
];

export default function Login({ onLogin, onSwitch, darkMode, setDarkMode }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newsIndex, setNewsIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => { setNewsIndex(i => (i + 1) % NEWS.length); setFade(true); }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/api/auth/login', form);
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const dm = darkMode;
  const bg = dm ? 'linear-gradient(135deg, #020817 0%, #0f172a 50%, #1a0533 100%)' : 'linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 50%, #fdf4ff 100%)';
  const cardBg = dm ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.85)';
  const cardBorder = dm ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)';
  const textPrimary = dm ? '#f1f5f9' : '#1e293b';
  const textSecondary = dm ? '#94a3b8' : '#64748b';
  const inputBg = dm ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: bg, fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>

      <div style={{ position: 'absolute', inset: 0, zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)',
        backgroundSize: '50px 50px' }}/>

      <div style={{ position: 'absolute', top: '15%', left: '10%', width: 350, height: 350, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0 }}/>
      <div style={{ position: 'absolute', bottom: '15%', right: '5%', width: 450, height: 450, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', filter: 'blur(70px)', zIndex: 0 }}/>

      <button onClick={() => setDarkMode(!dm)} style={{
        position: 'absolute', top: 24, right: 24, zIndex: 10,
        background: dm ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        border: '1px solid ' + cardBorder, borderRadius: 10, padding: '8px 16px',
        cursor: 'pointer', color: textSecondary, fontSize: 13, backdropFilter: 'blur(10px)',
      }}>{dm ? 'Light Mode' : 'Dark Mode'}</button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 60px 60px 80px', position: 'relative', zIndex: 1 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 56 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, color: '#fff',
            boxShadow: '0 0 30px rgba(99,102,241,0.5)', fontFamily: "'Space Grotesk', sans-serif" }}>T</div>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: textPrimary, letterSpacing: '-0.5px', fontFamily: "'Space Grotesk', sans-serif" }}>TenantOPS</div>
            <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, letterSpacing: '0.05em' }}>INFRASTRUCTURE INTELLIGENCE</div>
          </div>
        </div>

        <h1 style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.05, marginBottom: 20,
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-1.5px', fontFamily: "'Space Grotesk', sans-serif" }}>
          Monitor Everything.<br/>Miss Nothing.
        </h1>

        <p style={{ fontSize: 18, color: textSecondary, lineHeight: 1.7, maxWidth: 440, marginBottom: 48 }}>
          Real-time infrastructure monitoring, intelligent alerting, and deep observability for modern teams.
        </p>

        <div style={{ background: dm ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.06)',
          border: '1px solid ' + (dm ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)'),
          borderRadius: 16, padding: '20px 24px', backdropFilter: 'blur(10px)', maxWidth: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }}/>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI and DevOps Intelligence</span>
          </div>
          <div style={{ fontSize: 15, color: dm ? '#cbd5e1' : '#475569', lineHeight: 1.7, fontStyle: 'italic',
            opacity: fade ? 1 : 0, transition: 'opacity 0.5s ease', minHeight: 52 }}>
            "{NEWS[newsIndex]}"
          </div>
        </div>

        <div style={{ display: 'flex', gap: 40, marginTop: 48 }}>
          {[{value:'99.9%',label:'Uptime SLA'},{value:'<30s',label:'Alert latency'},{value:'3',label:'Servers connected'}].map((st,i) => (
            <div key={i}>
              <div style={{ fontSize: 26, fontWeight: 700, color: textPrimary, fontFamily: "'Space Grotesk', sans-serif" }}>{st.value}</div>
              <div style={{ fontSize: 12, color: textSecondary, marginTop: 3 }}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 60px 40px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', background: cardBg, backdropFilter: 'blur(24px)',
          border: '1px solid ' + cardBorder, borderRadius: 28, padding: '44px 40px',
          boxShadow: dm ? '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 30px 60px rgba(99,102,241,0.12)' }}>

          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, margin: '0 auto 18px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
              border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="3" stroke="#6366f1" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16.5" r="1.5" fill="#6366f1"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: textPrimary, marginBottom: 6, fontFamily: "'Space Grotesk', sans-serif" }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: textSecondary }}>Sign in to your TenantOPS account</p>
          </div>

          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171', padding: '10px 14px', borderRadius: 10, marginBottom: 20, fontSize: 14 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: textSecondary, fontSize: 13, marginBottom: 7, fontWeight: 500 }}>Email address</label>
              <input style={{ width: '100%', padding: '12px 16px', background: inputBg,
                border: '1px solid ' + cardBorder, borderRadius: 12, color: textPrimary, fontSize: 14, outline: 'none' }}
                type="email" placeholder="you@company.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', color: textSecondary, fontSize: 13, marginBottom: 7, fontWeight: 500 }}>Password</label>
              <input style={{ width: '100%', padding: '12px 16px', background: inputBg,
                border: '1px solid ' + cardBorder, borderRadius: 12, color: textPrimary, fontSize: 14, outline: 'none' }}
                type="password" placeholder="Enter your password"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>
            <button style={{ width: '100%', padding: '14px',
              background: loading ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', borderRadius: 14, color: '#fff', fontSize: 15, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 25px rgba(99,102,241,0.45)',
              transition: 'all 0.2s' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in to TenantOPS'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, color: textSecondary, fontSize: 14 }}>
            No account? <span style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }} onClick={onSwitch}>Start free trial</span>
          </p>
        </div>
      </div>
    </div>
  );
}
