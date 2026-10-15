<!-- This guide explains the application and its setup. -->
<!-- Install Java 21 and Node.js, then run npm run setup from the root. -->
<!-- Choose local setup or Docker Compose and follow the matching steps below. -->
# Northstar People

Employee management application for the Kloudspot Backend Fresher Assessment, built with Java 21, Spring Boot, PostgreSQL, React and TypeScript.

## Two ways to run

Choose either method. Both run the same application without changes to source code; only environment settings need to be filled in.

| | Method 1: Local | Method 2: Docker Compose |
|---|---|---|
| Install on your computer | Java 21+ JDK and Node.js 22.13+ | Docker Desktop with its Linux engine running |
| Database | Your PostgreSQL server or Neon | PostgreSQL container created automatically |
| Settings file | `.env`, copied from `.env.example` | `.env.docker`, copied from `.env.docker.example` |
| Start command | `npm run dev` | `docker compose --env-file .env.docker up --build -d` |
| Open | http://127.0.0.1:5173 | http://localhost:8088 |

The two methods use separate databases by default. Data and administrator credentials are not automatically shared between them.

## Screenshots

The **`screenshots/` folder in the project root** contains screenshots of the application:

| Screen | Screenshot |
|---|---|
| Login | [Login page](screenshots/Login_Page.png) |
| Overview | [Overview page](screenshots/Overview_Page.png) |
| Employee directory | [People page](screenshots/People_Page.png) |
| Employee details | [Employee information](screenshots/Employee_Information.png) |
| Add employee | [Add employee form](screenshots/Add_Employee.png) |
| Departments | [Departments page](screenshots/Departments_Page.png) |

![Overview of Northstar People](screenshots/Overview_Page.png)

## Project structure

```text
backend/       Spring Boot API, database migrations and Java tests
frontend/      React application, frontend tests and Nginx configuration
scripts/       Local setup and startup commands
screenshots/   Application screenshots
docs/          Architecture, verification, demo guide and Postman collection
compose.yaml   Docker services and persistent database volume
```

## Features

- Administrator sign-in, protected APIs and pages, secure sessions, CSRF protection, logout, and login throttling.
- Employee creation, details, editing, confirmed deletion, generated employee IDs, and active/inactive status.
- Case-insensitive name/email search, combined department/status filters, server-side pagination, and sorting.
- Department CRUD with employee counts and prevention of deleting occupied departments.
- Filtered or full CSV export, with quoting and spreadsheet-formula protection.
- Responsive overview, employee directory, employee forms, profile pages, and department cards.
- Inline validation, loading/error/empty states, unsaved-change protection, and optimistic concurrency checks.
- Flyway migrations, PostgreSQL constraints, service tests, integration tests, frontend tests, and browser tests.
- Docker Compose, CI, OpenAPI documentation, and a Postman collection.

## Method 1: Run locally

This method runs Java and React on your computer and connects to Neon cloud PostgreSQL or an installed PostgreSQL database. It does not use Docker.

Prerequisites: **Java 21+ JDK**, **Node.js 22.13+ with npm**, and a PostgreSQL database. Use Neon if you do not want to install PostgreSQL. Maven is supplied by the wrapper. Internet access is needed for the first dependency downloads and for Neon connections.

### 1. Prepare the project

Open a terminal in this project root (the folder containing this README):

```sh
npm run setup
```

This checks the JDK, installs frontend dependencies, and creates `.env` from `.env.example` only when the file is missing. Existing `.env` values are never overwritten. No root `npm install` is needed.

### 2. Fill and save the root `.env`

For **Neon**, open Connect, select Java, and turn connection pooling off. Use the direct hostname, database, role, and password shown there:

```dotenv
DATABASE_URL=jdbc:postgresql://YOUR_NEON_HOST:5432/neondb?sslmode=require&channelBinding=require
DATABASE_USER=neondb_owner
DATABASE_PASSWORD=YOUR_NEON_PASSWORD
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-your-own-password-at-least-12-characters
DEMO_DATA=true
APP_CURRENCY=INR
COOKIE_SECURE=false
PORT=8080
FRONTEND_PORT=5173
```

