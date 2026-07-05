# AI-Powered Developer Observability Tool

An intelligent backend platform that helps developers monitor, analyze, and troubleshoot APIs and backend services using AI-powered diagnostics.

## What it does
- Collects logs, metrics, and traces from applications
- Detects anomalies in API behavior automatically
- Uses Gemini AI to generate human-readable explanations
- Searches logs instantly using Elasticsearch
- Generates AI-powered incident summaries and reports
- Provides actionable performance and security recommendations

## Tech Stack
- **Backend:** Node.js, Express.js
- **Databases:** PostgreSQL (via Prisma ORM v6), MongoDB (via Mongoose)
- **AI:** Gemini API (`gemini-2.5-flash`)
- **Search:** Elasticsearch 8.13.0
- **Queue:** Apache Kafka (Phase 3)
- **Cache:** Redis (Phase 3)
- **Monitoring:** Prometheus + Grafana (Phase 3)
- **Deployment:** Docker + Kubernetes
- **API Docs:** Swagger
- **Testing:** Jest
- **Containerization:** Docker Compose (local dev)

## Project Phases
- **Phase 1 (Month 1):** Observability Foundation & Monitoring Infrastructure — ✅ Complete
- **Phase 2 (Month 2):** AI-Powered Analysis & Anomaly Detection Engine — ✅ Complete
- **Phase 3 (Month 3):** Intelligent Observability Dashboard & Production Deployment — Upcoming

---

## Phase 1 — Completed Deliverables ✅

### Infrastructure
- Express.js server with Helmet, CORS, and Morgan logging
- PostgreSQL connected via Prisma ORM v6, running in Docker
- MongoDB connected via Mongoose, running in Docker
- Database schema covering Users, API Metrics, and Incidents
- Health check endpoints for both databases

### Authentication Module
- User registration with bcrypt password hashing
- JWT-based login system
- Role-based access control (ADMIN / DEVELOPER)
- Protected route middleware

### Log Collection Service
- Log ingestion API (single and bulk)
- Log filtering by level, service, and date range
- Error log isolation endpoint
- Log statistics aggregation

### Metrics Collection Module
- API metric recording (response time, status codes)
- Average response time per endpoint
- Error rate calculation
- Throughput tracking (requests per minute)

### API Health Monitoring
- Service registration for external endpoint monitoring
- On-demand health checks (single and bulk)
- Status, latency, and status code tracking per service

### Dashboard Overview API
- Single endpoint combining logs, metrics, and service health summaries

---

## Phase 2 — Completed Deliverables ✅

### Log Processing Pipeline
- Log parsing engine — normalizes all incoming logs
- Automatic level classification (debug / info / warn / error / critical)
- Error categorization (database, auth, timeout, validation, network, and more)

### Elasticsearch Integration
- Elasticsearch 8.13.0 running in Docker
- Automatic log indexing on every ingestion
- Full-text search across log messages
- Filter by service, level, error category, status code, and date range

### Anomaly Detection Module
- Traffic spike detection (compares current vs baseline window)
- Error rate monitoring (flags when error % exceeds threshold)
- Response time degradation detection
- Unusual auth activity detection (brute-force signals)
- Runs automatically every 5 minutes
- Saves detected anomalies as incidents in PostgreSQL

### Gemini AI Integration
- Connected to Google Gemini API (`gemini-2.5-flash`)
- Robust JSON response parsing with markdown fence stripping

### AI Log Analysis Engine
- Analyzes recent logs for any service
- Generates plain-English summary, severity, root cause, and affected components
- Provides immediate actions and prevention tips

### Incident Summary Generator
- AI-generated incident reports from incident + related logs
- Covers headline, impact, root cause, resolution, and lessons learned

### Recommendation Engine
- Analyzes last 24 hours of metrics
- Generates performance, security, and reliability recommendations

### Search & Query APIs
- Full-text log search powered by Elasticsearch
- Filter by service, level, error category, date range

### Testing
- 14/14 Jest tests passing for log processor service

---

## API Overview

| Module | Base Route | Description |
|---|---|---|
| Auth | `/api/auth` | Register, login, get current user |
| Logs | `/api/logs` | Create, query, filter, and aggregate logs |
| Metrics | `/api/metrics` | Record and analyze API performance metrics |
| Monitor | `/api/monitor` | Register and health-check external services |
| Dashboard | `/api/dashboard` | Combined observability overview |
| Search | `/api/search` | Elasticsearch-powered log search and filtering |
| AI | `/api/ai` | AI log analysis, error explanation, recommendations, anomaly detection |
| Incidents | `/api/incidents` | Incident management and AI-generated summaries |
| Health | `/health` | Internal database connectivity checks |

Full interactive documentation available at `http://localhost:3000/api-docs` once the server is running.

---

## Getting Started

### Prerequisites
- Node.js v18+
- Docker Desktop
- npm

### Installation
```bash
git clone https://github.com/sneha-paul-2005/observability-tool.git
cd observability-tool
npm install
```

### Environment Setup
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/observability_db
MONGODB_URI=mongodb://localhost:27017/observability_logs
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
ELASTICSEARCH_URL=http://localhost:9200
```

### Running Locally
```bash
# Start PostgreSQL, MongoDB, and Elasticsearch containers
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

Server runs at `http://localhost:3000`
API docs available at `http://localhost:3000/api-docs`

### Running Tests
```bash
npm test
```

### Testing the API
A complete Postman collection is included: `observability-tool.postman_collection.json`
Import it directly into Postman to test all endpoints.

---

## Project Structure

```
observability-tool/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── app.js
│   └── server.js
├── prisma/
│   └── schema.prisma
├── tests/
│   └── logProcessor.test.js
├── docker-compose.yml
└── observability-tool.postman_collection.json
```
---

## Author
Sneha Paul — B.Tech Robotics & AI, IEM Kolkata
Internship Project — Ultimates Technology
