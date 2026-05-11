const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'tenantops',
  user: process.env.DB_USER || 'tenantops_admin',
  password: process.env.DB_PASSWORD,
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        company VARCHAR(255) NOT NULL,
        plan VARCHAR(50) DEFAULT 'starter',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        endpoint VARCHAR(500),
        status VARCHAR(50) DEFAULT 'monitoring',
        uptime_percent DECIMAL(5,2) DEFAULT 100.00,
        response_time INTEGER DEFAULT 0,
        last_checked TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id),
        service_id INTEGER REFERENCES services(id),
        title VARCHAR(255) NOT NULL,
        severity VARCHAR(50) DEFAULT 'warning',
        status VARCHAR(50) DEFAULT 'open',
        detected_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP,
        description TEXT
      );
      
      
      
      CREATE TABLE IF NOT EXISTS agent_reports (
        server VARCHAR(255) PRIMARY KEY,
        hostname VARCHAR(255),
        data JSONB,
        reported_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS alert_rules (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id),
        name VARCHAR(255) NOT NULL,
        metric VARCHAR(100) NOT NULL,
        operator VARCHAR(20) NOT NULL,
        threshold DECIMAL(10,2) NOT NULL,
        duration_minutes INTEGER DEFAULT 0,
        severity VARCHAR(50) DEFAULT 'warning',
        notify_email BOOLEAN DEFAULT true,
        notify_slack BOOLEAN DEFAULT false,
        slack_webhook VARCHAR(500),
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS alert_history (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id),
        rule_id INTEGER REFERENCES alert_rules(id),
        service_id INTEGER,
        server VARCHAR(255),
        metric VARCHAR(100),
        value DECIMAL(10,2),
        threshold DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'fired',
        fired_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        tenant_id INTEGER REFERENCES tenants(id),
        user_id INTEGER,
        action VARCHAR(255) NOT NULL,
        resource VARCHAR(255),
        ip_address VARCHAR(50),
        details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS syslogs (
        id SERIAL PRIMARY KEY,
        server VARCHAR(255),
        level VARCHAR(50),
        message TEXT,
        source VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS metrics (
        id SERIAL PRIMARY KEY,
        service_id INTEGER REFERENCES services(id),
        cpu_usage DECIMAL(5,2),
        memory_usage DECIMAL(5,2),
        response_time INTEGER,
        requests_per_min INTEGER,
        error_rate DECIMAL(5,2),
        recorded_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
