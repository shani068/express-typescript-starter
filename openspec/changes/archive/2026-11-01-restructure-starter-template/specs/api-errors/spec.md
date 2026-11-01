# Spec Delta

## Purpose

Gives every API failure one predictable JSON shape and status code, so clients and agents can handle errors uniformly without parsing HTML or framework-specific output.

## ADDED Requirements

### Requirement: Standard error body

Every error response from the API SHALL be JSON of the form `{ "error": { "message": string, "details"?: array } }` with an HTTP status in the 4xx or 5xx range.

#### Scenario: Application error

- **WHEN** a route fails with a known client error such as "not found"
- **THEN** the response has the matching status code and a body with `error.message`

### Requirement: Validation errors return 400 with field details

Requests whose input fails validation SHALL receive `400` with `error.details` listing each failing field path and message.

#### Scenario: Invalid request body

- **WHEN** a client sends a body that fails a route's validation
- **THEN** the system responds `400` and `error.details` contains one entry per failing field with its `path` and `message`

### Requirement: Unreadable request bodies return their client error status

A request body that the server's body parser rejects (for example malformed JSON, a body over the size limit, or an unsupported charset or encoding) SHALL receive the parser's 4xx status with the standard error body instead of `500`. Only errors raised by the body parser SHALL be mapped this way; other errors that merely carry a status property SHALL still be treated as unexpected errors.

#### Scenario: Malformed JSON body

- **WHEN** a client sends `Content-Type: application/json` with a body that is not valid JSON
- **THEN** the system responds `400` with the standard error body

#### Scenario: Body over the size limit

- **WHEN** a client sends a JSON body larger than the server accepts
- **THEN** the system responds `413` with the standard error body

#### Scenario: Unrelated error with a status property

- **WHEN** a route fails with an error that has a 4xx `status` property but did not come from the body parser
- **THEN** the system responds `500` with a generic `error.message`

### Requirement: Unknown routes return JSON 404

Requests to paths that match no route SHALL receive `404` with the standard error body.

#### Scenario: Unknown path

- **WHEN** a client requests `GET /does-not-exist`
- **THEN** the system responds `404` with a JSON body containing `error.message`

### Requirement: Database conflicts and missing records are mapped

A unique-constraint violation SHALL map to `409` and an operation on a missing record SHALL map to `404`, each with the standard error body.

#### Scenario: Duplicate unique value

- **WHEN** an operation violates a unique constraint
- **THEN** the system responds `409` with the standard error body

#### Scenario: Record not found during update

- **WHEN** an update targets a record that does not exist
- **THEN** the system responds `404` with the standard error body

### Requirement: Internal errors do not leak details in production

Unexpected errors SHALL respond `500` with a generic message, SHALL be logged with their stack trace, and SHALL include the stack trace in the response only in development.

#### Scenario: Unexpected error in production

- **WHEN** an unexpected error occurs while the environment is `production`
- **THEN** the response is `500` with a generic `error.message` and no stack trace

#### Scenario: Unexpected error in development

- **WHEN** an unexpected error occurs while the environment is `development`
- **THEN** the response body also includes the stack trace
