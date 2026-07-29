package dev.pgv.exporter;

import java.util.Map;

/**
 * An abstraction of a graph node for exportation to the pgv schema.
 */
public interface ExportNode {
    /**
     * Returns the globally unique identifier of this node.
     *
     * @return the node ID
     */
    String id();

    /**
     * Returns an iterable of tags attached to this node.
     *
     * @return the iterable of tags, or null if none
     */
    Iterable<String> tags();

    /**
     * Returns a map of typed attributes attached to this node.
     *
     * @return the attributes map, or null if none
     */
    Map<String, Object> attributes();
}
