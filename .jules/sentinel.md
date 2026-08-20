## 2024-05-24 - Data URI XSS Bypass via Obfuscated Delimiters
**Vulnerability:** XSS via data URIs using obfuscated delimiters (`&comma;` and `&semi;`) to bypass regex checks.
**Learning:** Browsers decode HTML entities in data URIs before parsing the scheme. If structural entities like semicolons and commas are not explicitly decoded during sanitization, regex patterns relying on them (like `dangerousUrisRegex`) can be bypassed (e.g., `data:text/html&semi;base64&comma;...`).
**Prevention:** Always decode obfuscated structural entities (`&semi;`, `&comma;`) during XSS string sanitization prior to applying regex-based URI blocklists.

## 2024-05-25 - XSS Bypass via Encoded Equals in Inline Event Handlers
**Vulnerability:** XSS via inline event handlers where the equals sign is obfuscated using HTML entities (e.g. `&equals;`, `&#x3d;`).
**Learning:** When sanitizing strings against XSS, stripping inline event handlers (`on*`) happens before HTML entity decoding. Regex blocklists must explicitly account for encoded variants of structural characters like the equals sign.
**Prevention:** Explicitly match encoded variants of the equals sign (like `&equals;`, `&#x3d;`, `&#61;`) in regex filters for inline event handlers and ensure `decodeHtmlEntities` decodes `&equals;`.
## 2025-02-20 - [Fix XSS bypass via zero-padded hex HTML entities]
**Vulnerability:** A custom XSS sanitization regex in `src/model.ts` designed to block inline event handlers (like `onerror`) was bypassable. The regex explicitly matched `&#x3d;` (the hex HTML entity for `=`) but failed to match zero-padded variants like `&#x03d;` or `&#x00003d;`, which are valid in HTML. An attacker could use `<img src=x onerror&#x03d;alert(1)>` to execute arbitrary JS.
**Learning:** Custom sanitizers using regex must account for the full flexibility of HTML entity encoding specifications, particularly leading zero-padding in hexadecimal and decimal encodings, which are often used in obfuscation bypasses.
**Prevention:** Always use `0*` when matching numbers in HTML entity decoding regexes (e.g., `&#x0*3d;`). Better yet, completely decode HTML entities *before* regex filtering instead of trying to catch encoded payloads in the regex itself, though in this specific context the regex stripping happened prior to entity decoding to handle control characters embedded in attribute names.
