# AI-Powered Developer Observability Tool

An intelligent backend platform that helps developers monitor, analyze, and troubleshoot APIs and backend services using AI-powered diagnostics.

## What it does
- Collects logs, metrics, and traces from applications
- Detects anomalies in API behavior
- Uses Gemini AI to generate human-readable explanations
- Provides actionable recommendations for developers

## Tech Stack
- **Backend:** Node.js, Express.js
- **Databases:** PostgreSQL (via Prisma ORM), MongoDB (via Mongoose)
- **AI:** Gemini API
- **Search:** Elasticsearch (Phase 2)
- **Queue:** Apache Kafka (Phase 3)
- **Cache:** Redis (Phase 3)
- **Monitoring:** Prometheus + Grafana (Phase 3)
- **Deployment:** Docker + Kubernetes
- **API Docs:** Swagger
- **Containerization:** Docker Compose (local dev)

## Project Phases
- **Phase 1 (Month 1):** Observability Foundation & Monitoring Infrastructure — ✅ Complete
- **Phase 2 (Month 2):** AI-Powered Analysis & Anomaly Detection Engine — Upcoming
- **Phase 3 (Month 3):** Intelligent Observability Dashboard & Production Deployment — Upcoming

---

## Phase 1 — Completed Deliverables

### Infrastructure
- Express.js server with Helmet, CORS, and Morgan logging
- PostgreSQL connected via Prisma ORM, running in Docker
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

### Documentation & Deliverables
- Interactive Swagger API documentation (`/api-docs`)
- Exported Postman collection for all 19+ endpoints
- System architecture diagram
- This README

---

## API Overview

| Module | Base Route | Description |
|---|---|---|
| Auth | `/api/auth` | Register, login, get current user |
| Logs | `/api/logs` | Create, query, filter, and aggregate logs |
| Metrics | `/api/metrics` | Record and analyze API performance metrics |
| Monitor | `/api/monitor` | Register and health-check external services |
| Dashboard | `/api/dashboard` | Combined observability overview |
| Health | `/health` | Internal database connectivity checks |

Full interactive documentation available at `http://localhost:3000/api-docs` once the server is running.

## Getting Started

### Prerequisites
- Node.js v18+
- Docker
- npm

### Installation
```bash
git clone https://github.com/sneha-paul-2005/observability-tool.git
cd observability-tool
npm install
```

### Environment Setup
Create a `.env` file in the root directory with:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/observability_db
MONGODB_URI=mongodb://localhost:27017/observability_logs
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
```

### Running locally
```bash
# Start PostgreSQL and MongoDB containers
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

Server runs at `http://localhost:3000`
API docs available at `http://localhost:3000/api-docs`

### Testing the API
A complete Postman collection is included: `observability-tool.postman_collection.json`. Import it directly into Postman to test all endpoints.

## Project Structure
observability-tool/

├── src/

│   ├── config/          # Database connections (Prisma, Mongoose, Swagger)

│   ├── controllers/     # Request handler logic

│   ├── middleware/      # Auth middleware

│   ├── models/          # MongoDB schemas

│   ├── routes/          # API route definitions

│   ├── app.js

│   └── server.js

├── prisma/

│   └── schema.prisma    # PostgreSQL schema

├── docker-compose.yml   # PostgreSQL + MongoDB containers

└── observability-tool.postman_collection.json

## Author
Sneha Paul 
