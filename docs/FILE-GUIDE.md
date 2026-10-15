<!-- This guide explains files that cannot contain comments. -->
<!-- JSON files remain unchanged so their tools can read them. -->
<!-- Each entry gives three simple lines about purpose and use. -->
# Files without inline comments

JSON does not support comments. These explanations are kept here to preserve valid configuration files. Generated files and installed dependencies are not edited. Maven wrapper license notices and required script markers are preserved. Applied SQL migrations remain unchanged because Flyway checks their contents.

## `package.json`

- This file defines commands for local application setup and startup.
- Install Node.js and Java 21, then run npm run setup from the root.
- Fill .env and run npm run dev from the root.

## `frontend/package.json`

- This file lists frontend packages and development commands.
- Run npm ci from frontend to install the locked dependencies.
- Run npm test, npm run lint or npm run build from frontend.

## `frontend/package-lock.json`

- This generated file pins the frontend dependency versions.
- Use npm ci from frontend to install the exact versions.
- Let npm update this file when dependencies change.

## `frontend/tsconfig.json`

- This file configures TypeScript checks for the frontend.
- It selects supported syntax, types and strict checking options.
- Run npm run build from frontend to check and build the app.

## `frontend/.prettierrc.json`

- This file defines the frontend code formatting rules.
- Install the frontend development packages before formatting.
- Run npm run format:check from frontend to check formatting.

## `docs/postman/Northstar-People.postman_collection.json`

- This file contains example API requests for Postman.
- Import it into Postman and set its variables for your running backend.
- Follow the authentication and CSRF steps in the root README.
