# Spec Delta

## Purpose

Protects the API from abuse and accidental overload by capping how many requests a single client can make in a time window.

## ADDED Requirements

### Requirement: Per-client limit on API routes

Requests under `/api` SHALL be limited to 100 per client IP per 15-minute window; requests beyond the limit SHALL receive `429` with the standard error body and standard rate-limit headers.

#### Scenario: Within the limit

- **WHEN** a client makes its 100th request to `/api` within 15 minutes
- **THEN** the request is handled normally and the response includes rate-limit headers

#### Scenario: Over the limit

- **WHEN** a client makes its 101st request to `/api` within 15 minutes
- **THEN** the system responds `429` with the standard error body

#### Scenario: Non-API routes are not limited

- **WHEN** a client exceeds the limit on `/api`
- **THEN** requests to `/health` and `/docs` are still served
