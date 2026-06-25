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
    @GetMapping("/cfg-main")
    public GraphSnapshot cfgMain() {
        return new GraphSnapshot(
            "cfg-main",
            1,
            List.of(
                new GraphNode("entry", List.of("entry"), Map.of(
                    "label", "Entry",
                    "kind", "basic-block"
                ), null),
                new GraphNode("init", List.of(), Map.of(
                    "label", "Initialize i = 0",
                    "line", 3
                ), null),
                new GraphNode("condition", List.of("decision", "loop"), Map.of(
                    "label", "i < n?",
                    "line", 4
                ), null),
                new GraphNode("body", List.of(), Map.of(
                    "label", "sum += values[i]",
                    "line", 5
                ), null),
                new GraphNode("increment", List.of("loop"), Map.of(
                    "label", "i++",
                    "line", 6
                ), null),
                new GraphNode("exit", List.of("exit"), Map.of(
                    "label", "Return sum",
                    "line", 8
                ), null)
            ),
            List.of(
                new GraphEdge("e-entry-init", "entry", "init", List.of(), Map.of()),
                new GraphEdge("e-init-condition", "init", "condition", List.of(), Map.of()),
                new GraphEdge("e-condition-body", "condition", "body", List.of("true-branch"), Map.of(
                    "label", "true"
                )),
                new GraphEdge("e-body-increment", "body", "increment", List.of(), Map.of()),
                new GraphEdge("e-increment-condition", "increment", "condition", List.of("back-edge"), Map.of(
                    "label", "next"
                )),
                new GraphEdge("e-condition-exit", "condition", "exit", List.of("false-branch"), Map.of(
                    "label", "false"
                ))
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
}
