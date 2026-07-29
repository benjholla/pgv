package dev.pgv.exporter;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * A utility for exporting graphs and diffs to JSON matching the pgv schema.
 */
public class PgvExporter {

    public PgvExporter() {}

    /**
     * Exports an ExportGraph to JSON.
     *
     * @param graph the graph to export
     * @param out   the output stream to write the JSON to
     * @throws IOException if an I/O error occurs
     */
    public void exportGraph(ExportGraph graph, OutputStream out) throws IOException {
        out.write("{".getBytes(StandardCharsets.UTF_8));
        boolean firstTop = true;

        if (graph.schema() != null) {
            firstTop = false;
            out.write("\"schema\":{".getBytes(StandardCharsets.UTF_8));
            boolean firstSchema = true;
            if (graph.schema().containment() != null) {
                firstSchema = false;
                out.write("\"containment\":".getBytes(StandardCharsets.UTF_8));
                writeStringIterable(graph.schema().containment(), out);
            }
            out.write("}".getBytes(StandardCharsets.UTF_8));
        }

        if (!firstTop) out.write(",".getBytes(StandardCharsets.UTF_8));
        firstTop = false;
        out.write("\"nodes\":[".getBytes(StandardCharsets.UTF_8));
        if (graph.nodes() != null) {
            boolean first = true;
            for (ExportNode node : graph.nodes()) {
                if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                first = false;
                writeNode(node, out);
            }
        }
        out.write("]".getBytes(StandardCharsets.UTF_8));

        if (!firstTop) out.write(",".getBytes(StandardCharsets.UTF_8));
        out.write("\"edges\":[".getBytes(StandardCharsets.UTF_8));
        if (graph.edges() != null) {
            boolean first = true;
            for (ExportEdge edge : graph.edges()) {
                if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                first = false;
                writeEdge(edge, out);
            }
        }
        out.write("]".getBytes(StandardCharsets.UTF_8));

        out.write("}".getBytes(StandardCharsets.UTF_8));
        out.flush();
    }

    /**
     * Exports an ExportGraphDiff to JSON.
     *
     * @param diff the diff to export
     * @param out  the output stream to write the JSON to
     * @throws IOException if an I/O error occurs
     */
    public void exportDiff(ExportGraphDiff diff, OutputStream out) throws IOException {
        out.write("{".getBytes(StandardCharsets.UTF_8));
        boolean firstTop = true;

        if (diff.addedNodes() != null) {
            firstTop = false;
            out.write("\"addedNodes\":[".getBytes(StandardCharsets.UTF_8));
            boolean first = true;
            for (ExportNode node : diff.addedNodes()) {
                if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                first = false;
                writeNode(node, out);
            }
            out.write("]".getBytes(StandardCharsets.UTF_8));
        }

        if (diff.addedEdges() != null) {
            if (!firstTop) out.write(",".getBytes(StandardCharsets.UTF_8));
            firstTop = false;
            out.write("\"addedEdges\":[".getBytes(StandardCharsets.UTF_8));
            boolean first = true;
            for (ExportEdge edge : diff.addedEdges()) {
                if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                first = false;
                writeEdge(edge, out);
            }
            out.write("]".getBytes(StandardCharsets.UTF_8));
        }

        if (diff.removedNodes() != null) {
            if (!firstTop) out.write(",".getBytes(StandardCharsets.UTF_8));
            firstTop = false;
            out.write("\"removedNodes\":".getBytes(StandardCharsets.UTF_8));
            writeStringIterable(diff.removedNodes(), out);
        }

        if (diff.removedEdges() != null) {
            if (!firstTop) out.write(",".getBytes(StandardCharsets.UTF_8));
            out.write("\"removedEdges\":".getBytes(StandardCharsets.UTF_8));
            writeStringIterable(diff.removedEdges(), out);
        }

        out.write("}".getBytes(StandardCharsets.UTF_8));
        out.flush();
    }

    private void writeNode(ExportNode node, OutputStream out) throws IOException {
        out.write("{".getBytes(StandardCharsets.UTF_8));
        out.write("\"id\":".getBytes(StandardCharsets.UTF_8));
        writeString(node.id(), out);

        if (node.tags() != null) {
            out.write(",\"tags\":".getBytes(StandardCharsets.UTF_8));
            writeStringIterable(node.tags(), out);
        }

        if (node.attributes() != null) {
            out.write(",\"attributes\":".getBytes(StandardCharsets.UTF_8));
            writeAttributes(node.attributes(), out);
        }
        out.write("}".getBytes(StandardCharsets.UTF_8));
    }

