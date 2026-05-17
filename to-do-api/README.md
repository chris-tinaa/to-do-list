# To-Do API

TypeScript/Express backend scaffold for the To-Do List project. The project contains the backend architecture for authentication, task lists, tasks, repositories, validation, rate limiting, and database migrations.

## Current Status

`src/app.ts` currently mounts a simple health endpoint:

```text
GET /health
```

The fuller API surface is already represented in route, controller, service, repository, middleware, and model files under `src/`, but those routes still need to be wired into `src/app.ts` before the Express backend serves them.

## Stack

- Node.js
- Express 5
- TypeScript
- Jest and Supertest
- Zod and Joi for validation-related work
- bcrypt for password hashing
- jsonwebtoken for JWT handling
- pg for PostgreSQL access
- express-rate-limit for rate limiting

## Project Structure

```text
to-do-api/
|-- docs/                 # Implementation notes and API collections
|-- src/
|   |-- api/              # Controllers and Express route modules
|   |-- config/           # App, database, env, and JWT configuration
|   |-- middleware/       # Auth, validation, error, and rate-limit middleware
|   |-- migrations/       # SQL migration placeholders
|   |-- models/           # TypeScript model interfaces
|   |-- repositories/     # Memory and SQL repository implementations
|   |-- services/         # Business logic
|   |-- utils/            # JWT, password, migration, and error utilities
|   |-- app.ts            # Express app entry point
|   `-- server.ts         # Server startup
|-- jest.config.js
|-- package.json
`-- tsconfig.json
```

## Installation

```bash
cd to-do-api
npm install
```

## Environment Variables

The environment validation expects these variables:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PORT` | No | `3000` | Server port |
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `LOG_LEVEL` | No | `info` | Logging level |
| `ACCESS_TOKEN_SECRET` | Yes | None | Secret for access tokens |
| `REFRESH_TOKEN_SECRET` | Yes | None | Secret for refresh tokens |
| `ACCESS_TOKEN_EXPIRES_IN` | No | `1h` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRES_IN` | No | `7d` | Refresh token lifetime |
| `DB_CONNECTION` | No | `postgres` | `postgres` or `memory` |
| `DB_HOST` | No | None | PostgreSQL host |
| `DB_PORT` | No | None | PostgreSQL port |
| `DB_USER` | No | None | PostgreSQL user |
| `DB_PASSWORD` | No | None | PostgreSQL password |
| `DB_NAME` | No | None | PostgreSQL database name |
| `DATABASE_URL` | No | None | PostgreSQL connection string |

Example local `.env`:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ACCESS_TOKEN_SECRET=replace-with-a-local-secret
REFRESH_TOKEN_SECRET=replace-with-a-local-refresh-secret
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
DB_CONNECTION=memory
```

## Commands

```bash
npm run dev      # Start development server with nodemon
npm run build    # Compile TypeScript
npm start        # Run compiled server from dist/server.js
npm test         # Run Jest tests
```

## Health Check

Start the server:

```bash
npm run dev
```

Then call:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "success": true,
  "message": "API is healthy"
}
```

## Planned API Routes

The route modules define the intended API shape:

| Area | Routes |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/profile`, `PUT /api/auth/profile`, `GET /api/auth/verify`, `GET /api/auth/statistics` |
| Lists | `GET /api/lists`, `POST /api/lists`, `GET /api/lists/:id`, `PUT /api/lists/:id`, `DELETE /api/lists/:id`, `GET /api/lists/statistics` |
| List tasks | `GET /api/lists/:listId/tasks`, `POST /api/lists/:listId/tasks` |
| Tasks | `GET /api/tasks`, `GET /api/tasks/:id`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`, `PATCH /api/tasks/:id/complete`, `PATCH /api/tasks/:id/incomplete`, `GET /api/tasks/due-this-week`, `GET /api/tasks/sorted-by-deadline`, `GET /api/tasks/statistics` |

## Data Layer

The repository layer is designed around interchangeable storage implementations:

- `src/repositories/memory` for local development and testing.
- `src/repositories/sql` for PostgreSQL-backed persistence.
- `src/repositories/interfaces` for shared contracts.

Migration files currently exist under `src/migrations`, but they are placeholders and should be completed before using PostgreSQL in production.

## Testing

Jest is configured through `jest.config.js` to run TypeScript tests matching:

```text
**/tests/**/*.test.ts
```

Run tests with:

```bash
npm test
```

## API Collections

Import these files into an API client to explore the intended request flows:

- `docs/postman_collection.json`
- `docs/insomnia_collection.json`

## Next Development Steps

1. Mount the route modules in `src/app.ts`.
2. Add request body parsing and middleware ordering in the Express app.
3. Complete SQL migrations.
4. Add or finish integration tests for auth, lists, and tasks.
5. Add a generated OpenAPI document once the mounted routes are stable.
