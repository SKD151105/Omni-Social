# Project Structure (current)
```
root/
│── client/                     # Frontend (separate)
│
└── server/                     # Node.js backend
    └── src/
        ├── app.js             # Express app wiring (middlewares, routes)
        ├── index.js           # Entry point (bootstrap server/db)
        ├── constants.js       # Shared constants
        ├── controllers/       # HTTP handlers (thin)
        │    └── user.controller.js
        ├── services/          # Business logic
        │    └── user.service.js
        ├── repositories/      # Data access (Mongoose queries)
        │    └── user.repository.js
        ├── models/            # Mongoose schemas
        │    ├── user.model.js
        │    ├── video.model.js
        │    └── subscription.model.js
        ├── middlewares/       # Auth, uploads, etc.
        │    ├── auth.middleware.js
        │    └── multer.middleware.js
        ├── routes/            # Route definitions
        │    └── user.route.js
        └── utils/             # Helpers (ApiError, ApiResponse, asyncHandler, cloudinary)
```

---

## Current Folder Structure & Purpose (what I expect readers to know)

- `src/index.js`: boots the server (env load, DB connect, Express start).
- `src/app.js`: assembles the Express app (parsers, CORS, cookies, routes, 404, error handler).
- `src/controllers/`: thin HTTP handlers; `user.controller.js` delegates to services.
- `src/services/`: business logic (auth/profile/history flows) without HTTP concerns; consumes repositories and utils.
- `src/repositories/`: data-access wrappers over Mongoose (e.g., `user.repository.js` for queries/aggregations).
- `src/models/`: Mongoose schemas (`user`, `video`, `subscription`).
- `src/middlewares/`: request-time cross-cutting concerns (`auth.middleware`, `multer.middleware`).
- `src/routes/`: route definitions (`user.route.js`) wiring verbs/paths to controllers.
- `src/utils/`: shared helpers (`ApiError`, `ApiResponse`, `asyncHandler`, `cloudinary`).
- `src/constants.js`: shared constants for reuse.

---

## **Architecture Benefits**

✅ **Separation of Concerns** - Each folder has a single, clear responsibility  
✅ **Testability** - Import app/controllers/models independently for unit tests  
✅ **Maintainability** - New features follow predictable patterns  
✅ **Scalability** - Easy to add new routes, models, or middleware  
✅ **Onboarding** - New developers can quickly understand the structure

---

## Architecture Notes (why it looks this way and how to grow it)

<span style="color:lightgreen; font-weight:600;">MVC in practice:</span> routes → controllers → models (classic Express flow). Controllers stay thin and defer to services; models are pure Mongoose schemas.

<span style="color:lightgreen; font-weight:600;">Layered in this codebase:</span> routes → controllers → services → repositories → models. I chose this for clarity and reviewer-friendliness: each layer has one reason to change, and I can unit-test services and integration-test repositories/controllers without heavy setup.

**What this buys us today:**
- Fast onboarding: easy to trace a request end-to-end.
- Test seams: controllers mock services; services mock repositories.
- Data layer insulation: repositories centralize Mongoose specifics.

**When the app grows:**
- Move to domain-first slices to keep feature code co-located (e.g., `users/{controller,service,repository,model}`, `videos/...`) and reduce cross-folder hopping.
- Add request validation per route (zod/Joi) to formalize contracts.
- Add structured logging + correlation IDs and a central error mapper to keep API responses consistent.
- Enforce a config schema (e.g., envalid) so env issues fail fast.
- Broaden tests: service unit tests for business rules, repository integration tests against a test DB, controller contract tests.

**How I’d summarize this choice:** Started layered for clarity and speed; ready to evolve to domain-first plus stronger validation, logging, and config guardrails as feature surface and team size increase.

---

## How to run locally

1) Install deps
```
npm install
```

2) Copy env and fill values
```
cp .env.example .env
# set Mongo URI, JWT secrets, Cloudinary creds, etc.
```

3) Start the server (dev)
```
npm run dev
```

4) (Optional) Lint/test if/when added
```
npm run lint
npm test
```
