## 2024-03-24 - Prototype Pollution in freezeAttributes
**Vulnerability:** A local prototype pollution vulnerability existed in `src/model.ts` inside the `freezeAttributes` function. When processing user-supplied JSON payloads, the function initialized a `sanitizedAttributes` map using `const sanitizedAttributes = {};`.
**Learning:** If an attacker supplied a JSON object with a `__proto__` key, iterating over the properties and copying them into the object literal `{}` caused JavaScript to invoke the prototype setter. This polluted the newly created `sanitizedAttributes` object, potentially breaking invariants or leaking into further processing steps depending on how the sanitized object was later used. While this didn't pollute the global `Object.prototype`, it broke the strict prototype chain of the sanitized attribute store.
**Prevention:** Always initialize dictionaries intended to hold user-controlled keys using `Object.create(null)` instead of `{}`. This ensures the object has no prototype chain and prevents the `__proto__` setter from being invoked during property assignment.

## 2024-03-24 - XSS Filter Bypass via DEL Control Character
**Vulnerability:** An XSS filter bypass existed in `src/model.ts` inside the `sanitizeString` function. The function attempted to strip whitespace and control characters from the string using the regex `/[\s\x00-\x1F]+/g` before checking for forbidden keywords like `javascript:`.
**Learning:** The regex failed to account for the `DEL` control character (`\x7F`). Attackers could inject the `DEL` character into keywords (e.g., `java\x7Fscript:`), which would not be stripped by the regex, successfully splitting the keyword to evade detection but still potentially being interpreted as executable in some browser contexts.
**Prevention:** When stripping control characters to prevent evasion of keyword checks, ensure the full range of ASCII control characters is covered, including `DEL` (`\x7F`), which falls outside the `\x00-\x1F` range. The regex should be `/[\s\x00-\x1F\x7F]+/g`.

## 2024-03-24 - Mutation XSS bypass via unclosed script tags
**Vulnerability:** A mutation XSS bypass existed in `src/model.ts` inside the `sanitizeString` function. The function attempted to strip `<script>` tags using the regex `/<\/?script\b[^>]*>/gi`.
**Learning:** The regex failed to account for unclosed `<script>` tags (e.g., `<script src="malicious"` without a closing `>`). If an unclosed `<script>` tag was injected into a context where a subsequent `>` character could close it, the browser would execute the script. The regex `[^>]*>` required a closing `>` to match and strip the tag.
**Prevention:** When stripping potentially dangerous tags, ensure the regex accounts for unclosed tags by making the closing `>` optional. The regex should be `/<\/?script\b[^>]*>?/gi`.

## 2024-03-24 - XSS via dangerous data URIs
**Vulnerability:** An XSS vulnerability existed in `src/model.ts` inside the `sanitizeString` function because the function only blocked `javascript:`, `vbscript:`, and `data:text/html` URIs, failing to block other dangerous `data:` URIs like `data:image/svg+xml`, `data:text/xml`, and `data:application/xhtml+xml` that can also execute scripts when rendered in a browser context.
**Learning:** Browsers can execute embedded `<script>` tags when navigating to or rendering `data:` URIs of certain XML/SVG types. A deny-list approach for URIs must be comprehensive or replaced with an allow-list approach (e.g., only allowing `http://`, `https://`, `mailto:`, etc.).
**Prevention:** Always block `data:image/svg+xml`, `data:text/xml`, and `data:application/xhtml+xml` in addition to `data:text/html` when filtering URIs, or strictly enforce an allow-list of safe protocols.

## 2024-03-24 - Inline Event Handler Bypass via Control Characters
**Vulnerability:** An XSS filter bypass existed in `src/model.ts` inside the `sanitizeString` function. The regex used to strip inline event handlers (`/\bon[a-z]+\s*=/gi`) only accounted for standard whitespace between the handler name (e.g., `onerror`) and the equals sign.
**Learning:** Attackers can bypass keyword-based XSS filters by inserting control characters (like the null byte `\x00` or DEL `\x7F`) between the event handler name and the equals sign (e.g., `onerror\x00=alert(1)`). Some HTML parsers will ignore these control characters and still treat the attribute as a valid event handler.
**Prevention:** When using regular expressions to strip potentially dangerous HTML attributes or event handlers, ensure the pattern accounts for control characters in addition to whitespace. For inline event handlers, use a pattern like `/\bon[a-z]+[\s\x00-\x1F\x7F]*=/gi`.

## $(date +%Y-%m-%d) - Missing input length limits on search queries
**Vulnerability:** A missing input length limit existed on the internal search inputs (`keyInput` and `valueInput`) in `src/renderer.ts`.
**Learning:** Without explicit bounds on input size, users or malicious integrations could paste exceptionally long strings into the search fields. Given that the search functionality supports Regular Expressions, this could lead to a Regular Expression Denial of Service (ReDoS) or cause severe UI lag and freezing from evaluating long regex patterns against all nodes and edges.
**Prevention:** As a defense-in-depth measure, always apply reasonable `maxLength` attributes to unbounded text inputs that will be evaluated against potentially expensive operations like regex matching.

## 2026-07-14 - XSS Filter Bypass via Zero-Width Characters
**Vulnerability:** An XSS filter bypass existed in `src/model.ts` inside the `sanitizeString` function. The regex `/[\\s\\x00-\\x1F\\x7F]+/g` used to strip whitespace and control characters before checking for forbidden URIs (like `javascript:`) did not account for zero-width characters and directional formatting marks (e.g., ZWSP `\u200B`, LRM `\u200E`).
**Learning:** Attackers could inject these invisible formatting characters into the middle of a URI protocol (e.g., `java&#x200B;script:`), which the stripping regex would ignore. The keyword check `.includes("javascript:")` would fail to match, but when rendered into the DOM, the browser would ignore the zero-width characters and successfully execute the `javascript:` URI payload.
**Prevention:** When stripping formatting or invisible characters to prevent URI blocklist evasion, ensure the regex comprehensively covers zero-width characters and directional formatting marks (e.g., `\u200B-\u200F` and `\u202A-\u202E`) in addition to standard ASCII control characters.
## 2025-02-27 - Fix ReDoS and Infinite Loop DoS in String Sanitization
**Vulnerability:** Regular Expression Denial of Service (ReDoS) and Infinite Loop DoS during XSS sanitization.
**Learning:** Bounding iteration limits inside a `while` loop that cleans input to prevent DoS without throwing an error silently introduces XSS bypass vulnerabilities by returning a partially sanitized, dangerous string once the limit hits. Also, unanchored regexes like `\bon...` followed by optional non-word characters can cause ReDoS if not explicitly bounded by `\b`.
**Prevention:** In iterative sanitization loops, always throw an error to fail securely (e.g., `throw new Error("String is too complex to sanitize safely")`) if the complexity exceeds safe thresholds. Add explicit word boundaries `\b` to lock down regex matches to prevent unexpected backtracking.

## 2024-05-18 - [Strengthen XSS sanitization in sanitizeString]
**Vulnerability:** The `sanitizeString` function previously only stripped `<script>` tags, making it vulnerable to XSS and unintended execution via other elements like `<iframe>`, `<object>`, `<embed>`, `<style>`, etc.
**Learning:** HTML sanitization based solely on regular expressions can be easily bypassed if the capture groups are not comprehensive enough to catch all the dangerous tags.
**Prevention:** Extend regex coverage to block a wider range of dangerous HTML tags. For stronger guarantees, consider a dedicated DOM-based sanitization library in the future.
