# Spring Boot Graph Producer Example

This example represents a backend graph producer. It emits immutable graph snapshots as JSON and does not include layout, coordinates, selection, filters, or renderer state.

Run it with:

```bash
mvn spring-boot:run
```

Or, from the repository root:

```bash
mvn -f examples/spring-boot-producer/pom.xml spring-boot:run
```

If your Maven installation cannot resolve the `spring-boot` prefix, use the full plugin coordinate:

```bash
mvn -f examples/spring-boot-producer/pom.xml org.springframework.boot:spring-boot-maven-plugin:3.3.5:run
```

Fetch the milestone-1 sample graph:

```text
GET http://localhost:8080/api/graphs/cfg-main
```

The Vite demo can consume the same shape from `/sample-cfg.json` or from this endpoint if you add a small fetch URL switch.
