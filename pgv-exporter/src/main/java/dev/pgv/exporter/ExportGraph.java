package dev.pgv.exporter;

/**
 * An abstraction of a graph snapshot for exportation to the pgv schema.
 */
public interface ExportGraph {
    /**
     * Returns the optional schema for this graph.
     *
     * @return the schema, or null if none
     */
    ExportSchema schema();

    /**
     * Returns an iterable of all nodes in this graph.
     *
     * @return the nodes iterable
     */
    Iterable<? extends ExportNode> nodes();

    /**
     * Returns an iterable of all edges in this graph.
     *
     * @return the edges iterable
     */
    Iterable<? extends ExportEdge> edges();
}
