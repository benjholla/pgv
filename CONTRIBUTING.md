# Contributing to @pgv/graph-core

Thank you for your interest in contributing to `@pgv/graph-core`! This document provides guidelines for setting up your environment, making changes, and submitting pull requests.

## Development Environment Setup

This project uses `pnpm` as its package manager. Please ensure you have `pnpm` installed.

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```

## Development Commands

*   **Run type checking:**
    ```bash
    pnpm run typecheck
    ```
*   **Run tests:**
    ```bash
    pnpm run test
    ```
*   **Run benchmarks:**
    ```bash
    pnpm run bench
    ```
*   **Generate documentation:**
    ```bash
    pnpm run docs
    ```
*   **Build the library:**
    ```bash
    pnpm run build
    ```

## Testing Philosophy (Bouncer)

We prioritize repository confidence, correctness, strict invariants, explicit specifications, behavioral verification, and deterministic tests. Treat broken or disabled tests as high-priority technical debt.

*   Always run `pnpm run test` and ensure all tests pass before opening a PR.
*   If you add a new feature or fix a bug, please write tests that verify the expected behavior.

## Documentation Philosophy (Steward)

Documentation is part of the product and should evolve with the code.

*   Ensure the documented capabilities accurately reflect the implementation.
*   Whenever documentation contradicts implementation, implementation wins. Update the documentation.
*   Every public API must be documented using TSDoc. Run `pnpm run docs` to ensure there are no validation warnings.

## Pull Request Guidelines

1.  Read all relevant documentation and `AGENTS.md` to understand the project's architecture and vision.
2.  Review existing open Pull Requests to avoid duplicating work.
3.  Write tests for new functionality and bug fixes.
4.  Run all development commands (tests, typecheck, build, docs) locally.
5.  Provide a clear, descriptive PR title and summary of changes.
