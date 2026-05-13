const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const legacyRouter = require('./routes/legacy');
const googleRouter = require('./routes/google');

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'medical-health-management-backend' });
});

app.use('/api/google', googleRouter);
app.use('/', legacyRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

function startServer(listenPort = port) {
  return app.listen(listenPort, () => {
    console.log(`Backend listening on http://localhost:${listenPort}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
