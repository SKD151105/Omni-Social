<div align="center">

# Omni-Social

**Production-Grade Express.js Social Media Backend**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)](https://jwt.io/)

</div>

## Overview

A scalable social media backend built with Express.js, featuring authentication, user management, and production-ready middleware. Designed with clean architecture principles and separation of concerns.

### Features

**Security & Authentication**

- JWT-based authentication
- Rate limiting (IP-based, Redis-backed with in-memory fallback)
- Input validation (schema-level)

**Observability**

- Request logging with correlation IDs
- Centralized error handling

**Architecture**

- Layered architecture (Controllers → Services → Repositories)
- Repository pattern for all major entities
- Clean separation of concerns

## Project Structure

```text
server/
├── src/
│   ├── app.js              # Express app configuration
│   ├── index.js            # Server entry point
│   ├── controllers/        # HTTP request handlers
│   ├── services/           # Business logic
│   ├── repositories/       # Database queries (all major entities)
│   ├── models/             # Mongoose schemas
│   ├── middlewares/        # Custom middleware
│   ├── routes/             # API routes
│   ├── utils/              # Helper functions
│   └── constants.js        # Shared constants
```

> **Note:** The repository pattern is now implemented for all major entities (users, videos, comments, tweets, playlists). All database access is routed through repositories for maintainability and testability.

## Middleware Pipeline

Requests flow through middleware in this order:

| Step | Middleware | Purpose |
|------|-----------|---------|
| **1** | Correlation ID | Unique ID for request tracking |
| **2** | Request Logger | Logs method, path, status, duration |
| **3** | Rate Limiter | Protects against abuse (returns 429, Redis-backed with in-memory fallback) |
| **4** | Security Headers | CORS configuration |
| **5** | Body Parser | Handles JSON and form data |
| **6** | Authentication | JWT verification (sets `req.user`) |
| **7** | Authorization | Role-based access control |
| **8** | Routes | Business logic |
| **9** | 404 Handler | Handles unknown routes |
| **10** | Error Handler | Centralized error responses |

## API Endpoints

### Authentication

#### Register User

```http
POST /api/v1/auth/register
Content-Type: application/json
```

<details>
<summary>Request Body</summary>

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secure123"
}
```

</details>

<details>
<summary>Response</summary>

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

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json
```

<details>
<summary>Request Body</summary>

```json
{
  "email": "alice@example.com",
  "password": "secure123"
}
```

</details>

<details>
<summary>Response</summary>

```json
{
  "success": true,
  "token": "eyJhbGc..."
}
```

</details>

### User Management

#### Get Profile

```http
GET /api/v1/users/me
Authorization: Bearer <token>
```

<details>
<summary>Response</summary>

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

#### Update Profile

```http
PATCH /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json
```

<details>
<summary>Request Body</summary>

```json
{
  "username": "alice_updated"
}
```

</details>

<details>
<summary>Response</summary>

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

### Error Response Format

```json
{
  "success": false,
  "message": "Validation failed: email is required"
}
```

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

# Optional (Rate Limiting)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
# Redis (for scalable rate limiting)
REDIS_URL=redis://localhost:6379
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

## Architecture Decisions

### Layered Architecture

- **Controllers** handle HTTP requests/responses
- **Services** contain business logic
- **Repositories** handle database operations (all major entities)
- **Clear separation** makes code testable and maintainable

### Repository Pattern

- All major entities (users, videos, comments, tweets, playlists) use a repository layer for DB access
- Enables easy mocking and unit testing

### Rate Limiting

- Uses Redis for distributed rate limiting if available
- Falls back to in-memory store if Redis is not configured
- Configurable via environment variables

### File Uploads

- Unique filenames for all uploads
- Remote file cleanup on DB save failure
- Robust error handling for all upload scenarios

### Stateless Design

- **No server-side sessions**
- **JWT tokens** for authentication
- **Enables horizontal scaling**

### Middleware Order

- **Security middleware** runs first
- **Authentication** before authorization
- **Error handling** runs last

## Testing & Quality

- Automated tests with Jest and Supertest
- Example tests in `tests/` directory
- Run all tests:

```bash
npm test
```

- All new features should include tests. See `tests/` for examples.

## File Uploads & Error Handling

- All uploaded files (images, videos) use unique filenames to prevent collisions.
- If a file is uploaded to remote storage (e.g., Cloudinary) but the DB save fails, the remote file is automatically deleted to prevent orphaned files.
- All file upload errors are handled gracefully and return clear error messages.

## Redis Server (Windows) Setup & Commands

### Start Redis Server

Open Command Prompt and run:

```bash
cd C:\redis
redis-server.exe --dir C:\redis\data
```

If you installed Redis with a config file, use:

```bash
redis-server.exe redis.windows.conf
```

### Stop Redis Server

1. Find the Redis process ID (PID):

   ```bash
   netstat -a -n -o | find "6379"
   ```

   (Note the PID in the last column)

2. Stop the process:

   ```bash
   taskkill /PID <PID> /F
   ```

   Example:

   ```bash
   taskkill /PID 24400 /F
   ```

### Notes

- Only one Redis server can run on port 6379 at a time.
- If you see a bind error, Redis is already running.
- For production, consider running Redis as a service or using Docker.

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