# project-layout Specification

## Purpose

Defines where each kind of code lives in the starter template, how files are named and imported, and what a freshly cloned copy must pass, so any developer or coding agent can place new code without guessing.

## Requirements

### Requirement: Each source folder has a single documented responsibility

The template SHALL organize application source into `routes/` (HTTP paths and request/response handling), `controllers/` (business logic), `schemas/` (input/output validation and their types), `lib/` (one client per external system), `middleware/` (cross-route request handling), `utils/` (pure helpers), and `types/` (global type augmentation), with `agents/` added when a project introduces an agent.

#### Scenario: Placement rules are documented

- **WHEN** a developer opens the template's agent instructions or README
- **THEN** they find a table naming each source folder, what belongs in it, and an example file

#### Scenario: No empty placeholder folders

- **WHEN** the template is freshly cloned
- **THEN** every source folder that exists contains at least one source file

### Requirement: Controllers are independent of HTTP

Controller functions SHALL accept typed inputs and return data or throw errors, and SHALL NOT depend on the HTTP framework or its request/response objects, so the same logic can be called from routes, agent tools, jobs, and tests.

#### Scenario: Lint rejects HTTP imports in controllers

- **WHEN** a controller file imports the HTTP framework
- **THEN** the template's check command reports an error

#### Scenario: Controller is callable without a request

- **WHEN** a test calls a controller function with plain arguments
- **THEN** it returns the result without constructing a request or response object

### Requirement: Feature files share one name across folders

Files belonging to one feature SHALL use the same kebab-case feature name followed by their role, such as `users.routes.ts`, `users.controller.ts`, `users.schema.ts`, and `tests/users.test.ts`.

#### Scenario: Finding everything for a feature

- **WHEN** a developer searches the repository for files starting with `users.`
- **THEN** they find that feature's route, controller, schema, and test files

### Requirement: Imports use the source alias

Imports that leave the importing file's folder SHALL use the `@/` source alias instead of parent-relative paths.

#### Scenario: Parent-relative import is rejected

- **WHEN** a source file imports a module using a `../` path
- **THEN** the template's check command reports an error

### Requirement: A fresh clone passes validation

A freshly cloned template, after installing dependencies and copying the example environment file, SHALL pass the check command (format, lint, type-check) and the test command with no errors.

#### Scenario: Clean validation on clone

- **WHEN** a developer clones the repository, installs dependencies, and runs the check and test commands
- **THEN** both commands exit successfully

#### Scenario: Line endings do not fail checks on Windows

- **WHEN** the repository is cloned on Windows with default Git settings
- **THEN** the format check does not report line-ending differences

### Requirement: Tests live in a top-level tests folder

Automated tests SHALL live under `tests/` and be discovered by the test command without extra configuration by the developer.

#### Scenario: New test file is discovered

- **WHEN** a developer adds `tests/orders.test.ts`
- **THEN** the test command runs it
