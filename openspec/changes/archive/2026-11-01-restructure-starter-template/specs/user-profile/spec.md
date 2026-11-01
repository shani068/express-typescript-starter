# Spec Delta

## Purpose

Lets a signed-in user read and update their own profile through the API, exposing only safe fields and accepting only fields the user is allowed to change.

## ADDED Requirements

### Requirement: Read own profile

`GET /api/v1/users/me` SHALL return the signed-in user's `id`, `name`, `email`, and `createdAt` as a JSON object, and SHALL NOT include credential data.

#### Scenario: Signed-in user reads profile

- **WHEN** a signed-in user requests `GET /api/v1/users/me`
- **THEN** the system responds `200` with a JSON object containing `id`, `name`, `email`, and `createdAt`

#### Scenario: Not signed in

- **WHEN** a client requests `GET /api/v1/users/me` without a session
- **THEN** the system responds `401` with the standard error body

### Requirement: Update own profile with validated fields only

`PUT /api/v1/users/me` SHALL accept only a `name` field of 2 to 100 characters, SHALL reject any other field with a validation error, and SHALL return the updated profile.

#### Scenario: Valid name update

- **WHEN** a signed-in user sends `{ "name": "Ada Lovelace" }`
- **THEN** the system responds `200` with the profile showing the new name

#### Scenario: Attempt to change a protected field

- **WHEN** a signed-in user sends `{ "email": "other@example.com" }`
- **THEN** the system responds `400` with the standard validation error body and the stored email is unchanged

#### Scenario: Name too short

- **WHEN** a signed-in user sends `{ "name": "A" }`
- **THEN** the system responds `400` with a validation error naming the `name` field