Replace the placeholders, including the admin password, and **save the file**. The database credentials come from Neon; you choose the administrator login yourself. If your database/role names differ, use those instead. Keep credentials separate from the JDBC URL. Do not use a generic `postgresql://user:password@...` connection string; this application needs `jdbc:postgresql://...`.

For **installed local PostgreSQL**, create a role and database in your administration tool, running each statement separately:

```sql
CREATE ROLE people LOGIN PASSWORD 'your-chosen-database-password';
```

```sql
CREATE DATABASE people OWNER people;
```

Then set `DATABASE_URL=jdbc:postgresql://localhost:5432/people`, `DATABASE_USER=people`, and that role's password. All other settings remain the same. Flyway creates the application's tables automatically.

Quoted `.env` values are supported. Quote passwords containing `#`, for example `DATABASE_PASSWORD="your#password"`. The file is ignored by Git. Press Ctrl+S before starting: settings in an unsaved editor tab are not available to the launcher.

### 3. Start the app

From the project root:

```sh
npm run dev
```

This loads `.env`, checks prerequisites and ports, starts Spring Boot, waits until its health check succeeds, and starts React. Open **http://127.0.0.1:5173** and sign in with your configured administrator. **Ctrl+C stops both processes started by the launcher.** You do not need to type individual `$env:` commands.

While signed in, Swagger is at **http://127.0.0.1:5173/docs**. Use one hostname consistently because cookies do not transfer between `localhost` and `127.0.0.1`.

### Other local commands

| Command, from the project root | Purpose |
|---|---|
| `npm run setup` | First-time installation; preserves existing `.env` |
| `npm run check` | Check saved settings, Java, and ports without starting the app |
| `npm run dev` | Start backend and frontend together |
| `npm run dev:backend` | Start only the backend, loading root `.env` |
| `npm run dev:frontend` | Start only the frontend, using the configured API port |
| `npm run test:launcher` | Test `.env` parsing, validation, and port conflict handling |

For two terminals, run `npm run dev:backend` in one and `npm run dev:frontend` in the other. Both commands run from the root. Raw `mvnw spring-boot:run` remains available for advanced use, but the root launcher is what loads `.env` automatically.

### Local troubleshooting

- **Java not found:** install Java 21+ JDK and set `JAVA_HOME` to its installation folder, not `bin`. Reopen your terminal. You may also add `JAVA_HOME` to `.env`. The launcher can discover it from Java already on PATH. A JRE alone is not enough.
- **Missing settings:** edit and save `.env`, not `.env.example`. An existing empty `.env` is preserved; paste the template into it yourself.
- **Port already in use:** stop the earlier app or change `PORT` / `FRONTEND_PORT`. The proxy follows the backend port automatically. Unrelated processes are never stopped.
- **Database connection failed:** check the direct hostname, database name, role, password, and network access. For local PostgreSQL, make sure its service is running.
- **Settings seem unchanged:** restart after editing `.env`. Explicit shell environment variables take precedence; open a fresh terminal to use only the saved file values.
- **Password changed but login still fails:** admin bootstrap settings only create the initial account; they do not reset an existing account.

### Demo data and initial administrator

With `DEMO_DATA=true`, an empty database receives six departments and eighteen fictional employees. Existing records are not replaced. The administrator is created only when the user table is empty. Its password must contain at least 12 characters and at most 72 UTF-8 bytes. Changing `ADMIN_PASSWORD` later does not reset an existing account. Use your own credentials and disable demo data for real deployment.

## No manual source-code changes

Both startup paths use configuration files; neither requires editing Java, React, API URLs, or build files. Installing prerequisites and filling your own credentials in `.env` or `.env.docker` are configuration steps. Database tables and the initial administrator are created automatically on first startup.

## Method 2: Run with Docker Compose

