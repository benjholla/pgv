package dev.pgv.example;

import dev.pgv.exporter.ExportEdge;
import dev.pgv.exporter.ExportGraph;
import dev.pgv.exporter.ExportNode;
import dev.pgv.exporter.ExportSchema;
import dev.pgv.exporter.PgvExporter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/graphs")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class GraphController {

    private final PgvExporter exporter = new PgvExporter();

    @GetMapping("/cfg-main")
    public void cfgMain(HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        GraphSnapshot snapshot = new GraphSnapshot(
            "cfg-main",
            1,
            List.of(
                new GraphNode("entry", List.of("XCSG.ControlFlow_Node", "XCSG.controlFlowRoot"), Map.of(
                    "XCSG.name", "Entry"
                )),
                new GraphNode("init", List.of("XCSG.ControlFlow_Node"), Map.of(
                    "XCSG.name", "Initialize i = 0",
                    "line", Map.of("integer", 3)
                )),
                new GraphNode("condition", List.of("XCSG.ControlFlow_Node", "XCSG.Loop"), Map.of(
                    "XCSG.name", "i < n?",
                    "line", Map.of("integer", 4)
                )),
                new GraphNode("body", List.of("XCSG.ControlFlow_Node"), Map.of(
                    "XCSG.name", "sum += values[i]",
                    "line", Map.of("integer", 5)
                )),
                new GraphNode("increment", List.of("XCSG.ControlFlow_Node"), Map.of(
                    "XCSG.name", "i++",
                    "line", Map.of("integer", 6)
                )),
                new GraphNode("exit", List.of("XCSG.ControlFlow_Node", "XCSG.controlFlowExit"), Map.of(
                    "XCSG.name", "Return sum",
                    "line", Map.of("integer", 8)
                )),
                new GraphNode("Foo", List.of("XCSG.Function"), Map.of(
                    "XCSG.name", "Foo"
                ))
            ),
            List.of(
                new GraphEdge("e-entry-init", "entry", "init", List.of("XCSG.ControlFlow_Edge"), Map.of()),
                new GraphEdge("e-init-condition", "init", "condition", List.of("XCSG.ControlFlow_Edge"), Map.of()),
                new GraphEdge("e-condition-body", "condition", "body", List.of("XCSG.ControlFlow_Edge"), Map.of(
                    "XCSG.conditionValue", true
                )),
                new GraphEdge("e-body-increment", "body", "increment", List.of("XCSG.ControlFlow_Edge"), Map.of()),
                new GraphEdge("e-increment-condition", "increment", "condition", List.of("XCSG.ControlFlow_Edge"), Map.of(
                    "XCSG.name", "next"
                )),
                new GraphEdge("e-condition-exit", "condition", "exit", List.of("XCSG.ControlFlow_Edge"), Map.of(
                    "XCSG.conditionValue", false
                )),
                new GraphEdge("e-Foo-entry-contains", "Foo", "entry", List.of("XCSG.Contains"), Map.of()),
                new GraphEdge("e-Foo-init-contains", "Foo", "init", List.of("XCSG.Contains"), Map.of()),
                new GraphEdge("e-Foo-condition-contains", "Foo", "condition", List.of("XCSG.Contains"), Map.of()),
                new GraphEdge("e-Foo-body-contains", "Foo", "body", List.of("XCSG.Contains"), Map.of()),
                new GraphEdge("e-Foo-increment-contains", "Foo", "increment", List.of("XCSG.Contains"), Map.of()),
                new GraphEdge("e-Foo-exit-contains", "Foo", "exit", List.of("XCSG.Contains"), Map.of())
            )
        );

        exporter.exportGraph(snapshot, response.getOutputStream());
    }

    record GraphSnapshot(
        String graphId,
        long version,
        List<GraphNode> nodesList,
        List<GraphEdge> edgesList
    ) implements ExportGraph {
        @Override
        public ExportSchema schema() {
            return () -> List.of("XCSG.Contains");
        }
        @Override
        public Iterable<? extends ExportNode> nodes() {
            return nodesList;
        }
        @Override
        public Iterable<? extends ExportEdge> edges() {
            return edgesList;
        }
    }

    record GraphNode(
        String id,
        List<String> tags,
        Map<String, Object> attributes
    ) implements ExportNode {
    }

    record GraphEdge(
        String id,
        String source,
        String target,
        List<String> tags,
        Map<String, Object> attributes
    ) implements ExportEdge {
    }

}
