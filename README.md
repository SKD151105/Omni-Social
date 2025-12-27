<div align="center">

# Omni-Social

**Production-Grade Express.js Social Media Backend**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)

</div>

---

## Overview

A scalable social media backend built with Express.js, featuring authentication, user management, and production-ready middleware. Designed with clean architecture principles and separation of concerns.

--- 

### Features
---
**Security & Authentication**
- JWT-based authentication
- Rate limiting (IP-based, in-memory)
- Input validation

**Observability**
- Request logging with correlation IDs
- Centralized error handling

**Architecture**
- Layered architecture (Controllers → Services → Repositories)
- Clean separation of concerns

---

## Project Structure

```
server/
├── src/
│   ├── app.js              # Express app configuration
│   ├── index.js            # Server entry point
│   ├── controllers/        # HTTP request handlers
│   ├── services/           # Business logic
│   ├── repositories/       # Database queries (currently user only)
│   ├── models/             # Mongoose schemas
│   ├── middlewares/        # Custom middleware
│   ├── routes/             # API routes
│   ├── utils/              # Helper functions
│   └── constants.js        # Shared constants
```

> **Note:** The repository layer is currently only implemented for users. Direct model access is used for other entities.

---

## Middleware Pipeline

Requests flow through middleware in this order:

| Step | Middleware | Purpose |
|------|-----------|---------|
| **1** | Correlation ID | Unique ID for request tracking |
| **2** | Request Logger | Logs method, path, status, duration |
| **3** | Rate Limiter | Protects against abuse (returns 429) |
| **4** | Security Headers | CORS configuration |
| **5** | Body Parser | Handles JSON and form data |
| **6** | Authentication | JWT verification (sets `req.user`) |
| **7** | Authorization | Role-based access control |
| **8** | Routes | Business logic |
| **9** | 404 Handler | Handles unknown routes |
| **10** | Error Handler | Centralized error responses |

---

## API Reference

### Authentication

#### **Register User**

```http
POST /api/v1/auth/register
Content-Type: application/json
```

<details>
<summary><b>Request Body</b></summary>

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secure123"
}
```
</details>

<details>
<summary><b>Response</b></summary>

```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "alice",
    "email": "alice@example.com"
  },
  "token": "eyJhbGc..."
}
```
</details>

---

#### **Login**

```http
POST /api/v1/auth/login
Content-Type: application/json
```

<details>
<summary><b>Request Body</b></summary>

```json
{
  "email": "alice@example.com",
  "password": "secure123"
}
```
</details>

<details>
<summary><b>Response</b></summary>

```json
{
  "success": true,
  "token": "eyJhbGc..."
}
```
</details>

---

### User Management

#### **Get Profile**

```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

<details>
<summary><b>Response</b></summary>

```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "alice",
    "email": "alice@example.com"
  }
}
```
</details>

---

#### **Update Profile**

```http
PATCH /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json
```

<details>
<summary><b>Request Body</b></summary>

```json
{
  "username": "alice_updated"
}
```
</details>

<details>
<summary><b>Response</b></summary>

```json
{
  "success": true,
  "user": {
    "id": "...",
    "username": "alice_updated",
    "email": "alice@example.com"
  }
}
```
</details>

---

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed: email is required"
}
```

---

## Getting Started

### Prerequisites

| Requirement | Version |
|------------|---------|
| Node.js | 18+ |
| MongoDB | 6+ |

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/omnisocial.git
cd omnisocial

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/omnisocial
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
PORT=5000

# Optional
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
```

### Running the Server

```bash
# Development
npm run dev

# Production
npm start
```

### Example Requests

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password123"}'

# Get profile
curl http://localhost:5000/api/v1/users/me \
  -H "Authorization: Bearer <your-token>"
```

---

## Production Deployment (Recommendations)

> **Note:** These are deployment recommendations, not included configurations in this repository.

### Pre-Deployment Checklist

- [ ] Set secure `JWT_SECRET` in production environment
- [ ] Use MongoDB Atlas or managed database service
- [ ] Configure process manager (PM2 recommended)
- [ ] Set up monitoring and logging

### Recommended: Reverse Proxy

Using Nginx or Caddy as a reverse proxy is recommended for:
- SSL/TLS termination
- Load balancing
- Static file serving
- Request compression

**Example Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Recommended: Process Management

```bash
# Using PM2
npm install -g pm2
pm2 start src/index.js --name omnisocial
pm2 save
pm2 startup
```

---

## Architecture Decisions

### Layered Architecture

- **Controllers** handle HTTP requests/responses
- **Services** contain business logic
- **Repositories** handle database operations (currently user only)
- **Clear separation** makes code testable

### Stateless Design

- **No server-side sessions**
- **JWT tokens** for authentication
- **Enables horizontal scaling**

### Middleware Order

- **Security middleware** runs first
- **Authentication** before authorization
- **Error handling** runs last

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

<div align="center">

**Built with Express.js & MongoDB**

</div>