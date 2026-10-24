# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Ohtuilmo is the registration, administration and review tool for the University of Helsinki software engineering project course. It is a monorepo with an Express + Sequelize (PostgreSQL) backend in `backend/` and a React + Vite frontend in `frontend/`. Node 24.

## Commands

Root (husky + lint-staged runs oxfmt check and oxlint on staged files at commit):

- `npm run install:all` — install root, frontend and backend deps
- `npm start` / `docker compose up` — dev env: db :5432, backend :3001, frontend :3000, adminer :8083. Backend container runs migrations and seeders on start. Use `--build` after dependency changes; `docker compose down --volumes` resets the db.
- `npm run lint`, `npm run format` — oxlint / oxfmt for both packages (CI also runs `format:check`)

Backend API tests (Jest + supertest, run against a real Postgres):

- `cd backend && npm run test-setup` — start test db on :6543 and migrate it
- `npm run test:local` — run all API tests against it
- Single file: `npm run test:local -- tests/api/sprints.test.js` (add `-t "name"` for one test)
- `npm run test:docker` — everything in containers
- New migrations go in `backend/migrations` (sequelize-cli, `npm run db:migrate`); dev data in `backend/seeders`.

Frontend e2e tests (Playwright, specs in `frontend/e2e/tests/*.spec.js`):

- `cd frontend && npm run test-setup` — test db :6543, backend :5001 (NODE_ENV=test, db recreated and seeded), frontend :5000. Rerun to reset state; `npm run test-setup:down` to tear down.
- `npm run test` (Playwright UI) or `npm run test:headless`; first time `npx playwright install chromium`. On macOS port 5000 is taken by AirPlay: `E2E_FRONTEND_PORT=5050 npm run test-setup` and `E2E_BASE_URL=http://localhost:5050 npm run test:headless`
- Single spec: `npm run test:headless -- e2e/tests/timeLogs.spec.js` (add `-g "name"` for one test)
- Tests share one db and run serially (`workers: 1`); CI ([.github/workflows/test.yaml](.github/workflows/test.yaml)) splits spec files into 4 Playwright shards, each with its own db. Traces and the HTML report of failed runs are uploaded as artifacts.
- The app is under `/projekti/` in CI, so tests use paths without a leading slash (`page.goto('register')`, `api/...`).

## Architecture

### Authentication and roles

- Production login is Shibboleth: `POST /api/login` reads the student number from the `hypersonstudentid` (or `schacpersonaluniquecode`) header, creates the `User` if missing, and returns a JWT containing `{ id: student_number, admin, instructor }`. The frontend stores it in localStorage under `loggedInUser` and sends `Authorization: bearer <token>` explicitly in each service call.
- `instructor` is not a stored user flag: it is computed at login as "is instructor of a group whose configuration is `active`". The frontend additionally calls `/api/users/isInstructor`.
- Access control is per-route middleware in [backend/middleware.js](backend/middleware.js): `checkLogin`, `checkInstructor` (instructor or admin), `checkAdmin`, and `optionalLogin` (public endpoints that hide data from anonymous users — use sparingly). Many controllers additionally check ownership (e.g. group membership) inside the handler; access-control bugs have been a recurring fix area, and `permissions.spec.js` / `pageAccess.spec.js` cover them.
- In development (`NODE_ENV=development`) the `fakeshibbo` middleware injects Shibboleth headers for a fake user from [backend/config/dev.js](backend/config/dev.js); `POST /api/role` (dev only) switches it between student/instructor/admin, driven by the role buttons in the navbar.
- Frontend route guards are `AdminRoute`, `InstructorRoute`, `LoginRoute` in [frontend/src/utils/protectedRoutes.jsx](frontend/src/utils/protectedRoutes.jsx).

### Backend

- [backend/index.js](backend/index.js) wires all routers under `/api/*` and exports `{ app, server, db }` (tests import these directly).
- [backend/models/index.js](backend/models/index.js) defines every model and all associations inside `db.connect()`; models are accessed as `db.User`, `db.Group`, etc. Schema changes need both a migration and a model update.
- `Configuration` is the central "course instance" entity: groups, topics, registrations, peer/customer reviews are tied to a configuration, and `RegistrationManagement` points to which configuration is open for topic registration, project registration and peer review. Question sets (registration/review/customer review) are attached to configurations.
- Emails (nodemailer, only when `EMAIL_ENABLED=true`) use DB-stored templates; subjects and links are in [backend/config/index.js](backend/config/index.js).
- API test helpers in `backend/tests/utils/` create/reset data (`loginAs`, `createTestGroup`, `resetUsers`, ...). Tests share one db and run `--runInBand`.

### Frontend

- Redux (classic `connect`, redux-thunk) with one reducer per page in `src/reducers/` and action creators in `src/reducers/actions/`; API calls live in `src/services/` (axios, base from `src/utils/config.js`). UI is MUI.
- Dev server proxies `/api` to the backend (`VITE_BACKEND_URL`); production build is served under `/projekti/`.
- E2e tests select elements by `data-cy` attributes; keep them when editing components. Specs import `test`/`expect` from [frontend/e2e/test.js](frontend/e2e/test.js) (auto-accepts confirm dialogs); login and data setup go through helpers in [frontend/e2e/helpers.js](frontend/e2e/helpers.js) (`loginAsAdmin(page)`, `createGroup(request, ...)`, etc.) which call the API directly; test users are in `e2e/common.js`. The app exposes `window.store` and uses the desktop date picker when `navigator.webdriver` is set.

## Deployment

Pushes to `main` build to staging (https://toska-staging.cs.helsinki.fi/projekti/) via `staging.yaml`; publishing a GitHub release deploys production (`production.yaml`).
