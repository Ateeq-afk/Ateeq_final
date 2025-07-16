import express from 'express';
import cors from 'cors';

const app = express();

// Basic CORS for development
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'DesiCargo API Server', status: 'running' });
});

// Basic test endpoints for debugging
app.get('/api/dashboard/metrics', (req, res) => {
  res.json({ status: 'ok', data: {} });
});

app.get('/api/dashboard/operational', (req, res) => {
  res.json({ status: 'ok', data: {} });
});

app.get('/api/dashboard/trends', (req, res) => {
  res.json({ status: 'ok', data: {} });
});

app.get('/article-tracking/current-locations', (req, res) => {
  res.json({ status: 'ok', data: [] });
});

app.get('/api/financial-reports/summary', (req, res) => {
  res.json({ status: 'ok', data: {} });
});

app.get('/api/financial-reports/pnl', (req, res) => {
  res.json({ status: 'ok', data: {} });
});

app.get('/api/expenses/analytics/trends', (req, res) => {
  res.json({ status: 'ok', data: {} });
});

app.get('/credit-summary', (req, res) => {
  res.json({ status: 'ok', data: {} });
});

app.get('/credit-analytics', (req, res) => {
  res.json({ status: 'ok', data: {} });
});

app.get('/credit-alerts', (req, res) => {
  res.json({ status: 'ok', data: [] });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
});