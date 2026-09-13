## 2024-05-24 - Data URI XSS Bypass via Obfuscated Delimiters
**Vulnerability:** XSS via data URIs using obfuscated delimiters (`&comma;` and `&semi;`) to bypass regex checks.
**Learning:** Browsers decode HTML entities in data URIs before parsing the scheme. If structural entities like semicolons and commas are not explicitly decoded during sanitization, regex patterns relying on them (like `dangerousUrisRegex`) can be bypassed (e.g., `data:text/html&semi;base64&comma;...`).
**Prevention:** Always decode obfuscated structural entities (`&semi;`, `&comma;`) during XSS string sanitization prior to applying regex-based URI blocklists.

## 2024-05-25 - XSS Bypass via Encoded Equals in Inline Event Handlers
**Vulnerability:** XSS via inline event handlers where the equals sign is obfuscated using HTML entities (e.g. `&equals;`, `&#x3d;`).
**Learning:** When sanitizing strings against XSS, stripping inline event handlers (`on*`) happens before HTML entity decoding. Regex blocklists must explicitly account for encoded variants of structural characters like the equals sign.
**Prevention:** Explicitly match encoded variants of the equals sign (like `&equals;`, `&#x3d;`, `&#61;`) in regex filters for inline event handlers and ensure `decodeHtmlEntities` decodes `&equals;`.

## 2024-05-26 - XSS Bypass via Zero-Padded Encoded Equals
**Vulnerability:** XSS via inline event handlers where the equals sign is obfuscated using zero-padded hexadecimal HTML entities (e.g., `&#x0003d;`).
**Learning:** When sanitizing strings against XSS, stripping inline event handlers (`on*`) relies on regexes. If the regex does not account for zero-padded hex variations (`&#x0*3d;?`), attackers can bypass the filter and execute arbitrary code.
**Prevention:** Ensure regex filters matching hexadecimal encoded characters explicitly allow for leading zeros (e.g., using `0*` like in `&#x0*3d;?`).

## 2024-05-27 - XSS Bypass in CSS Expressions via Control Characters
**Vulnerability:** XSS via CSS expressions (e.g., `style="width: expression(alert(1))"`) where the `expression` keyword is obfuscated with injected control characters (e.g., `ex\x00pression(...)`).
**Learning:** The previous regex used the `\b` boundary anchor (`/\bexpression\b/`). When attackers inject control characters like null bytes (`\x00`) or tabs/newlines inside the word, it breaks the `\b` boundary matching, allowing the payload to bypass the sanitization filter.
**Prevention:** Avoid relying strictly on `\b` when sanitizing strings that may contain embedded control characters. Use an explicit character-by-character regex pattern with optional control character spaces (`[\s\x00-\x1F\x7F]*`) between each letter, and explicitly define boundaries (like `(^|[^a-z0-9])`).
