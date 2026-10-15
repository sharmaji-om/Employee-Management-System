<!-- This guide records completed checks and verification limits. -->
<!-- It separates automated results from manual acceptance checks. -->
<!-- Use the commands in the root README to repeat the checks. -->
# Verification record

Checks were performed on 15-16 October 2026 on Windows with Java 21 and Node.js 22.13. Integration testing and Docker used PostgreSQL 17.6. Local startup was also checked against Neon PostgreSQL 18.6.

## Completed checks

| Check | Result |
|---|---|
| Backend unit tests | 16 passed |
| PostgreSQL API integration tests | 3 passed against an isolated real database |
| Maven verification and JAR packaging | Passed |
| Frontend tests | 10 passed |
| Local launcher tests | 5 passed |
| TypeScript, ESLint and frontend formatting | Passed |
| Frontend production build | Passed |
| Local startup | Backend readiness UP; frontend HTTP 200 |
| Neon migration validation | Original V1 migration validated; schema up to date |
| Docker Compose configuration | Validated |
| Docker runtime | Database and backend healthy; frontend running on port 8088 |
| Docker HTTP checks | Login page and proxied CSRF endpoint returned HTTP 200 |
| Authentication smoke check | Docker login, authenticated session and logout passed with the original configured account |
| Data preservation | Docker migration-history correction preserved 1 administrator, 18 employees and 6 departments |
| Screenshots | Six supplied screenshots in root screenshots/ |

Integration tests cover authentication, authorization, CSRF and employee/department operations using real PostgreSQL, not H2. The original V1 migration remains unchanged. Future schema changes must use new migrations. A development Docker database that recorded a comment-only variant was corrected without changing application records.

## Verification limits

- Playwright specifications are included but were not executed during these checks. Supplied screenshots do not establish automated browser or mobile test coverage.
- GitHub Actions is configured but a hosted CI run has not been verified.
- Neon PostgreSQL 18.6 produces a Flyway support warning. Migration validation and local startup succeeded; Docker uses PostgreSQL 17.6.
- The frontend build reports bundle-size and third-party annotation advisories without failing.
- Environment credentials create the first administrator; changing them does not reset an existing account.

Follow either README startup method and use the demo walkthrough for manual evaluation. Run browser tests against a disposable database. These checks do not constitute an external security audit.
