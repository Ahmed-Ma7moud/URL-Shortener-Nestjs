# URL Shortener API

A URL-shortening service built with NestJS, TypeScript, PostgreSQL, and Redis. Authenticated users can create, manage, and redirect short links. The API also includes refresh-token authentication, role-based admin user management, request validation, rate limiting, and Swagger documentation.

## Features

- User registration with OTP verification, login, logout, token refresh, and password reset
- JWT access tokens and persistent refresh tokens
- Create, list, update, and delete user-owned short URLs
- Public redirects with Redis caching
- Admin-only user creation, listing, role updates, and deletion
- PostgreSQL migrations managed with TypeORM
- Redis-backed OTP, redirect cache, JWT blacklist, and rate-limit storage
- Swagger/OpenAPI documentation

## Requirements

- Node.js 22 or newer
- npm
- PostgreSQL 16
- Redis 7
- Docker and Docker Compose (optional, for the complete local stack)

## Configuration

Create a `.env` file in the project root:

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=url_shortener
REDIS_HOST=localhost
REDIS_PORT=6379
DOMAIN=http://localhost:3000
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
```

`DOMAIN` is used when the API returns a shortened URL. Keep it aligned with the public address of the running API. Do not commit real secrets to source control.

## Quick start with Docker

Docker Compose starts the API, PostgreSQL, Redis, and a one-shot migration service:

```bash
docker compose up --build
```

The API is available at `http://localhost:3000` (or the port configured in `.env`). Stop the stack with:

```bash
docker compose down
```

Named volumes preserve PostgreSQL and Redis data. Add `-v` only when you intentionally want to delete that data.

## Local development

Start PostgreSQL and Redis, then install dependencies, apply migrations, and run the API:

```bash
npm install
npm run migration:run
npm run start:dev
```

Other useful commands:

```bash
npm run build
npm run start:prod
npm run migration:revert
npm run migration:generate -- src/migrations/describe-change
```

## API documentation

Interactive Swagger documentation is available at `http://localhost:3000/api/docs`.

Protected endpoints require `Authorization: Bearer <access-token>`.

### Authentication

| Method | Endpoint                     | Description                                |
| ------ | ---------------------------- | ------------------------------------------ |
| POST   | `/api/auth/register`         | Start registration and generate an OTP     |
| POST   | `/api/auth/verify-otp`       | Verify registration OTP and receive tokens |
| POST   | `/api/auth/login`            | Log in and receive tokens                  |
| POST   | `/api/auth/refresh-token`    | Issue a new access token                   |
| POST   | `/api/auth/forgot-password`  | Start password reset                       |
| POST   | `/api/auth/verify-reset-otp` | Verify reset OTP                           |
| POST   | `/api/auth/reset-password`   | Set a new password                         |
| POST   | `/api/auth/change-password`  | Change the authenticated user's password   |
| POST   | `/api/auth/logout`           | Revoke a refresh token                     |

### URLs

| Method | Endpoint        | Description                        |
| ------ | --------------- | ---------------------------------- |
| POST   | `/api/urls`     | Create a short URL                 |
| GET    | `/api/urls`     | List the authenticated user's URLs |
| GET    | `/api/urls/:id` | Get one owned URL                  |
| PATCH  | `/api/urls/:id` | Update one owned URL               |
| DELETE | `/api/urls/:id` | Delete one owned URL               |
| GET    | `/:shortCode`   | Redirect to the original URL       |

Pagination endpoints accept `page` and `limit`; `limit` is capped at 100.

### Users and administration

| Method | Endpoint                    | Access                     |
| ------ | --------------------------- | -------------------------- |
| GET    | `/api/users/me`             | Authenticated user profile |
| PATCH  | `/api/users/me`             | Update own profile         |
| DELETE | `/api/users/me`             | Delete own profile         |
| POST   | `/api/admin/users`          | Admin only                 |
| GET    | `/api/admin/users`          | Admin only                 |
| GET    | `/api/admin/users/:id`      | Admin only                 |
| PATCH  | `/api/admin/users/:id/role` | Admin only                 |
| DELETE | `/api/admin/users/:id`      | Admin only                 |

## Example request

After verifying a user and copying the returned access token:

```bash
curl -X POST http://localhost:3000/api/urls \
  -H 'Authorization: Bearer <access-token>' \
  -H 'Content-Type: application/json' \
  -d '{"originalUrl":"https://example.com/article"}'
```

The response contains a generated six-character `shortCode` and a public URL such as `http://localhost:3000/aB3xYz`.

## OTP development note

Email delivery is not configured yet. Registration and password-reset OTP values are logged by the API process for development and testing. OTP records expire after five minutes and failed verification is limited to three attempts.

## Project structure

```text
src/
  auth/          JWT authentication, OTP flows, guards, and DTOs
  user/          User profiles and admin user management
  url/           Short URL creation, management, and redirects
  redis/         Redis connection and shared Redis service
  rate-limiter/  Redis-backed throttling and exception handling
  migrations/    TypeORM database migrations
  common/        Shared DTOs, interfaces, and utilities
```

## Technology stack

- NestJS 11 and TypeScript
- TypeORM with PostgreSQL
- Redis via ioredis
- Passport JWT and bcrypt
- class-validator and class-transformer
- Swagger/OpenAPI
