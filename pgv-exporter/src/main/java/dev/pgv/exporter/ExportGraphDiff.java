package dev.pgv.exporter;

/**
 * An abstraction of a graph diff for exportation to the pgv schema.
 */
public interface ExportGraphDiff {
    /**
     * Returns the list of new nodes to insert.
     *
     * @return the added nodes iterable, or null if none
     */
    Iterable<? extends ExportNode> addedNodes();

    /**
     * Returns the list of new edges to insert.
     *
     * @return the added edges iterable, or null if none
     */
    Iterable<? extends ExportEdge> addedEdges();

    /**
     * Returns the list of node IDs to remove.
     *
     * @return the removed node IDs iterable, or null if none
     */
    Iterable<String> removedNodes();

    /**
     * Returns the list of edge IDs to remove.
     *
     * @return the removed edge IDs iterable, or null if none
     */
    Iterable<String> removedEdges();
}
