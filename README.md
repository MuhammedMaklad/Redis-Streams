# Redis Stream Microservices Architecture

A demonstration of a robust, event-driven microservices architecture using **Node.js**, **TypeScript**, and **Redis Streams**. This project showcases how to handle high-throughput messaging, consumer groups, and fault tolerance (XPENDING/XCLAIM) in a distributed environment.

## 🏗 Architecture Overview

The system consists of three main components:

1. **Order Service (API):** An Express-based service that accepts orders and publishes them to a Redis Stream (`order:stream`).
2. **Payment Service (API):** A placeholder API service for payment-related operations.
3. **Payment Worker (Background):** A dedicated background process that consumes messages from the Redis Stream using **Consumer Groups**.

### Infrastructure

- **Redis High Availability:** A 3-node Redis Sentinel cluster (Master, Replica, Sentinels) ensuring data persistence and automatic failover.
- **Docker Orchestration:** Containers are managed via `docker-compose` with isolated networks and health checks.

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)

### Running the Project

1. **Clone the repository**
2. **Spin up the infrastructure:**
   ```bash
   docker compose up -d --build
   ```
3. **Monitor the logs:**
   ```bash
   # To see the worker processing orders:
   docker compose logs -f payment-worker
   ```

## 📡 Redis Stream Patterns Implemented

### 1. Consumer Groups

The `payment-worker` uses a Consumer Group named `payment-group`. This allows multiple instances of the worker to scale horizontally, ensuring each message is processed by only one consumer in the group.

### 2. Fault Tolerance (PEL & XPENDING)

The project includes a **simulated failure logic** (30% failure rate) where a consumer might pick up a message but "crash" before acknowledging (`XACK`) it. These messages stay in the **Pending Entries List (PEL)**.

### 3. Automatic Retries (XCLAIM)

To prevent messages from being stuck forever, the worker implements a `claimStaleMessages` routine:

- It uses `XPENDING` to find messages that have been idle for more than **10 seconds**.
- It uses `XCLAIM` to take ownership of those messages from failed consumers and re-process them.

## 🛠 Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database/Messaging:** Redis (ioredis client)
- **Logging:** Pino (with pino-pretty)
- **Containerization:** Docker, Docker Compose

## 📁 Project Structure

```text
├── configuration/          # Redis & Sentinel config files
├── services/
│   ├── order-service/      # Publishes to order:stream
│   └── payment-service/
│       ├── src/index.ts    # API Entry point
│       └── src/worker.ts   # Dedicated Stream Consumer
└── docker-compose.yml      # System orchestration
```

## 🧪 Testing the Flow

Send a POST request to the Order Service:

```bash
curl -X POST http://localhost:3000/api/v1/order \
     -H "Content-Type: application/json" \
     -d '{"userId": "123", "productId": "456", "amount": 100}'
```

Check the `payment-worker` logs to see the message being consumed, potentially failing, and being reclaimed by the retry logic.
