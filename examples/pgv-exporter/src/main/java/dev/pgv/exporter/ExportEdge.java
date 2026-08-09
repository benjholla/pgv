package dev.pgv.exporter;

import java.util.Map;

/**
 * An abstraction of a graph edge for exportation to the pgv schema.
 */
public interface ExportEdge {
    /**
     * Returns the globally unique identifier of this edge.
     *
     * @return the edge ID
     */
    String id();

    /**
     * Returns the unique identifier of the source (from) node.
     *
     * @return the source node ID
     */
    String source();

    /**
     * Returns the unique identifier of the target (to) node.
     *
     * @return the target node ID
     */
    String target();

    /**
     * Returns an iterable of tags attached to this edge.
     *
     * @return the iterable of tags, or null if none
     */
    Iterable<String> tags();

    /**
     * Returns a map of typed attributes attached to this edge.
     *
     * @return the attributes map, or null if none
     */
    Map<String, Object> attributes();
}
