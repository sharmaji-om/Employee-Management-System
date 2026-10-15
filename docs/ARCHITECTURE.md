<!-- This guide explains the application structure and design choices. -->
<!-- It covers data integrity, security and local development. -->
<!-- Read the root README for setup and running commands. -->
# Architecture and decisions

Northstar People is a single-admin employee management application. The browser talks to a Spring Boot REST API; PostgreSQL is the only persistent store. The frontend uses React, TypeScript, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS, and a small custom component system.

## Two startup methods

For local startup, use the root `npm run setup` and `npm run dev` commands. A dependency-free Node launcher reads root `.env` using Node's dotenv parser, validates prerequisites/configuration, starts the Maven-backed Spring Boot service, waits for readiness, and starts Vite. Ctrl+C stops only the processes owned by that launcher. Explicit shell settings override file settings. The local database can be Neon or an installed PostgreSQL server. Database credentials from `.env` are passed to the backend, not to Vite.

For container startup, Docker Compose has its own `.env.docker.example` template. Use `--env-file .env.docker` to keep the container database configuration separate from local/Neon configuration. No Docker executable or daemon is used by the local workflow.

## Backend boundaries

`auth` owns administrator bootstrap, session authentication, and login throttling. `employee` owns employee workflows, query filtering, CSV export, and aggregate counts. `department` owns departments and deletion rules. `common` owns audit timestamps, request identifiers, and API errors.

Controllers validate request DTOs. Services own transactional business rules. Repositories own persistence. JPA entities are never serialized directly. Read endpoints use read-only transactions and the list fetches departments with an entity graph to avoid per-row department queries. Pagination has a stable ID tiebreaker, a 100-row maximum, and an explicit sort allowlist.

## Data integrity

PostgreSQL enforces case-insensitive unique email/department names, nonnegative salaries, valid employment states, and department foreign keys. The service performs earlier duplicate checks for readable feedback; constraints remain authoritative under concurrent requests. Salary is `NUMERIC(14,2)` / `BigDecimal`. IDs are immutable database identity keys rendered as `EMP-00001`; gaps after rollback/deletion are expected.

Updates and deletes carry the version last read by the user. A stale version returns HTTP 409. JPA optimistic locking also handles races between checking and committing. Department deletion is blocked while employees reference it, including concurrent assignments through the database foreign key.

Search is case-insensitive substring matching on name/email. LIKE metacharacters are escaped. B-tree indexes help equality and ordered access; they do not accelerate arbitrary substring search. At substantially larger scale, add measured PostgreSQL trigram indexes and evaluate query plans before changing this design.

## Security model

Every application endpoint except CSRF initialization and login requires ADMIN authorization. Health probes are public and expose status only. Passwords are BCrypt-hashed with cost 12. The initial administrator is created only when the user table is empty; changing bootstrap environment variables later does not reset an existing password.

The browser keeps no authentication token in local/session storage. Spring Security maintains a server-side session and rotates its identifier at login. Cookies are HttpOnly, SameSite=Strict, and Secure when configured for HTTPS. Mutations require a CSRF token. The frontend obtains a fresh token after login and logout. Requests stay same-origin; development uses the Vite proxy and Compose uses Nginx.

Login throttling allows ten attempts per direct client address in five minutes, with bounded in-memory bookkeeping. Behind the included reverse proxy the backend sees the proxy address, so this is a conservative shared limit. A production gateway should provide correctly configured client-IP rate limiting. Do not trust arbitrary forwarded headers from untrusted clients. Multiple replicas require distributed sessions and shared rate limiting; this reference deployment is single-instance.

CSV output uses quoted fields, escaped quotes, UTF-8, and CRLF rows. Spreadsheet formula-like cells receive a leading apostrophe, including international phone numbers. Exports are bounded to 10,000 rows to avoid unbounded memory usage; filter larger datasets before exporting.

## Operational boundaries

The application records creation/update timestamps but is not a legal/compliance audit system. Employee deletion is permanent after confirmation. There is no payroll, public registration, password reset email, or employee self-service portal. These were not requested by the assessment.

Before public production use, configure TLS and Secure cookies, a real secret manager, database backup/restore drills, resource limits, monitoring/alerting, dependency scanning, and an administrator account recovery process. Restrict or disable Swagger if inappropriate for the deployment. Demo data must be disabled. Do not treat the local demo as an audited production deployment.

## UX decisions

URL parameters preserve directory search, filters, page, and sorting. Query state handles loading/error/empty outcomes. Desktop uses a table; mobile uses employee cards. Form edits stay intact when background queries refresh. Unsaved-change guards protect navigation, and conflict errors ask the user to reload instead of silently overwriting another administrator's work.

Salary is annual and uses one organization-wide ISO currency code, default INR. Joining dates may be future dates to represent scheduled starters. Phone formatting is deliberately international and permissive. Department names and employee fields have maximum lengths. Status is explicitly selected by an administrator rather than automatically inferred from dates.