    private void writeEdge(ExportEdge edge, OutputStream out) throws IOException {
        out.write("{".getBytes(StandardCharsets.UTF_8));
        out.write("\"id\":".getBytes(StandardCharsets.UTF_8));
        writeString(edge.id(), out);

        out.write(",\"source\":".getBytes(StandardCharsets.UTF_8));
        writeString(edge.source(), out);

        out.write(",\"target\":".getBytes(StandardCharsets.UTF_8));
        writeString(edge.target(), out);

        if (edge.tags() != null) {
            out.write(",\"tags\":".getBytes(StandardCharsets.UTF_8));
            writeStringIterable(edge.tags(), out);
        }

        if (edge.attributes() != null) {
            out.write(",\"attributes\":".getBytes(StandardCharsets.UTF_8));
            writeAttributes(edge.attributes(), out);
        }
        out.write("}".getBytes(StandardCharsets.UTF_8));
    }

    private void writeAttributes(Map<String, Object> attributes, OutputStream out) throws IOException {
        out.write("{".getBytes(StandardCharsets.UTF_8));
        boolean first = true;
        for (Map.Entry<String, Object> entry : attributes.entrySet()) {
            if (entry.getValue() == null) continue; // Skip nulls
            if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
            first = false;
            writeString(entry.getKey(), out);
            out.write(":".getBytes(StandardCharsets.UTF_8));
            writeValue(entry.getValue(), out);
        }
        out.write("}".getBytes(StandardCharsets.UTF_8));
    }

    private void writeValue(Object value, OutputStream out) throws IOException {
        if (value instanceof String) {
            writeString((String) value, out);
        } else if (value instanceof Number || value instanceof Boolean) {
            out.write(String.valueOf(value).getBytes(StandardCharsets.UTF_8));
        } else if (value instanceof Map) {
            out.write("{".getBytes(StandardCharsets.UTF_8));
            boolean first = true;
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) value).entrySet()) {
                if (entry.getValue() == null) continue;
                if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                first = false;
                writeString(String.valueOf(entry.getKey()), out);
                out.write(":".getBytes(StandardCharsets.UTF_8));
                writeValue(entry.getValue(), out);
            }
            out.write("}".getBytes(StandardCharsets.UTF_8));
        } else if (value instanceof Iterable) {
            out.write("[".getBytes(StandardCharsets.UTF_8));
            boolean first = true;
            for (Object item : (Iterable<?>) value) {
                if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                first = false;
                writeValue(item, out);
            }
            out.write("]".getBytes(StandardCharsets.UTF_8));
        } else if (value instanceof Object[]) {
            out.write("[".getBytes(StandardCharsets.UTF_8));
            boolean first = true;
            for (Object item : (Object[]) value) {
                if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                first = false;
                writeValue(item, out);
            }
            out.write("]".getBytes(StandardCharsets.UTF_8));
        } else if (value instanceof int[]) {
             out.write("[".getBytes(StandardCharsets.UTF_8));
             boolean first = true;
             for (int item : (int[]) value) {
                 if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                 first = false;
                 writeValue(item, out);
             }
             out.write("]".getBytes(StandardCharsets.UTF_8));
        } else if (value instanceof double[]) {
             out.write("[".getBytes(StandardCharsets.UTF_8));
             boolean first = true;
             for (double item : (double[]) value) {
                 if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                 first = false;
                 writeValue(item, out);
             }
             out.write("]".getBytes(StandardCharsets.UTF_8));
        } else if (value instanceof boolean[]) {
             out.write("[".getBytes(StandardCharsets.UTF_8));
             boolean first = true;
             for (boolean item : (boolean[]) value) {
                 if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                 first = false;
                 writeValue(item, out);
             }
             out.write("]".getBytes(StandardCharsets.UTF_8));
        } else if (value instanceof long[]) {
             out.write("[".getBytes(StandardCharsets.UTF_8));
             boolean first = true;
             for (long item : (long[]) value) {
                 if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
                 first = false;
                 writeValue(item, out);
             }
             out.write("]".getBytes(StandardCharsets.UTF_8));
        } else {
            // Fallback for unexpected types
            writeString(String.valueOf(value), out);
        }
    }

    private void writeStringIterable(Iterable<String> iterable, OutputStream out) throws IOException {
        out.write("[".getBytes(StandardCharsets.UTF_8));
        boolean first = true;
        for (String s : iterable) {
            if (!first) out.write(",".getBytes(StandardCharsets.UTF_8));
            first = false;
            writeString(s, out);
        }
        out.write("]".getBytes(StandardCharsets.UTF_8));
    }

    private void writeString(String s, OutputStream out) throws IOException {
        if (s == null) {
            out.write("null".getBytes(StandardCharsets.UTF_8));
            return;
        }
        out.write("\"".getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < '\u0020') {
                        String hex = String.format("\\u%04x", (int) c);
                        sb.append(hex);
                    } else {
                        sb.append(c);
                    }
                    break;
            }
        }
        out.write(sb.toString().getBytes(StandardCharsets.UTF_8));
        out.write("\"".getBytes(StandardCharsets.UTF_8));
    }
}
