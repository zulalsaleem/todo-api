const client = require('prom-client');

// Registry = Container for ALL your metrics
// Like a folder that holds everything
const register = new client.Registry();

// Collect default Node.js metrics automatically!
// (memory, CPU, event loop, garbage collection)
// This one line gives you 30+ metrics for FREE!
client.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ─────────────────────────────────────────────
// METRIC 1: Request Counter
// TYPE: Counter (only goes up!)
// Counts every HTTP request with details
// ─────────────────────────────────────────────
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// ─────────────────────────────────────────────
// METRIC 2: Request Duration
// TYPE: Histogram (distribution of values)
// Measures how long each request takes
// Buckets = boundaries for grouping times
// ─────────────────────────────────────────────
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register],
});

// ─────────────────────────────────────────────
// METRIC 3: Active Requests
// TYPE: Gauge (goes up AND down)
// How many requests being processed RIGHT NOW
// ─────────────────────────────────────────────
const activeRequests = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests being processed',
  registers: [register],
});

// ─────────────────────────────────────────────
// METRIC 4: Auth Events
// TYPE: Counter
// Tracks login attempts, registrations
// ─────────────────────────────────────────────
const authEventsTotal = new client.Counter({
  name: 'auth_events_total',
  help: 'Total authentication events',
  labelNames: ['event', 'success'],
  registers: [register],
});

// ─────────────────────────────────────────────
// METRIC 5: Todo Operations
// TYPE: Counter
// Tracks create, update, delete operations
// ─────────────────────────────────────────────
const todoOperationsTotal = new client.Counter({
  name: 'todo_operations_total',
  help: 'Total todo CRUD operations',
  labelNames: ['operation'],
  registers: [register],
});

// ─────────────────────────────────────────────
// MIDDLEWARE: Records metrics for EVERY request
// Add this to Express BEFORE your routes!
// ─────────────────────────────────────────────
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  // Increment active requests counter
  activeRequests.inc();

  // When response finishes → record everything
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    // Normalize route (replace IDs with :id)
    // Without: /todos/1, /todos/2 = different routes!
    // With:    /todos/:id = same route ✅
    const route = req.route
      ? req.path.replace(/\/\d+/g, '/:id')
      : req.path;

    const labels = {
      method:      req.method,
      route:       route,
      status_code: res.statusCode,
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, duration);
    activeRequests.dec();
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware,
  metrics: {
    httpRequestsTotal,
    httpRequestDuration,
    activeRequests,
    authEventsTotal,
    todoOperationsTotal,
  },
};