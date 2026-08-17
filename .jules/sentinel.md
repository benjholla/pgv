## 2024-05-24 - Data URI XSS Bypass via Obfuscated Delimiters
**Vulnerability:** XSS via data URIs using obfuscated delimiters (`&comma;` and `&semi;`) to bypass regex checks.
**Learning:** Browsers decode HTML entities in data URIs before parsing the scheme. If structural entities like semicolons and commas are not explicitly decoded during sanitization, regex patterns relying on them (like `dangerousUrisRegex`) can be bypassed (e.g., `data:text/html&semi;base64&comma;...`).
**Prevention:** Always decode obfuscated structural entities (`&semi;`, `&comma;`) during XSS string sanitization prior to applying regex-based URI blocklists.

## 2024-05-24 - Inline Event Handler Obfuscation Bypass via HTML Entities
**Vulnerability:** XSS via inline event handler obfuscation using encoded equals signs (`&equals;`, `&#x3d;`, `&#61;`) to bypass regex checks.
**Learning:** Browsers unescape HTML entities in attribute values, meaning `onerror&equals;alert(1)` is functionally parsed as `onerror=alert(1)`. Since our inline event handler sanitization runs *before* our global HTML entity decoding loop in `sanitizeString`, the regex failed to match these encoded `=` signs and thus left the payload intact.
**Prevention:** Always ensure regex patterns targeting HTML structural symbols (like `=`) explicitly match common HTML entity encoded representations, and ensure foundational decode methods like `decodeHtmlEntities` are aware of them (e.g. adding `&equals;`).
