## 2024-05-24 - Data URI XSS Bypass via Obfuscated Delimiters
**Vulnerability:** XSS via data URIs using obfuscated delimiters (`&comma;` and `&semi;`) to bypass regex checks.
**Learning:** Browsers decode HTML entities in data URIs before parsing the scheme. If structural entities like semicolons and commas are not explicitly decoded during sanitization, regex patterns relying on them (like `dangerousUrisRegex`) can be bypassed (e.g., `data:text/html&semi;base64&comma;...`).
**Prevention:** Always decode obfuscated structural entities (`&semi;`, `&comma;`) during XSS string sanitization prior to applying regex-based URI blocklists.
## 2024-05-24 - HTML Entity Encoding Bypass for XSS Prevention
**Vulnerability:** XSS filter bypass using HTML entities for the equals sign (`&equals;`, `&#x3d;`, `&#61;`) inside inline event handlers (e.g., `onerror&equals;alert(1)`).
**Learning:** Browsers decode HTML entities in attribute values before interpreting the attribute's content, allowing attackers to obfuscate structural characters like `=` to bypass simple regex-based sanitization filters (like `on*` matching).
**Prevention:** When writing regex-based sanitization for inline event handlers, ensure the regex accounts for both the literal character and its encoded variants, and ensure centralized entity decoding functions (like `decodeHtmlEntities`) explicitly handle structural characters like `&equals;`.
