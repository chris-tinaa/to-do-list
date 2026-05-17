# To-Do List

A full-stack task management project with a TypeScript/Express backend scaffold and a Next.js frontend for signing in, viewing task statistics, managing lists, and creating or completing tasks.

The repository is split into two apps:

| Path | Purpose | Stack |
| --- | --- | --- |
| `to-do-api` | Backend API scaffold for authentication, lists, tasks, repositories, middleware, and migrations | Node.js, Express, TypeScript, Jest |
| `to-do-fe` | Web app and local API route handlers used by the task management dashboard | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |

## Features

- User authentication flow with register, login, refresh, logout, and token verification routes.
- Task list management with create, read, update, delete, and statistics routes.
- Task management with create, read, update, delete, complete, incomplete, and statistics routes.
- Dashboard UI for list and task summaries.
- JWT-based session handling in the frontend.
- Express backend structure with controllers, services, repositories, middleware, and TypeScript models.
- Postman and Insomnia collections under `to-do-api/docs`.

## Repository Structure

```text
to-do-list/
|-- to-do-api/          # Express + TypeScript backend scaffold
|   |-- docs/           # API collections and implementation checklist
|   |-- src/            # API routes, controllers, services, repositories, middleware
|   |-- dist/           # Compiled JavaScript output
|   `-- package.json
`-- to-do-fe/           # Next.js frontend
    |-- app/            # Pages and API route handlers
    |-- components/     # UI components
    |-- hooks/
    |-- lib/
    `-- package.json
```

## Prerequisites

- Node.js 18 or newer.
- npm for the backend.
- pnpm, npm, or another Node package manager for the frontend. The frontend includes a `pnpm-lock.yaml`, so pnpm is the natural choice.
- PostgreSQL if you continue the backend SQL repository path. The current Next.js demo API routes use mock or in-memory data.

## Quick Start

Clone the repository:

```bash
git clone https://github.com/chris-tinaa/to-do-list.git
cd to-do-list
```

Run the frontend:

```bash
cd to-do-fe
pnpm install
pnpm dev
```

Open the app at `http://localhost:3000`.

The demo login screen is prefilled with:

```text
Email: chris-tinaa@example.com
Password: SecurePass123!
```

Run the backend scaffold in a separate terminal:

```bash
cd to-do-api
npm install
npm run dev
```

The backend health check is available at:

```text
GET http://localhost:3000/health
```

If both apps run at the same time, start one of them on a different port.

## Frontend App

The frontend is a Next.js application with:

- Landing page at `/`.
- Login and registration pages under `/auth`.
- Authenticated task dashboard at `/dashboard`.
- API route handlers under `app/api` for auth, lists, tasks, task completion, task statistics, and health checks.

The dashboard stores `accessToken` and `refreshToken` in `localStorage` after login and sends bearer tokens to the local Next.js API routes.

## Backend API Scaffold

The backend includes a TypeScript Express project with planned layers for:

- API routes and controllers.
- Authentication middleware.
- Request validation.
- Rate limiting.
- Service-layer business logic.
- Memory and SQL repositories.
- Model interfaces.
- Migration utilities.

At the moment, `to-do-api/src/app.ts` mounts the `/health` route. The more complete route modules live under `to-do-api/src/api/routes` and can be wired into the Express app as development continues.

## Useful Commands

Backend commands:

```bash
cd to-do-api
npm run dev      # Start the TypeScript development server with nodemon
npm run build    # Compile TypeScript
npm start        # Run dist/server.js
npm test         # Run Jest tests
```

Frontend commands:

```bash
cd to-do-fe
pnpm dev         # Start the Next.js dev server
pnpm build       # Build for production
pnpm start       # Start the production server
pnpm lint        # Run Next.js linting
```

## API Route Summary

Frontend-local API routes include:

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Check local API status |
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Log in and receive tokens |
| `POST` | `/api/auth/refresh` | Refresh an access token |
| `POST` | `/api/auth/logout` | Log out |
| `GET` | `/api/lists` | List task lists |
| `POST` | `/api/lists` | Create a task list |
| `GET` | `/api/lists/[id]` | Get a list |
| `PUT` | `/api/lists/[id]` | Update a list |
| `DELETE` | `/api/lists/[id]` | Delete a list |
| `GET` | `/api/lists/[id]/tasks` | List tasks in a list |
| `POST` | `/api/lists/[id]/tasks` | Create a task in a list |
| `GET` | `/api/tasks` | List all tasks |
| `GET` | `/api/tasks/statistics` | Get task statistics |
| `PATCH` | `/api/tasks/[id]/complete` | Mark a task complete |
| `PATCH` | `/api/tasks/[id]/incomplete` | Mark a task incomplete |

The backend scaffold has matching Express route modules under `to-do-api/src/api/routes`, but those routes still need to be mounted in `src/app.ts` before the backend serves the full API surface.

## Documentation

Additional documentation lives in:

- `to-do-api/README.md` for backend setup and architecture.
- `to-do-api/docs/tasks.md` for the original implementation plan and task checklist.
- `to-do-api/docs/postman_collection.json` for Postman.
- `to-do-api/docs/insomnia_collection.json` for Insomnia.
- `to-do-fe/README.md` for frontend setup and user flow.

## Development Notes

- The frontend API route handlers currently use mock or in-memory data, so data may reset between server restarts.
- The backend migration files are placeholders and should be completed before relying on PostgreSQL persistence.
- Avoid committing real JWT secrets, database passwords, or production credentials.

## License

The backend package is marked as `ISC` in `to-do-api/package.json`. Add a root `LICENSE` file if you want repository-wide license text.
