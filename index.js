require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { register, metricsMiddleware } = require('./metrics');

const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');

const app = express();

app.use(cors({
  origin: [
    'http://155.248.254.15',
    'http://155.248.254.15:5173',
    'http://localhost:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(metricsMiddleware);

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

app.use('/auth', authRoutes);
app.use('/todos', todoRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    error: `Route ${req.method} ${req.url} not found` 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Secure Todo API running on port ${PORT}`);
  console.log(`📋 Routes: POST /auth/register, POST /auth/login`);
  console.log(`🔒 Protected: GET/POST/PUT/DELETE /todos`);
  console.log(`📊 Metrics at: http://localhost:${PORT}/metrics`);
});