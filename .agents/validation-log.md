# Validation Log

## Node/npm

Node and npm were installed after initial scaffolding.

PowerShell blocks `npm.ps1` on this system due to execution policy, so validation
used `npm.cmd`.

Validated commands:

```bash
npm.cmd run build
npm.cmd run build:demo
npm.cmd audit --audit-level=low
npm.cmd pack --dry-run
```

Results:

- TypeScript typecheck passed.
- Library build passed.
- Vite static demo production build passed.
- npm audit reported `found 0 vulnerabilities`.
- npm package dry-run included the expected publish files only.

## Dependency Fixes

Initial `npm install` reported two vulnerabilities through the Vite 5 dependency
chain. Vite was upgraded to `^8.1.0`, and `package-lock.json` was regenerated.

Build errors fixed:

- `examples/vite-static/src/main.ts` now uses a `requireElement` helper so DOM
  nodes are non-null after lookup.
- `src/readonly-map.ts` now has an explicit `ReadonlyMap` type annotation.
- `vite.config.ts` no longer uses unsupported `cssFileName`.

## Maven / Spring Boot

Maven was installed later in the session.

Validated commands:

```bash
mvn -f examples/spring-boot-producer/pom.xml -DskipTests package
mvn -f examples/spring-boot-producer/pom.xml spring-boot:help -Ddetail=false
```

Results:

- Spring Boot example packaged successfully.
- The `spring-boot:` plugin prefix resolved successfully.
- A packaged JAR was started briefly on port `18080`.
- Fetching `http://127.0.0.1:18080/api/graphs/cfg-main` returned:

```text
Graph cfg-main v1: 6 nodes, 6 edges
```

## Current Caveats

- `mvn spring-boot:run` must be run from `examples/spring-boot-producer`, or use
  the root-safe `mvn -f examples/spring-boot-producer/pom.xml spring-boot:run`.
- From PowerShell, prefer `npm.cmd` unless execution policy has been changed.
