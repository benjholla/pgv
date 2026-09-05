import re

with open("src/layout.ts", "r") as f:
    content = f.read()

content = content.replace("const openList: Node[] = [];", "const openList = new MinHeap();")

old_loop = """    // PERF(Bolt): O(N) linear scan + swap-pop is faster than O(N log N) sorting
    let minIdx = 0;
    let minF = openList[0].f;
    for (let i = 1; i < openList.length; i++) {
      if (openList[i].f < minF) {
        minF = openList[i].f;
        minIdx = i;
      }
    }
    const lastIdx = openList.length - 1;
    const curr = openList[minIdx];
    openList[minIdx] = openList[lastIdx];
    openList.pop();"""

new_loop = """    const curr = openList.pop();
    if (!curr) break;"""

content = content.replace(old_loop, new_loop)

content = content.replace("let c: Node | null = curr;", "let c: AStarNode | null = curr;")

with open("src/layout.ts", "w") as f:
    f.write(content)
