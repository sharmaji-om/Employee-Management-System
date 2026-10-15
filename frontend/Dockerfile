# This file builds the frontend Docker image.
# Docker Compose uses it for the container setup.
# Run docker compose --env-file .env.docker up --build from the root.
FROM node:22-alpine AS build
WORKDIR /build
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.28-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /build/dist /usr/share/nginx/html
EXPOSE 8080
