import express from 'express';
import categoryRoutes from './routes/categoryRoutes.js';
import { client, httpRequestDurationMicroseconds } from './utils/metrics.js';

const app = express();
app.use(express.json());

// Connect to MongoDB

// Metrics middleware
app.use((req, res, next) => {
  const startHrTime = process.hrtime();

  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;

    httpRequestDurationMicroseconds
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(elapsedMs);
  });

  next();
});

// Route for Prometheus to scrape metrics
app.get('/api/categories/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Categories API routes
app.use('/api/categories', categoryRoutes);

export default app;
