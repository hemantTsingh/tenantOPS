const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

router.post('/register', async (req, res) => {
  const { name, email, password, company, plan } = req.body;
  try {
    const tenantResult = await pool.query(
      'INSERT INTO tenants (name, email, company, plan) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, company, plan || 'starter']
    );
    const tenant = tenantResult.rows[0];
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      'INSERT INTO users (tenant_id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [tenant.id, name, email, hashedPassword, 'admin']
    );
    const user = userResult.rows[0];
    const token = jwt.sign(
      { userId: user.id, tenantId: tenant.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await pool.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, resource, ip_address, details) VALUES ($1,$2,$3,$4,$5,$6)',
      [tenant.id, user.id, 'REGISTER', 'auth', req.ip || req.headers['x-forwarded-for'] || 'unknown', JSON.stringify({ email, company, plan })]
    );
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      tenant: { id: tenant.id, name: tenant.name, company: tenant.company, plan: tenant.plan }
    });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query(
      `SELECT u.*, t.name as tenant_name, t.company, t.plan
       FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = $1`,
      [email]
    );
    if (!userResult.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await pool.query(
        'INSERT INTO audit_logs (tenant_id, user_id, action, resource, ip_address, details) VALUES ($1,$2,$3,$4,$5,$6)',
        [user.tenant_id, user.id, 'LOGIN_FAILED', 'auth', req.ip || req.headers['x-forwarded-for'] || 'unknown', JSON.stringify({ email })]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    await pool.query(
      'INSERT INTO audit_logs (tenant_id, user_id, action, resource, ip_address, details) VALUES ($1,$2,$3,$4,$5,$6)',
      [user.tenant_id, user.id, 'LOGIN', 'auth', req.ip || req.headers['x-forwarded-for'] || 'unknown', JSON.stringify({ email, company: user.company })]
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      tenant: { id: user.tenant_id, name: user.tenant_name, company: user.company, plan: user.plan }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
