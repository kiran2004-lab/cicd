const express = require("express");
const client = require("prom-client");

const app = express();

// Create a registry
const register = new client.Registry();

// Collect default Node.js & process metrics
client.collectDefaultMetrics({
  app: 'node_app_monitor',
  prefix: 'node_',
  timeout: 5000,
  register,
});

// Request Counter
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Error Counter
const httpErrorCounter = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors',
  labelNames: ['method', 'route', 'status_code'],
});

// Request Duration Histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 5],
});

// Custom Gauge: Current Active Users (example)
const activeUsers = new client.Gauge({
  name: 'app_active_users',
  help: 'Number of active users in the app',
});

// Register all metrics
register.registerMetric(httpRequestCounter);
register.registerMetric(httpErrorCounter);
register.registerMetric(httpRequestDuration);
register.registerMetric(activeUsers);

// Middleware to measure request duration
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const labels = {
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    };

    httpRequestCounter.inc(labels);

    if (res.statusCode >= 400) {
      httpErrorCounter.inc(labels);
    }

    end(labels);
  });
  next();
});

// Example API route
app.get("/api/hello", (req, res) => {
  activeUsers.set(Math.floor(Math.random() * 100)); // demo gauge value
  res.json({ message: "Hello, JMet" });
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

