# Project Structure
```
root/
│── client/                     # React / Next.js frontend
│
└── server/                     # Node.js backend
    │
    ├── src/
    │   ├── config/             # DB connection, cloud configs, logger
    │   │    ├── db.js
    │   │    ├── redis.js
    │   │    └── cloudinary.js
    │   │
    │   ├── models/             # Mongoose schemas
    │   │    ├── user.model.js
    │   │    ├── video.model.js
    │   │    ├── comment.model.js
    │   │    └── playlist.model.js
    │   │
    │   ├── repositories/       # DB queries only (no business logic)
    │   │    ├── user.repo.js
    │   │    ├── video.repo.js
    │   │    └── comment.repo.js
    │   │
    │   ├── services/           # Business logic
    │   │    ├── auth.service.js
    │   │    ├── video.service.js
    │   │    └── playlist.service.js
    │   │
    │   ├── controllers/        # API layer (req → res)
    │   │    ├── auth.controller.js
    │   │    ├── video.controller.js
    │   │    └── user.controller.js
    │   │
    │   ├── routes/             # All API routes
    │   │    ├── auth.routes.js
    │   │    ├── video.routes.js
    │   │    └── user.routes.js
    │   │
    │   ├── middleware/         # auth, validators, error handlers
    │   │    ├── auth.middleware.js
    │   │    ├── validate.middleware.js
    │   │    └── error.middleware.js
    │   │
    │   ├── utils/              # helpers, JWT utils, email, hashing
    │   │    ├── ApiResponse.js
    │   │    ├── ApiError.js
    │   │    ├── jwt.js
    │   │    └── uploader.js
    │   │
    │   ├── validation/         # JOI/Zod validators
    │   │    ├── user.validation.js
    │   │    ├── video.validation.js
    │   │    └── playlist.validation.js
    │   │
    │   ├── constants/          # roles, enums, config keys
    │   │    └── roles.js
    │   │
    │   ├── jobs/               # cron jobs, queues, background tasks
    │   │    └── cleanupOldVideos.js
    │   │
    │   ├── app.js              # express app (middlewares, routes)
    │   └── server.js           # entry point (starts server)
    │
    ├── test/                   # unit + integration tests
    │    └── auth.test.js
    │
    ├── logs/                   # production logs
    │
    ├── .env                    # environment variables
    ├── .env.example            # sample env for contributors
    ├── package.json
    ├── README.md
    └── Dockerfile              # for containerized deployment
```

### 🔗 **Model Link**
[https://app.eraser.io/workspace/Cii6AbvNDxNIb3p880kS](https://app.eraser.io/workspace/Cii6AbvNDxNIb3p880kS)

---

## **Current Folder Structure & Purpose**

### **`src/`** - Source Code Root

#### **`index.js`**
The main application entry point. Loads environment variables, connects to MongoDB, and starts the HTTP server with error handling.

#### **`app.js`**
Configures the Express application: CORS, body parsers, cookie parser, static files, request logger, routes, 404 handler, and centralized error middleware.

#### **`controllers/`**
Contains request handlers that implement business logic and send responses.
- **Example**: `user.controller.js` - handles user registration, login, profile updates
- **Purpose**: Separates routing from logic; keeps route files clean

#### **`routes/`**
Defines URL endpoints and maps them to controller functions.
- **Example**: `user.route.js` - defines `/api/v1/users/register`, `/login`, etc.
- **Purpose**: Central place for all API routes; improves discoverability

#### **`models/`**
Mongoose schemas and models that define data structure and database behavior.
- **Example**: `user.model.js` - user schema with password hashing, JWT token methods
- **Example**: `video.model.js` - video schema with owner refs and aggregate pagination
- **Purpose**: Enforces data integrity; keeps DB logic centralized

#### **`db/`**
Database connection setup and configuration.
- **Example**: `index.js` - connects to MongoDB with error handling and logging
- **Purpose**: Isolates DB connection logic; makes testing easier

#### **`middlewares/`**
Reusable middleware functions that process requests before reaching controllers.
- **Use cases**: Authentication, input validation, file upload handling, rate limiting
- **Purpose**: DRY principle; keeps common logic reusable across routes

#### **`utils/`**
Helper functions and utilities used throughout the application.
- **`logger.js`** - console logger with log levels
- **`asyncHandler.js`** - wraps async route handlers to catch errors
- **`ApiError.js`** - standardized error response class
- **`ApiResponse.js`** - standardized success response wrapper
- **`cloudinary.js`** - file upload utility for Cloudinary
- **Purpose**: Reduces code duplication; provides consistent utilities

#### **`constants.js`**
Application-wide constants, configuration values, and enums.
- **Use cases**: Feature flags, rate limits, default values, status codes
- **Purpose**: Avoids magic strings/numbers; single source of truth

---

## **Architecture Benefits**

✅ **Separation of Concerns** - Each folder has a single, clear responsibility  
✅ **Testability** - Import app/controllers/models independently for unit tests  
✅ **Maintainability** - New features follow predictable patterns  
✅ **Scalability** - Easy to add new routes, models, or middleware  
✅ **Onboarding** - New developers can quickly understand the structure
