package dev.pgv.exporter;

/**
 * Represents the schema definition for a graph snapshot.
 */
public interface ExportSchema {
    /**
     * Tags that should be treated as containment relationships.
     *
     * @return the iterable of containment tags, or null if none
     */
    Iterable<String> containment();
}
