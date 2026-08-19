# Skeptic Learnings

- Duplicate structural data access, like `typeof node.attributes["XCSG.name"] === "string" ? node.attributes["XCSG.name"] : node.id`, adds unnecessary cognitive load across multiple UI components. Centralizing this into a cleanly named, explicit helper method (`getNodeTitle`) drastically improves readability and clarity, allowing the architecture (the concept of a node's display title) to be visible over mechanical implementation details.
