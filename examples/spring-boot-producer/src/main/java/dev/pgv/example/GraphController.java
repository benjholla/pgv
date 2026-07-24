package dev.pgv.example;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/graphs")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class GraphController {
    @GetMapping("/cfg-main/schema")
    public GraphSchema cfgMainSchema() {
        return new GraphSchema(List.of("contains"));
    }

    @GetMapping("/cfg-main")
    public GraphSnapshot cfgMain() {
        return new GraphSnapshot(
            "cfg-main",
            1,
            List.of(
                new GraphNode("entry", List.of("XCSG.ControlFlow_Node", "XCSG.controlFlowRoot"), Map.of(
                    "XCSG.name", "Entry"
                ), null),
                new GraphNode("init", List.of("XCSG.ControlFlow_Node"), Map.of(
                    "XCSG.name", "Initialize i = 0",
                    "line", Map.of("integer", 3)
                ), null),
                new GraphNode("condition", List.of("XCSG.ControlFlow_Node", "XCSG.Loop"), Map.of(
                    "XCSG.name", "i < n?",
                    "line", Map.of("integer", 4)
                ), null),
                new GraphNode("body", List.of("XCSG.ControlFlow_Node"), Map.of(
                    "XCSG.name", "sum += values[i]",
                    "line", Map.of("integer", 5)
                ), null),
                new GraphNode("increment", List.of("XCSG.ControlFlow_Node"), Map.of(
                    "XCSG.name", "i++",
                    "line", Map.of("integer", 6)
                ), null),
                new GraphNode("exit", List.of("XCSG.ControlFlow_Node", "XCSG.controlFlowExit"), Map.of(
                    "XCSG.name", "Return sum",
                    "line", Map.of("integer", 8)
                ), null),
                new GraphNode("Foo", List.of("XCSG.Function"), Map.of(
                    "XCSG.name", "Foo"
                ), null)
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
    }

    record GraphSnapshot(
        String graphId,
        long version,
        List<GraphNode> nodes,
        List<GraphEdge> edges
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    record GraphNode(
        String id,
        List<String> tags,
        Map<String, Object> attributes,
        String parent
    ) {
    }

    record GraphEdge(
        String id,
        String source,
        String target,
        List<String> tags,
        Map<String, Object> attributes
    ) {
    }

    record GraphSchema(
        List<String> containment
    ) {
    }
}
