## 2024-05-25 - Object Spread Inefficiencies in Hot Loops
**Learning:** Object spread syntax (`...`) inside of mapping functions or hot loops over large collections causes significant performance degradation and memory pressure due to repeated object allocations.
**Action:** Replace conditional spread syntax inside mapping loops with explicit, mutable object initialization and `if` conditional assignments before explicitly casting the return value to the readonly interface.
