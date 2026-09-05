import re

with open("src/layout.ts", "r") as f:
    content = f.read()

content = content.replace("c: Node | null", "c: AStarNode | null")

# Let's fix the `parent: Node | null` in push if there is one left
content = content.replace("parent: Node | null", "parent: AStarNode | null")

with open("src/layout.ts", "w") as f:
    f.write(content)
