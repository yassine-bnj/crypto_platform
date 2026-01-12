# Performance Testing Guide

## Locust Load Testing

### Installation

```bash
pip install locust
```

### Running Load Tests

#### 1. **Web UI (Interactive)**
```bash
locust -f locustfile.py --host=http://localhost:8000
```
Then open `http://localhost:8089` in your browser to:
- Set number of users
- Set spawn rate (users/second)
- Start test
- Monitor real-time metrics (RPS, response times, failures)

#### 2. **Headless Mode (Automated)**
```bash
locust -f locustfile.py \
  --host=http://localhost:8000 \
  --users 100 \
  --spawn-rate 10 \
  --run-time 5m \
  --headless
```

**Parameters:**
- `--users 100`: Total concurrent users
- `--spawn-rate 10`: Add 10 users per second
- `--run-time 5m`: Run for 5 minutes
- `--headless`: No web UI

#### 3. **With CSV Output**
```bash
locust -f locustfile.py \
  --host=http://localhost:8000 \
  --users 50 \
  --spawn-rate 5 \
  --run-time 10m \
  --headless \
  --csv=results
```

This creates:
- `results_stats.csv` - Summary statistics
- `results_stats_history.csv` - Metrics over time
- `results_failures.csv` - Failed requests

---

## Test Scenarios Included

### 1. **CryptoPlatformUser** (Regular Users)
Simulates normal user behavior:
- **Assets list** (weight: 3) - Most frequent
- **Price history** (weight: 2)
- **OHLC data** (weight: 2)
- **Heatmap** (weight: 2)
- **Technical indicators** (weight: 1)
- **Alerts management** (weight: 1)
- **Virtual portfolio** (weight: 1)
- **Notifications** (weight: 1)
- **Create alerts** (weight: 0.5) - Less frequent

### 2. **AdminUser** (Admin Dashboard)
Monitors system health:
- **Dashboard stats** (weight: 2)
- **Users list** (weight: 1)
- **Prometheus metrics** (weight: 1)

---

## Performance Metrics to Monitor

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| **Response Time (p50)** | < 200ms | 200-500ms | > 500ms |
| **Response Time (p95)** | < 500ms | 500-1000ms | > 1000ms |
| **Response Time (p99)** | < 1000ms | 1-2s | > 2s |
| **Failure Rate** | < 1% | 1-5% | > 5% |
| **Requests/sec** | ↑ Higher is better | Monitor trends | Plateau = capacity |
| **Memory** | Stable | Growing slowly | Growing rapidly (leak) |

---

## Example Test Plans

### Light Load (Development)
```bash
locust -f locustfile.py --host=http://localhost:8000 \
  --users 10 --spawn-rate 1 --run-time 2m --headless
```

### Medium Load (Staging)
```bash
locust -f locustfile.py --host=http://localhost:8000 \
  --users 100 --spawn-rate 10 --run-time 5m --headless
```

### High Load (Stress Testing)
```bash
locust -f locustfile.py --host=http://localhost:8000 \
  --users 500 --spawn-rate 50 --run-time 10m --headless
```

### Soak Test (Long Duration)
```bash
locust -f locustfile.py --host=http://localhost:8000 \
  --users 50 --spawn-rate 5 --run-time 60m --headless
```

---

## Key Findings to Look For

1. **Identify Bottlenecks**
   - Which endpoints have highest latency?
   - Where do failures occur first?

2. **Capacity Planning**
   - At what user count does performance degrade?
   - What's the maximum RPS your backend handles?

3. **Resource Leaks**
   - Memory usage should stay stable
   - File descriptors should not grow unbounded
   - Database connections should be pooled

4. **Scaling Limits**
   - Single machine capacity
   - When to add more workers/replicas
   - Database query optimization needs

---

## Real-World Example Results

```
Type     | Name                    | # Requests | # Failures | Median | 95%  | 99%  | RPS
---------|------------------------|------------|------------|--------|------|------|-------
GET      | /api/assets/            | 15000      | 45 (0.3%)  | 45ms   | 120ms| 250ms| 500
GET      | /api/price-history/[s]  | 10000      | 20 (0.2%)  | 80ms   | 200ms| 450ms| 333
GET      | /api/heatmap/           | 10000      | 50 (0.5%)  | 120ms  | 350ms| 800ms| 333
POST     | /api/alerts/ [POST]     | 2500       | 75 (3.0%)  | 150ms  | 400ms| 900ms| 83
GET      | /api/admin/dashboard/   | 1000       | 10 (1.0%)  | 200ms  | 500ms| 1200ms| 33
```

---

## Docker Deployment

Run Locust in Docker:

```bash
docker build -t crypto-load-test -f Dockerfile.locust .
docker run -p 8089:8089 crypto-load-test \
  --host=http://backend:8000 \
  --users 100 --spawn-rate 10
```

---

## Next Steps

1. **Run baseline test** - Establish performance baseline
2. **Identify bottlenecks** - Which endpoints are slowest?
3. **Optimize** - Cache, query optimization, indexing
4. **Re-test** - Verify improvements
5. **Monitor production** - Set up Prometheus alerts for latency/errors
