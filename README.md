# Ohtuilmo

[![PROD](https://github.com/UniversityOfHelsinkiCS/ohtuilmo/actions/workflows/production.yaml/badge.svg)](https://github.com/UniversityOfHelsinkiCS/ohtuilmo/actions/workflows/production.yaml)
[![CI](https://github.com/UniversityOfHelsinkiCS/ohtuilmo/actions/workflows/staging.yaml/badge.svg)](https://github.com/UniversityOfHelsinkiCS/ohtuilmo/actions/workflows/staging.yaml)
[![Tests](https://github.com/UniversityOfHelsinkiCS/ohtuilmo/actions/workflows/test.yaml/badge.svg)](https://github.com/UniversityOfHelsinkiCS/ohtuilmo/actions/workflows/test.yaml)

Registration, administration and review tool for University of Helsinki's software engineering project course.

## Development

Requirements: Docker with docker compose, and Node 24 (for running tests, linters and formatters on the host).

### How to start development

1.  Clone this repository and install dependencies with `npm run install:all` in the repository root (installs root, frontend and backend packages; needed for the tests and the git pre-commit hook).

2.  Run `docker compose up` (or `npm start`) in the repository root to start development containers:

    | Container | Port |
    | --------- | ---- |
    | db        | 5432 |
    | backend   | 3001 |
    | frontend  | 3000 |
    | adminer   | 8083 |

    The backend container runs database migrations and seeders on start. The app is at [http://localhost:3000](http://localhost:3000).

3.  When you are done, close containers from the active console with `CTRL+C` or from another console with `docker compose down`.

### When there is change in dependencies

If frontend or backend dependencies change (a change in `package.json`), rebuild the containers with `docker compose down` followed by `docker compose up --build`.

### How to restore database to its initial state

Remove the containers and volumes with `docker compose down --volumes` and restart with `docker compose up`.

### How to change user roles in dev environment

In the development environment login is faked in the backend by the `fakeshibbo` middleware (`backend/middleware.js`). The fake users (student, instructor, admin) are defined in `backend/config/dev.js`.

To switch the current user, press one of the role buttons on the navbar. After that all requests to the backend are made as a user with the selected role.

### Linting and formatting

`npm run lint` (oxlint) and `npm run format` (oxfmt) in the repository root run them for both frontend and backend. A pre-commit hook checks the staged files, and CI runs the lint and format checks too.

## Running tests locally

There are two test suites: backend API tests (Jest + supertest) and end-to-end tests (Playwright). Both use a PostgreSQL test database in a Docker container on port 6543. The test setups of the two suites share that database container, so run only one of them at a time.

Run `npm run install:all` first if you have not done it.

### Backend API tests (Jest)

Run in the `backend` folder:

1. Start the test database and run migrations into it:

   ```
   npm run test-setup
   ```

   This starts the test database (port 6543) and an Adminer (port 9090), and runs the migrations with a one-off container. Wait until the migrations have finished (`docker compose -f ../compose.local-test.yaml logs -f migrate-db`) before running the tests the first time.

2. Run the tests against it:

   ```
   npm run test:local
   ```

   - a single file: `npm run test:local -- tests/api/sprints.test.js`
   - a single test: `npm run test:local -- tests/api/sprints.test.js -t "test name"`
   - with a coverage report of controllers and middleware: `npm run test:coverage` (HTML report in `backend/coverage/`)

   The tests reset the data they need themselves, so they can be rerun without restarting the setup. If a migration changes, run `npm run test-setup` again.

3. When you are done: `npm run test-setup:down`

Alternatively `npm run test:docker` runs everything (database, migrations and tests) in containers, without needing the setup above.

### E2E tests (Playwright)

Run in the `frontend` folder:

1. On the first run install the browser with `npx playwright install chromium`.

2. Start the test setup:

   ```
   npm run test-setup
   ```

   This starts these containers:

   | Container | Port |
   | --------- | :--: |
   | db        | 6543 |
   | backend   | 5001 |
   | frontend  | 5000 |
   | adminer   | 9090 |

   The backend runs with `NODE_ENV=test` and recreates and seeds the database on start, so wait until [http://localhost:5000](http://localhost:5000) responds before running the tests.

   On macOS port 5000 is taken by the AirPlay receiver; use another port with `E2E_FRONTEND_PORT=5050 npm run test-setup` and give the tests the matching address with `E2E_BASE_URL=http://localhost:5050` (e.g. `E2E_BASE_URL=http://localhost:5050 npm run test:headless`).

3. Run the tests:
   - in the Playwright UI: `npm run test`
   - headless: `npm run test:headless`
   - a single spec: `npm run test:headless -- e2e/tests/timeLogs.spec.js`
   - a single test: add `-g "test name"`

   The specs are in `frontend/e2e/tests/`. They share one database and run serially. Traces of failed tests are opened with `npx playwright show-trace <path>`.

4. To restore the test setup and the database to their initial state, run `npm run test-setup` again.

5. When you are done, remove the containers with `npm run test-setup:down`.

Alternatively `npm run test:docker` runs the whole e2e suite in containers (also Playwright itself) and `npm run test:docker:down` removes them.

### Tests in CI

GitHub Actions ([test.yaml](.github/workflows/test.yaml)) runs lint and format checks, the API tests and the e2e tests split into 4 shards. Traces and the HTML report of failed e2e runs are uploaded as workflow artifacts.

## How to run API tests

1. Switch to backend folder and start test setup with command `npm run test-setup`.

2. Run tests in the Playwright UI with `npm run test:local` or headless with `npm run test:headless`. A single test file is run with `npm run test:local -- tests/api/<file_name>.test.js`. To run a single test, add `-t "test name"`.

3. If you want to restore test setup and the database to their initial stage, just run `npm run test-setup` again.

4. When you are done, you can remove containers and all related resources with command `npm run test-setup:down`

## How to manually inspect database

Development setup includes database management tool called Adminer. With Adminer, you can easily inspect and modify database by using your browser. When development containers are running, navigate to [http://localhost:8083/](http://localhost:8083/) and sign in with following info:

| Field    | Value                                                   |
| -------- | ------------------------------------------------------- |
| System   | PostgreSQL (important: otherwise login hangs)           |
| Server   | db (or test-db in the test setup, Adminer at port 9090) |
| Username | postgres                                                |
| Password | postgres                                                |
| Database | postgres                                                |

## Staging

<https://toska-staging.cs.helsinki.fi/projekti/>

After a successful staging build, the new version should appear on the staging-server in 15mins.

### Project links (legacy)

- [Definition of Done](/documentation/definition_of_done.md)
- [Work schedule](/documentation/work_schedule.md)
- [Team practices](/documentation/team_practices.md)
- [Product backlog](https://github.com/orgs/Ohtuilmo/projects/1)
- [Worked hours](https://docs.google.com/spreadsheets/d/e/2PACX-1vRnlawBu2lDWxWYNQsZnKCnWiG41CknVIywZnWhlX3j-18jG2Kyh2MxMxhKrqqTQkDnvm0NPfUBslDE/pubhtml)
- [Developer workflow instructions](/documentation/developer_workflow.md)
