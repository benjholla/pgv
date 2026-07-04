## 2025-02-18 - XSS Filter Evasion via Entities and Whitespace
**Vulnerability:** The `sanitizeString` function in `src/model.ts` was vulnerable to XSS bypasses. An attacker could encode restricted URIs (like `javascript:`) using HTML entities (e.g., `&#x6A;avascript:`) or inject whitespace/control characters (e.g., `jav\tascript:`) to evade the simple substring match check.
**Learning:** Custom XSS sanitization that relies purely on string inclusion checks is fragile. Browsers are highly permissive when parsing URIs in attributes, ignoring whitespace and automatically decoding entities.
**Prevention:** To safely block dangerous URIs, strings must be explicitly normalized *before* checking for blocked schemes. This includes decoding HTML entities (`&#dec;`, `&#xhex;`) and aggressively stripping all whitespace and control characters (`[\s\x00-\x1F]`).

## 2024-05-28 - [XSS Filter Evasion via URL Encoding and Nested Tags]
**Vulnerability:** The internal `sanitizeString` function in `src/model.ts` was vulnerable to XSS filter evasion using URL encoded payloads (e.g., `j%61vascript:alert(1)`) and nested `<script>` tags (e.g., `<scr<script>ipt>alert(1)</script>`).
**Learning:** Security controls that rely on simple string replacement and keyword blocklists can be bypassed if the input is not fully normalized first (e.g., handling URL encoding), or if the removal of forbidden patterns creates new forbidden patterns recursively (nested tags).
**Prevention:** Always fully decode inputs (URL decoding, HTML entity decoding) before applying security checks. Use iterative or state-machine based removal to prevent nested pattern bypasses.
## 2025-02-18 - [Fix] Iterative XSS payload sanitization
**Vulnerability:** Double URL encoding (`j%2561vascript:`) bypasses the `sanitizeString` XSS check.
**Learning:** Browsers process URL decoding multiple times during parsing. Sequential URL/HTML entity decoding without iterative verification allows attackers to stack encoding methods to circumvent basic filters.
**Prevention:** Sanitization mechanisms that decode payloads must utilize a `do...while` loop to iteratively decode inputs until the string stabilizes, ensuring no hidden encoded sequences remain before applying security checks.

## 2025-02-18 - XSS Filter Evasion via Named HTML Entities
**Vulnerability:** The internal `sanitizeString` function decoded numeric HTML entities (`&#x3A;`) but failed to decode named HTML entities (like `&colon;`, `&tab;`, `&newline;`). This allowed attackers to use payloads like `javascript&colon;alert(1)` to bypass the URI scheme blocklist. When inserted into the DOM (e.g., an `href` attribute), browsers automatically decode these named entities, resulting in script execution.
**Learning:** Browsers implicitly decode named HTML entities inside attribute values during DOM rendering. Custom sanitization that inspects URIs for dangerous schemes must account for both numeric and named entity obfuscation.
**Prevention:** To effectively prevent XSS filter evasion, `decodeHtmlEntities` must explicitly target and replace critical named entities (such as `&colon;`, `&tab;`, `&newline;` case-insensitively) in addition to numeric encoding *before* validation checks are applied.
## 2026-07-04 - [Reverted] XSS Filter Bypass via HTML Entity Obfuscation
**Vulnerability:** Initially thought `sanitizeString` allowed XSS bypasses if `<script>` or `on*` payloads were HTML entity encoded because stripping was applied to the undecoded string.
**Learning:** Browsers do not decode HTML entities within tag names or attribute names. An encoded `&#x3C;script&#x3E;` renders as literal text and is secure. Changing the sanitizer to return fully decoded text un-escapes safe inputs and introduces severe HTML injection vulnerabilities (Mutation XSS).
**Prevention:** Always sanitize the raw input string against specific dangerous tags. Do not return decoded strings from sanitization routines unless explicitly necessary, as it can transform safe encoded text into executable payloads.
