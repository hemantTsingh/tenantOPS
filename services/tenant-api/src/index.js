const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { initDB } = require('./db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/services/internal', require('./routes/internal'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/agent', require('./routes/agent'));
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'tenant-api' }));

const PORT = process.env.PORT || 4000;
initDB().then(() => {
  app.listen(PORT, () => console.log(`TenantOPS API running on port ${PORT}`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});
