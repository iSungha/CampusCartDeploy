const client = require("prom-client");

// Collect standard Node.js metrics such as CPU and memory usage.
client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: "campuscart_http_requests_total",
  help: "Total number of HTTP requests handled by CampusCart",
  labelNames: ["method", "route", "status_code"]
});

const httpRequestDuration = new client.Histogram({
  name: "campuscart_http_request_duration_seconds",
  help: "CampusCart HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [
    0.005,
    0.01,
    0.025,
    0.05,
    0.1,
    0.25,
    0.5,
    1,
    2.5,
    5,
    10
  ]
});

// Explicit memory metric for the CampusCart backend process.
new client.Gauge({
  name: "campuscart_process_memory_bytes",
  help: "Resident memory used by the CampusCart Node.js process in bytes",

  collect() {
    this.set(process.memoryUsage().rss);
  }
});

function getRouteLabel(req) {
  if (req.route?.path) {
    return `${req.baseUrl || ""}${req.route.path}`;
  }

  return req.path || "unmatched";
}

function metricsMiddleware(req, res, next) {
  // Do not include Prometheus scrapes in application request statistics.
  if (req.path === "/metrics") {
    return next();
  }

  const endTimer = httpRequestDuration.startTimer();

  res.once("finish", () => {
    const labels = {
      method: req.method,
      route: getRouteLabel(req),
      status_code: String(res.statusCode)
    };

    httpRequestsTotal.inc(labels);
    endTimer(labels);
  });

  next();
}

async function metricsHandler(req, res) {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    console.error("Metrics collection failed:", error);

    res.status(500).json({
      message: "Unable to collect metrics"
    });
  }
}

module.exports = {
  metricsMiddleware,
  metricsHandler
};