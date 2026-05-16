/**
 * REZ Business AI - Standalone Server
 * Port 4059
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 4059;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiter
let requestCounts = new Map();
function rateLimiter(req, res, next) {
  const key = req.ip;
  const count = (requestCounts.get(key) || 0) + 1;
  requestCounts.set(key, count);
  if (count > 100) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
}
app.use(rateLimiter);

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'REZ Business AI', port: PORT });
});

// Decision Engine
const decisionEngine = {
  decide: (request) => {
    const start = Date.now();
    // Fast constraint check
    if (request.context?.margin < 0.1) {
      return { decision: 'reject', reasoning: 'Margin below threshold', latencyMs: Date.now() - start };
    }
    return {
      decision: 'execute',
      confidence: 0.85,
      reasoning: 'Best match for ' + request.type,
      latencyMs: Date.now() - start
    };
  }
};

// Campaign Bundles
const CAMPAIGN_BUNDLES = {
  weekend_rush: {
    name: 'Weekend Rush',
    impact: 8000,
    actions: ['Create campaign', 'Send WhatsApp', 'Push notification']
  },
  happy_hour: {
    name: 'Happy Hour',
    impact: 5000,
    actions: ['Adjust pricing', 'Send notification']
  },
  win_back: {
    name: 'Win-Back',
    impact: 5000,
    actions: ['Identify churned', 'Send offer', 'Track conversion']
  },
  festival_boost: {
    name: 'Festival Boost',
    impact: 25000,
    actions: ['Create campaign', 'Multi-channel push', 'Special offers']
  },
  rainy_day: {
    name: 'Rainy Day',
    impact: 10000,
    actions: ['Launch delivery campaign', 'Free delivery offer']
  }
};

// Memory Layer
const memory = new Map();

function recordAction(action, result) {
  const key = action.type;
  const existing = memory.get(key) || { count: 0, total: 0 };
  memory.set(key, {
    count: existing.count + 1,
    total: existing.total + (result.revenue || 0),
    avg: (existing.total + (result.revenue || 0)) / (existing.count + 1)
  });
}

// Routes
app.get('/api/health', (req, res) => {
  const merchantId = req.query.merchantId || 'demo';
  res.json({
    score: 87,
    revenue: 12500,
    customers: 45,
    streak: 7,
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/suggestions', (req, res) => {
  const suggestions = [
    {
      id: 'suggest-1',
      title: 'Weekend Rush Campaign',
      description: 'Launch campaign for weekend traffic',
      reasoning: 'Historical data shows +40% weekend traffic',
      estimatedImpact: { revenue: 8000, customers: 40 },
      confidence: 85,
      status: 'pending'
    },
    {
      id: 'suggest-2',
      title: 'Win-Back Campaign',
      description: '3 high-value customers inactive 14+ days',
      reasoning: 'High-value customers showing churn signals',
      estimatedImpact: { revenue: 5000, customers: 15 },
      confidence: 92,
      status: 'pending'
    },
    {
      id: 'suggest-3',
      title: 'Happy Hour Pricing',
      description: 'Adjust pricing for evening demand',
      reasoning: 'Time-based pricing opportunity',
      estimatedImpact: { revenue: 3000, customers: 20 },
      confidence: 72,
      status: 'pending'
    }
  ];
  res.json({ suggestions });
});

app.post('/api/actions/:id/approve', (req, res) => {
  const { id } = req.params;
  recordAction({ type: id }, { revenue: 5000 });
  res.json({ success: true, actionId: id });
});

app.post('/api/actions/:id/reject', (req, res) => {
  const { id } = req.params;
  res.json({ success: true, dismissed: id });
});

app.get('/api/bundles', (req, res) => {
  res.json({ bundles: CAMPAIGN_BUNDLES });
});

app.post('/api/decide', (req, res) => {
  const decision = decisionEngine.decide(req.body);
  res.json(decision);
});

app.get('/api/memory', (req, res) => {
  const learnings = [];
  for (const [key, value] of memory) {
    learnings.push({ action: key, ...value });
  }
  res.json({ learnings });
});

app.get('/api/attribution/:merchantId', (req, res) => {
  res.json({
    merchantId: req.params.merchantId,
    channels: {
      whatsapp: { revenue: 5000, conversions: 25 },
      push: { revenue: 3000, conversions: 40 },
      sms: { revenue: 2000, conversions: 15 },
      organic: { revenue: 10000, conversions: 80 }
    },
    totalRevenue: 20000,
    topChannel: 'organic'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal error' });
});

app.listen(PORT, () => {
  console.log(`REZ Business AI running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/api`);
});

module.exports = app;
