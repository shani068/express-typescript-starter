# Spec Delta

## Purpose

Lets people create an account and sign in with email and password, and lets the API restrict routes to signed-in users through session cookies.

## ADDED Requirements

### Requirement: Email and password sign-up

The system SHALL let a new user register with a name, email, and password at `POST /api/auth/sign-up/email`, storing the password only as a credential hash and never on the user record.

#### Scenario: Successful sign-up

- **WHEN** a client posts a new name, email, and valid password to `/api/auth/sign-up/email`
- **THEN** the system creates the user and returns a session

#### Scenario: Duplicate email

- **WHEN** a client signs up with an email that already has an account
- **THEN** the system rejects the request with a client error and creates no new user

### Requirement: Email and password sign-in

The system SHALL let a registered user sign in at `POST /api/auth/sign-in/email` and receive a session.

#### Scenario: Correct credentials

- **WHEN** a registered user posts their email and correct password
- **THEN** the system returns a session cookie

#### Scenario: Wrong password

- **WHEN** a user posts a registered email with an incorrect password
- **THEN** the system rejects the request with an unauthorized error and issues no session

### Requirement: Protected routes require a session

Routes marked as protected SHALL respond `401` with the standard error body when the request has no valid session, and SHALL make the signed-in user available to the route otherwise.

#### Scenario: Request without session

- **WHEN** a client calls a protected route without a session cookie
- **THEN** the system responds `401` with the standard error body

#### Scenario: Request with valid session

- **WHEN** a client calls a protected route with a valid session cookie
- **THEN** the route runs on behalf of that session's user
