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

- [Model Link](https://app.eraser.io/workspace/Cii6AbvNDxNIb3p880kS)