This method runs the database, backend and frontend in containers. It requires Docker Desktop with Linux containers running, or Docker Engine with Compose. You do not need to install Java, Node.js, Maven or PostgreSQL on the host.

1. Open Docker Desktop and wait for its Linux engine to be running. `docker version` must show both Client and Server information.
2. From the project root, copy the template only if `.env.docker` does not already exist. In PowerShell:

```powershell
if (!(Test-Path .env.docker)) { Copy-Item .env.docker.example .env.docker }
notepad .env.docker
```

Choose `DATABASE_PASSWORD`, `ADMIN_EMAIL` and `ADMIN_PASSWORD`, then save the file. The administrator password must contain at least 12 characters and at most 72 UTF-8 bytes. Keep `COOKIE_SECURE=false` for local HTTP and `WEB_PORT=8088` unless that port is occupied. For passwords containing `$` or `#`, enclose the entire value in single quotes so Compose uses it literally. Keep your local/Neon `.env` unchanged.
3. Run from the project root:

```sh
docker compose --env-file .env.docker up --build -d
```

4. Open **http://localhost:8088** and use the credentials in `.env.docker`.

Docker creates its own PostgreSQL container and persistent volume; this option does not use your Neon database. Compose supplies its internal database URL/role. `WEB_PORT` changes the Docker frontend port; the local launcher uses `FRONTEND_PORT`.

```sh
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs backend
docker compose --env-file .env.docker down
```

Records survive normal stops/restarts in the named volume. Avoid `down -v` unless you intend to discard the database. Changing the database or administrator password in the environment file does not reset credentials already stored in an existing database.

If Docker reports a missing engine pipe, start Docker Desktop. If startup fails, check `docker compose --env-file .env.docker ps -a` and `docker compose --env-file .env.docker logs --tail=100 backend database frontend`. The first build needs internet access to download images and dependencies. If port 8088 is busy, change only `WEB_PORT` in `.env.docker` and run the startup command again.

## Environment variables

| Variable | Purpose / default |
|---|---|
| `DATABASE_URL` | JDBC URL; defaults to `jdbc:postgresql://localhost:5432/people` |
| `DATABASE_USER` | Database role; defaults to `people` |
| `DATABASE_PASSWORD` | Required database password |
| `ADMIN_EMAIL` | Initial administrator email; required for an empty user table |
| `ADMIN_PASSWORD` | Initial administrator password; required for an empty user table |
| `DEMO_DATA` | Seed fictional records into an empty workspace; default `false` |
| `APP_CURRENCY` | Organization-wide ISO currency code; default `INR` |
| `COOKIE_SECURE` | Set `true` with HTTPS; default `false` for local HTTP |
| `PORT` | Backend HTTP port; default `8080` (keep this in Compose) |
| `FRONTEND_PORT` | Local frontend port; default `5173` |
| `JAVA_HOME` | Optional JDK installation directory when Java is not on PATH |
| `WEB_PORT` | Docker frontend port only; default `8088` |

## Tests and builds

Backend, from `backend/`:

```sh
./mvnw test       # JUnit 5 / Mockito unit tests; does not need PostgreSQL or Docker
./mvnw verify     # Unit tests + PostgreSQL integration tests via Testcontainers
./mvnw package    # Unit tests + executable JAR
```

Use `mvnw.cmd` on Windows. Integration tests require a running Docker engine by default. Alternatively, create a **separate empty test database** and set `TEST_DATABASE_URL`, `TEST_DATABASE_USER`, and `TEST_DATABASE_PASSWORD` before `verify`. Never point tests at a real employee database. The integration tests use their own `test@example.com` administrator.

Frontend, from `frontend/`:

```sh
npm ci
npm run lint
npm run format:check
npm test
npm run build
```

The checked-in lockfile makes dependency installation reproducible. `.npmrc` uses legacy peer resolution to avoid npm 10's optional-peer resolver failure with the test runner; required testing peers are declared explicitly.

Browser tests require the backend on port 8080 and a reachable test database. They create and clean up synthetic records. They are intended for a disposable development environment:

```powershell
$env:E2E_EMAIL='admin@example.com'
$env:E2E_PASSWORD='your-admin-password'
npx playwright install chromium
npm run test:e2e
```

For macOS/Linux, use `export E2E_EMAIL=...` and `export E2E_PASSWORD=...`. The suite starts the frontend automatically, unless it is already running on port 5173. The CI workflow is configured to run unit, integration, build, and browser checks on Ubuntu. The supplied screenshots are in root `screenshots/`. The browser screenshot specification saves fresh captures into `screenshots/generated/`, keeping the supplied images unchanged.

See [verification results](docs/VERIFICATION.md) for exactly what was run in the implementation environment and its limitations.

## API use

All application endpoints use `/api/v1`. Authenticated application endpoints require ADMIN authorization. Requests that modify data also require the CSRF token returned by `GET /auth/csrf`. Session cookies must be retained across requests. After login, fetch a **fresh** CSRF token because Spring rotates it.

Import `docs/postman/Northstar-People.postman_collection.json` into Postman. Set `baseUrl` to `http://localhost:8088` (Compose) or `http://127.0.0.1:8080` (direct backend), plus your email/password. Run the requests in order. The collection stores CSRF tokens and created record IDs/versions automatically. Credentials are placeholders, not embedded secrets.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/auth/csrf` | Obtain token and header name |
| POST | `/auth/login` | Form-urlencoded email/password |
| GET | `/auth/me` | Current administrator and currency |
| POST | `/auth/logout` | Invalidate session |
| GET | `/employees` | Search, filter, sort, and page |
| GET | `/employees/{id}` | Employee details |
| POST | `/employees` | Create employee |
| PUT | `/employees/{id}` | Update employee; include current `version` |
| DELETE | `/employees/{id}?version=0` | Delete with version check |
| GET | `/employees/summary` | Overview counts |
| GET | `/employees/export` | CSV, optionally filtered; max 10,000 records |
| GET / POST | `/departments` | List or create departments |
| GET / PUT / DELETE | `/departments/{id}` | View, update, or delete department |

Employee list parameters: `search`, `department` (numeric ID), `status` (`ACTIVE`/`INACTIVE`), `page` (zero-based), `size` (1–100), `sort` (`fullName`, `joiningDate`, `salary`, `employeeId`, `department`, `status`), and `direction` (`asc`/`desc`). Export accepts search/department/status and includes all matches, not just one page.

Errors have `status`, `message`, field `errors`, `requestId`, and `timestamp`. Common statuses: 400 invalid input, 401 unauthenticated, 403 forbidden/invalid CSRF, 404 missing record, 409 duplicate/conflicting edit or occupied department, 429 login throttling. A concurrent modification requires reloading the record before retrying.

## Deployment and operations

The Compose deployment is a single application instance behind Nginx. Production deployment also requires TLS, Secure cookies, real secrets, tested database backups, monitoring, resource limits, and an administrator recovery procedure. Login throttling is deliberately conservative behind a proxy; use a trusted gateway's per-client rate limiter before public exposure. Sessions and throttling are in-memory, so restarting the backend signs users out. Horizontal scaling requires shared session storage and a distributed limiter.

Back up the PostgreSQL database with your managed backup tool or `pg_dump`; encrypt backups and restrict access because they contain employee records and password hashes. Practice restores into an isolated database. Do not modify an already-applied Flyway migration; add a new migration. For rollback after a destructive schema change, restore a verified backup rather than relying on application rollback alone.

## Supporting documents

- [Architecture and tradeoffs](docs/ARCHITECTURE.md)
- [Verification results and limits](docs/VERIFICATION.md)
- [Five-minute demo walkthrough](docs/DEMO-WALKTHROUGH.md)
- [Postman collection](docs/postman/Northstar-People.postman_collection.json)
- [Configuration file guide](docs/FILE-GUIDE.md)

The repository contains example settings only. Supply your own credentials when running it. Do not include `.env`, `.env.docker`, dependencies, build output, logs or database volumes in a submission.
