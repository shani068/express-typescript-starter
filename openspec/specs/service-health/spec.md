# service-health Specification

## Purpose

Provides an unauthenticated endpoint that load balancers, container orchestrators, and uptime monitors can call to confirm the service process is running.

## Requirements

### Requirement: Health endpoint

`GET /health` SHALL respond `200` with `{ "status": "ok" }` without requiring authentication and without being subject to API rate limits.

#### Scenario: Service is running

- **WHEN** a client requests `GET /health`
- **THEN** the system responds `200` with `{ "status": "ok" }`

#### Scenario: Frequent polling

- **WHEN** a monitor calls `GET /health` more times than the API rate limit allows
- **THEN** every call still responds `200`

### Requirement: Graceful shutdown

On a termination signal the service SHALL stop accepting new connections, let in-flight requests finish, close its external connections, and then exit.

#### Scenario: Termination signal during a request

- **WHEN** the process receives `SIGTERM` while a request is in progress
- **THEN** that request completes before the process exits
