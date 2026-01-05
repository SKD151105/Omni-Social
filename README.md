
# Omni-Social


Omni-Social is a robust, scalable backend for a modern social media platform, engineered with Express.js and MongoDB. It powers seamless user authentication, secure media uploads, interactive video sharing, real-time comments, channel subscriptions, playlists, and analytics—delivering all the essential features for a dynamic, community-driven experience.
  
<br />

<p align="left">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-5.x-black?logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-6%2B-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Mongoose-ODM-880000?logo=mongoose&logoColor=white" alt="Mongoose" />
  <img src="https://img.shields.io/badge/JWT-Auth-FFB300?logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Cloudinary-File%20Storage-3448C5?logo=cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/Redis-Rate%20Limiting-DC382D?logo=redis&logoColor=white" alt="Redis (Rate Limiting)" />
  <img src="https://img.shields.io/badge/Helmet-HPP--CORS-6E5494?logo=security&logoColor=white" alt="Security" />
</p>


## Overview

I've built this backend as a RESTful API that handles user management, media uploads, and social interactions. The codebase is organized into controllers, services, and repositories to keep business logic separate from database operations.

## Contents
- [Omni-Social](#omni-social)
  - [Overview](#overview)
  - [Contents](#contents)
  - [Features](#features)
    - [Authentication](#authentication)
    - [User Management](#user-management)
    - [Video Features](#video-features)
    - [Social Features](#social-features)
    - [Security Measures](#security-measures)
    - [Architecture](#architecture)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
  - [Redis Setup](#redis-setup)
    - [Running the Application](#running-the-application)
    - [Testing the API](#testing-the-api)
  - [API Endpoints](#api-endpoints)
    - [Authentication](#authentication-1)
    - [User Management](#user-management-1)
    - [Videos](#videos)
    - [Comments](#comments)
    - [Likes](#likes)
    - [Subscriptions](#subscriptions)
    - [Playlists](#playlists)
    - [Tweets](#tweets)
    - [Dashboard](#dashboard)
  - [Technical Stack](#technical-stack)
  - [Middleware Flow](#middleware-flow)
  - [Architecture](#architecture-1)
  - [Future Improvements](#future-improvements)
    - [Testing](#testing)
    - [Security](#security)
    - [Features](#features-1)
    - [Performance](#performance)
    - [Infrastructure](#infrastructure)
    - [Code Quality](#code-quality)
    - [Observability](#observability)
    - [Data Governance](#data-governance)
    - [Scalability](#scalability)
  - [Deployment](#deployment)

## Features

### Authentication
- JWT-based authentication with access and refresh tokens
- Access tokens expire in 15 minutes, refresh tokens in 7 days
- Refresh tokens are hashed with bcrypt before storage
- CSRF protection implemented on token refresh endpoint using double-submit cookie pattern
- Token rotation with JTI (JWT ID) to prevent token reuse

### User Management
- User registration with required avatar upload (optional cover image)
- Login with email or username
- Profile updates with duplicate email validation
- Channel profiles showing subscriber counts

### Video Features
- Video publishing with thumbnail uploads via Cloudinary
- Video description must be at least 10 characters
- Videos can be toggled between published/unpublished states
- Watch history tracking (limited to latest 200 entries)
- Video deletion by owner

### Social Features
- Comments on videos with nested replies support
- Like/unlike functionality for videos and comments
- Channel subscriptions
- Tweet/post creation
- Playlist management
- Basic dashboard analytics

### Security Measures
- Helmet middleware for security headers
- HPP (HTTP Parameter Pollution) protection
- CORS configured with explicit origin validation
- Rate limiting (supports Redis for distributed systems, falls back to in-memory)
- Input validation aligned with database schema constraints
- Cloudinary file cleanup on database operation failures

### Architecture
- Layered structure: Controllers handle HTTP, Services contain business logic, Repositories manage database access
- Repository pattern implemented for users, videos, comments, tweets, and playlists
- Correlation IDs attached to requests for tracing
- Centralized error handling

## Project Structure

```text
server/
├── src/
│   ├── app.js              # Express app configuration
│   ├── index.js            # Server entry point
│   ├── controllers/        # HTTP request handlers
│   ├── services/           # Business logic
│   ├── repositories/       # Database queries
│   ├── models/             # Mongoose schemas
│   ├── middlewares/        # Custom middleware
│   ├── routes/             # API routes
│   ├── utils/              # Helper functions
│   └── constants.js        # Shared constants
└── .env                    # Environment variables
```

The repository pattern is used for users, videos, comments, tweets, and playlists to isolate database operations from business logic.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB 6 or higher
- Redis (optional, for distributed rate limiting)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/omnisocial.git
cd omnisocial/server

# Install dependencies
npm install

# Set up environment variables
# Create a .env file with the configuration shown below
```

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/omnisocial

# Authentication (generate with: openssl rand -base64 32)
ACCESS_TOKEN_SECRET=your_access_token_secret_here
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRY=7d

# CORS (comma-separated for multiple origins)
CORS_ORIGINS=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# File Uploads
FILE_UPLOAD_MAX_MB=200

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Redis (optional)
USE_REDIS=false
# REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
```

## Redis Setup

Redis is optional and used for distributed rate limiting; if disabled, the app falls back to in-memory limits. To enable Redis:

1. Install and run Redis (local `redis-server` or managed service like Redis Cloud).
2. Set `USE_REDIS=true` and configure `REDIS_URL` in your `.env` (e.g., `redis://localhost:6379` or your managed endpoint).
3. Keep `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` tuned to your expected traffic; these settings apply to the Redis-backed limiter.
4. Deploy all app instances with the same Redis URL so rate limiting is enforced consistently across nodes.
5. Monitor Redis health—timeouts or disconnects will fall back to in-memory limiting on that instance only, which can create uneven enforcement.

Local start commands (PowerShell/terminal):

```bash
# Start Redis with default config (foreground)
redis-server

# Or start with a custom config
redis-server /path/to/redis.conf

# Health check
redis-cli ping
```

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Run tests
npm test
```

### Testing the API

Health check:
```bash
curl http://localhost:5000/healthcheck
```

Register a user (requires an image file for avatar):
```bash
curl -X POST http://localhost:5000/api/v1/user/register \
  -F "fullName=Alice Johnson" \
  -F "email=alice@example.com" \
  -F "username=alice" \
  -F "password=SecurePass123!" \
  -F "avatar=@./avatar.jpg"
```

Login:
```bash
curl -X POST http://localhost:5000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"SecurePass123!"}'
```

This returns an access token in the response body and sets refresh token and CSRF token as httpOnly cookies.

Get current user (replace token with the one from login):
```bash
curl http://localhost:5000/api/v1/user/current-user \
  -H "Authorization: Bearer <access_token>"
```

Refresh access token (requires CSRF header matching cookie value):
```bash
curl -X POST http://localhost:5000/api/v1/user/refresh-token \
  -H "x-csrf-token: <csrf_token_from_cookie>" \
  -b "refreshToken=<value>; csrfToken=<value>"
```

## API Endpoints

### Authentication

- `POST /api/v1/user/register` - Register new user (multipart: avatar required, coverImage optional)
- `POST /api/v1/user/login` - Login with email/username and password
- `POST /api/v1/user/refresh-token` - Get new access token (requires CSRF header)
- `POST /api/v1/user/logout` - Logout and clear cookies
- `GET /api/v1/user/current-user` - Get authenticated user details

### User Management

- `PATCH /api/v1/user/update-account` - Update user details
- `PATCH /api/v1/user/avatar` - Update avatar image
- `PATCH /api/v1/user/cover-image` - Update cover image
- `GET /api/v1/user/c/:username` - Get user channel profile
- `GET /api/v1/user/history` - Get watch history

### Videos

- `GET /api/v1/videos` - List all videos
- `POST /api/v1/videos` - Publish new video (multipart: videoFile and thumbnail required)
- `GET /api/v1/videos/:videoId` - Get video by ID
- `PATCH /api/v1/videos/:videoId` - Update video details
- `DELETE /api/v1/videos/:videoId` - Delete video
- `PATCH /api/v1/videos/:videoId/toggle-publish` - Toggle publish status

### Comments

- `GET /api/v1/comments/:videoId` - Get video comments
- `POST /api/v1/comments/:videoId` - Add comment
- `PATCH /api/v1/comments/c/:commentId` - Update comment
- `DELETE /api/v1/comments/c/:commentId` - Delete comment

### Likes

- `POST /api/v1/likes/toggle/v/:videoId` - Toggle video like
- `POST /api/v1/likes/toggle/c/:commentId` - Toggle comment like
- `GET /api/v1/likes/videos` - Get liked videos

### Subscriptions

- `POST /api/v1/subscriptions/c/:channelId` - Toggle subscription
- `GET /api/v1/subscriptions/u/:subscriberId` - Get user subscriptions
- `GET /api/v1/subscriptions/c/:channelId` - Get channel subscribers

### Playlists

- `POST /api/v1/playlists` - Create playlist
- `GET /api/v1/playlists/:playlistId` - Get playlist
- `PATCH /api/v1/playlists/:playlistId` - Update playlist
- `DELETE /api/v1/playlists/:playlistId` - Delete playlist
- `PATCH /api/v1/playlists/add/:videoId/:playlistId` - Add video to playlist
- `PATCH /api/v1/playlists/remove/:videoId/:playlistId` - Remove video from playlist

### Tweets

- `POST /api/v1/tweets` - Create tweet
- `GET /api/v1/tweets/user/:userId` - Get user tweets
- `PATCH /api/v1/tweets/:tweetId` - Update tweet
- `DELETE /api/v1/tweets/:tweetId` - Delete tweet

### Dashboard

- `GET /api/v1/dashboard/stats` - Get channel statistics
- `GET /api/v1/dashboard/videos` - Get channel videos

## Technical Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Database**: MongoDB 6+ with Mongoose
- **Authentication**: JWT with bcrypt-hashed refresh tokens
- **File Storage**: Cloudinary
- **Rate Limiting**: Redis (optional) or in-memory
- **Security**: Helmet, HPP, CORS
- **Testing**: Jest with Supertest

## Middleware Flow

Requests are processed in this order:

1. Correlation ID - Assigns unique ID to each request
2. Logger - Records request details
3. Rate Limiter - Limits requests per IP
4. Security Headers - Helmet, HPP, CORS
5. Body Parser - Parses JSON and form data
6. Cookie Parser - Extracts cookies
7. Authentication - Verifies JWT
8. Routes - Application endpoints
9. Error Handler - Catches and formats errors

## Architecture

The codebase follows a three-layer architecture:

**Controllers** → Receive HTTP requests and send responses  
**Services** → Implement business logic and coordinate operations  
**Repositories** → Execute database queries

This separation allows:
- Testing business logic without HTTP layer
- Mocking database operations in tests
- Changing database implementation without touching business logic
- Different developers working on different layers

## Future Improvements

The following features could be added to enhance the project:

### Testing
- Increase test coverage to at least 80%, prioritizing services, controllers, and middleware edge cases
- Add integration tests for end-to-end user journeys (register → login → refresh → logout → delete) including cookie assertions
- Add tests for video upload/update/delete with Cloudinary failure scenarios and cleanup assertions
- Test authorization rules for every protected endpoint and ensure role/ownership checks fail safely
- Add load and soak tests to validate rate limiter behavior under burst and sustained traffic

### Security
- Implement email verification for new registrations, including signed magic links and resend throttling
- Add password reset flow with short-lived signed tokens, device metadata capture, and token revocation on use
- Add OAuth2 providers (Google, GitHub) with account linking/merge to avoid duplicate accounts
- Add IP- and device-based anomaly detection with alerts and optional step-up verification
- Implement progressive account lockout after failed logins with admin override and audit logging

### Features
- Add real-time notifications (Socket.io or Server-Sent Events) for comments, likes, and subscriptions with per-user rate limits
- Implement video transcoding for multiple qualities and codecs, storing rendition metadata and playback manifests
- Add search with filters (date, views, likes, duration, tags) backed by text indexes or a search service (Meilisearch/Elastic)
- Build a recommendation system using collaborative filtering on watch history and implicit feedback signals
- Add privacy-aware video sharing links, embeddable iframes, and share-intent tracking
- Implement comment moderation (profanity filters, spam detection, manual review queue, and soft deletes with audit trails)

### Performance
- Add caching for hot paths (channel profiles, video metadata, trending lists) with cache invalidation hooks on writes
- Review and optimize queries with MongoDB profiler; add compound indexes that match query shapes
- Ensure cursor-based pagination on all list endpoints to keep responses consistent under load
- Serve static assets and thumbnails via CDN with aggressive caching and cache-busting on updates
- Tune connection pooling and timeouts; add health checks and retry policies for transient DB errors

### Infrastructure
- Set up CI/CD pipeline with lint/test on PRs and automated deploys to staging/production with secrets managed via vault
- Add Docker images with multi-stage builds and a docker-compose file for local dev (app + MongoDB + Redis)
- Publish comprehensive API docs (OpenAPI/Swagger) and keep them versioned with the code
- Implement structured logging (JSON) shipped to a log aggregator (ELK/Vector/Loki) with correlation IDs
- Add monitoring and alerting (Prometheus + Grafana) for latency, error rate, queue depth, and Cloudinary/Redis health

### Code Quality
- Define an API versioning strategy (prefix-based routing, deprecation headers, and changelog)
- Consider a GraphQL gateway for aggregated reads while keeping writes on REST for simplicity
- Enable request/response compression (gzip/br) with safe size limits and content-type guards
- Expand developer docs: architecture decisions (ADR), runbooks, onboarding checklist, and sample env files
- Enforce ESLint + Prettier in CI with consistent configs shared across services
- Add pre-commit hooks (lint, type checks if added, tests subset) to keep main branch clean

### Observability
- Add distributed tracing (OpenTelemetry) around controllers/services and external calls (MongoDB, Redis, Cloudinary)
- Create RED/SLO dashboards (Rate, Errors, Duration) with alert thresholds tied to business impact
- Instrument business metrics (signups, uploads, publishes, watch completions) and emit them to a time-series DB

### Data Governance
- Implement PII classification, field-level encryption for sensitive attributes, and a data retention policy
- Add GDPR-style data export/delete workflows with admin review and audit logs
- Validate inbound payloads with a shared schema library and provide consistent error shapes for clients

### Scalability
- Add background job processing (BullMQ/Cloud Tasks) for uploads, transcoding, email, and notifications
- Introduce feature flags for gradual rollouts and safe experimentation
- Support horizontal scaling with stateless app nodes, shared session/cookie strategy, and sticky sessions only when needed

## Deployment

For production deployment:

1. Generate secure secrets using `openssl rand -base64 32`
2. Use a managed MongoDB service (MongoDB Atlas recommended)
3. Set up Redis if running multiple server instances
4. Configure environment variables for production
5. Set `NODE_ENV=production`
6. Use a process manager like PM2
7. Set up reverse proxy (Nginx or Caddy) for SSL/TLS
8. Configure logging and monitoring

Example PM2 configuration:

```bash
pm2 start src/index.js --name omnisocial-api -i 2
pm2 save
pm2 startup
```

---
  
Built with Express.js and MongoDB for learning backend development.