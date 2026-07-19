# Observability Tool — AI-Powered Backend Monitoring Platform

![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Elasticsearch](https://img.shields.io/badge/Elasticsearch-8.13-005571?logo=elasticsearch&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-Streaming-231F20?logo=apachekafka&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?logo=redis&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-Monitoring-E6522C?logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-Dashboards-F46800?logo=grafana&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-AI-8E75B2?logo=googlegemini&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Deployment-326CE5?logo=kubernetes&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

### Your AI-Powered Backend Observability Copilot

A backend platform that watches your APIs and services, catches problems before you notice them, and explains what went wrong in plain English — powered by Gemini AI, backed by a full production-style monitoring stack.

Instead of manually digging through logs to figure out why a service slowed down or started failing, this tool collects logs and metrics automatically, flags anomalies on its own, and uses an LLM to explain what's happening and how to fix it.

---

## What it does

- Collects logs, metrics, and traces from any application via a simple ingestion API
- Detects anomalies automatically — traffic spikes, error rate increases, response time degradation
- Explains issues in plain English using Gemini AI — root cause analysis, incident summaries, recommendations
- Answers questions about your system in natural language — *"Why did response times increase yesterday?"*
- Searches logs instantly with full-text search via Elasticsearch
- Visualizes metrics live with Prometheus and Grafana dashboards
- Alerts on high error rates, downtime, and slow APIs, with auto-resolution when conditions clear
- Streams logs asynchronously through Kafka, decoupled from the request/response cycle
- Caches expensive queries and AI responses with Redis
- Deploys anywhere — Docker and Kubernetes manifests included

---

## How it fits together

Applications send logs and metrics to the API. Logs save to MongoDB immediately, then publish to Kafka so a separate consumer indexes them into Elasticsearch without slowing down the request. Metrics, incidents, alerts, and users live in PostgreSQL via Prisma. Redis caches expensive dashboard and AI queries. Prometheus scrapes live metrics and Grafana visualizes them. Gemini AI analyzes logs, summarizes incidents, and answers natural-language questions, always grounded in real recent data rather than guessing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | Node.js, Express.js |
| Relational data | PostgreSQL + Prisma ORM |
| Document data | MongoDB + Mongoose |
| Search | Elasticsearch |
| Event streaming | Kafka + Zookeeper |
| Caching | Redis |
| Monitoring | Prometheus |
| Dashboards | Grafana |
| AI | Google Gemini API |
| Auth | JWT + bcrypt |
| API docs | Swagger / OpenAPI |
| Testing | Jest, Postman, autocannon |
| Deployment | Docker, Docker Compose, Kubernetes |

---

## Quick Start

**Prerequisites:** Docker Desktop, a free [Gemini API key](https://ai.google.dev/)

```bash
git clone https://github.com/sneha-paul-2005/observability-tool.git
cd observability-tool
```

Create a `.env` file in the project root:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/observability_db
MONGODB_URI=mongodb://localhost:27017/observability_logs
JWT_SECRET=change_this_to_a_random_secret
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key_here
ELASTICSEARCH_URL=http://localhost:9200
KAFKA_BROKER=localhost:9092
REDIS_HOST=localhost
REDIS_PORT=6379
```

```bash
docker-compose up -d --build
docker exec -it observability_app npx prisma migrate deploy
```

| Service | URL |
|---|---|
| API | http://localhost:3000 |
| API docs | http://localhost:3000/api-docs |
| Grafana | http://localhost:3001 (admin / admin) |
| Prometheus | http://localhost:9090 |

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword","name":"Your Name"}'
```

A full Postman collection (`observability-tool.postman_collection.json`) is included for interactive testing.

---

## Running without Docker

```bash
docker-compose up -d postgres mongodb elasticsearch kafka zookeeper redis
npm install
npx prisma migrate dev
npm run dev
```

## Deploying to Kubernetes

```bash
kubectl apply -f k8s/
kubectl port-forward service/app 3000:3000
```
Deploys all nine services as separate pods with proper Kubernetes networking.

## Testing

```bash
npm test
npx autocannon -c 20 -d 15 -H "Authorization: Bearer <token>" http://localhost:3000/api/dashboard/overview
```
Full load, security, and AI-output validation results: `FINAL_TESTING_REPORT.md`

---

## API Overview

| Module | Base Route | What it's for |
|---|---|---|
| Auth | `/api/auth` | Registration, login, current user |
| Logs | `/api/logs` | Ingest and query application logs |
| Metrics | `/api/metrics` | Record and analyze API performance |
| Monitor | `/api/monitor` | Register and health-check external services |
| Dashboard | `/api/dashboard` | Health, error trends, performance, incident stats |
| Search | `/api/search` | Full-text log search via Elasticsearch |
| AI | `/api/ai` | Log analysis, explanations, recommendations, assistant |
| Incidents | `/api/incidents` | Incident tracking and AI-generated summaries |
| Alerts | `/api/alerts` | Threshold-based alerting |
| Health | `/health` | Database connectivity check |
| Metrics (Prometheus) | `/metrics` | Prometheus scrape endpoint |

Full interactive docs at `/api-docs` once running.

---

## Project Structure

- `src/config` — database, Kafka, Redis, Swagger configuration
- `src/controllers` — route handler logic
- `src/middleware` — authentication, request metrics collection
- `src/models` — Mongoose schemas
- `src/routes` — Express routes and Swagger docs
- `src/services` — AI integration, alerting, anomaly detection, caching
- `src/consumers` — Kafka consumer for Elasticsearch indexing
- `prisma` — PostgreSQL schema and migrations
- `k8s` — Kubernetes manifests for every service
- `grafana/provisioning` — auto-provisioned Grafana data source
- `tests` — Jest unit test suite

---

## Design notes

- Logs save to MongoDB synchronously (immediately queryable); Elasticsearch indexing happens asynchronously via Kafka, keeping ingestion fast under load
- Dashboard and AI endpoints cache through Redis with short TTLs, falling back to direct computation if Redis is unavailable
- The AI Assistant only answers using real data from the last 24 hours — it says when it doesn't have enough information rather than guessing
- Prisma is pinned to v6; v7 changed the schema format in a breaking way this project hasn't migrated to

---

## License

This project is licensed under the MIT License — see `LICENSE` for details. MIT is a permissive license: anyone can use, copy, modify, and distribute this code, including for commercial purposes, as long as the original copyright notice is retained.

---

<sub>Built by Sneha Paul, B.Tech Robotics & AI, IEM Kolkata. Originally developed as an internship project at Ultimates Technology.</sub>
