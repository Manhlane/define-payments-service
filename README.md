# Define Payments Service

NestJS service for creating and tracking payment requests for the Define platform.  
Designed to integrate with the Auth and Notifications services, while keeping the core API lightweight.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install dependencies
```bash
npm install
```

### Run the development server
```bash
npm run start:dev
```
The service boots on `http://localhost:3004` by default.

### Open interactive docs (Swagger UI)
After the server is running, visit:
```
http://localhost:3004/docs
```

### Health check
```
http://localhost:3004/health
```

---

## Configuration

| Environment Variable | Default | Notes |
| -------------------- | ------- | ----- |
| `PORT` | `3004` | HTTP port for the NestJS app |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Comma-separated list of origins allowed for CORS |
| `AUTH_SERVICE_URL` | `http://localhost:3002` | Base URL for the Auth service |
| `NOTIFICATIONS_URL` | `http://localhost:3005/notifications` | Base URL for the Notifications service |
| `NOTIFICATIONS_SERVICE_URL` | — | Alternative override if your infra uses a different env name |
| `PLATFORM_FEE_RATE` | `0.05` | Platform fee rate applied to payment totals |

Update the provided `.env` file (or export the same variables) before booting the service.

---

## API Overview

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/payments` | List payment requests (in-memory) |
| `POST` | `/payments` | Create a payment request |
| `GET` | `/payments/:id` | Fetch a payment request by id |

### POST `/payments` payload
```json
{
  "serviceDescription": "Wedding photography",
  "amount": 5500,
  "currency": "ZAR",
  "clientEmail": "client@example.com",
  "clientName": "Client Name",
  "deliverables": ["300 edited photos", "Online gallery"],
  "shootDate": "2026-03-23",
  "deliveryDate": "2026-03-28",
  "paymentDueBy": "2026-03-30",
  "requireDeposit": true,
  "depositMode": "percent",
  "depositPercent": 50
}
```

---

## Project Structure

```
src/
  app.module.ts
  app.controller.ts
  app.service.ts
  health/
    health.controller.ts
    health.module.ts
  payments/
    dto/
      create-payment-request.dto.ts
      payment-request.dto.ts
    payments.controller.ts
    payments.module.ts
    payments.service.ts
  auth/
    auth.client.ts
  notifications/
    notifications.client.ts
```

---

## Notes

- Payment requests are stored in-memory for now (non-persistent).
- When `clientEmail` is provided, a generic notification is enqueued via the Notifications service.

---

## Next Steps
1. Add persistent storage (Postgres or another durable store).
2. Add webhooks for payment provider status updates.
3. Tie payment requests to authenticated users once Auth tokens are enforced.

