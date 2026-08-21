## 2024-05-24 - Data URI XSS Bypass via Obfuscated Delimiters
**Vulnerability:** XSS via data URIs using obfuscated delimiters (`&comma;` and `&semi;`) to bypass regex checks.
**Learning:** Browsers decode HTML entities in data URIs before parsing the scheme. If structural entities like semicolons and commas are not explicitly decoded during sanitization, regex patterns relying on them (like `dangerousUrisRegex`) can be bypassed (e.g., `data:text/html&semi;base64&comma;...`).
**Prevention:** Always decode obfuscated structural entities (`&semi;`, `&comma;`) during XSS string sanitization prior to applying regex-based URI blocklists.

## 2024-05-25 - XSS Bypass via Encoded Equals in Inline Event Handlers
**Vulnerability:** XSS via inline event handlers where the equals sign is obfuscated using HTML entities (e.g. `&equals;`, `&#x3d;`).
**Learning:** When sanitizing strings against XSS, stripping inline event handlers (`on*`) happens before HTML entity decoding. Regex blocklists must explicitly account for encoded variants of structural characters like the equals sign.
**Prevention:** Explicitly match encoded variants of the equals sign (like `&equals;`, `&#x3d;`, `&#61;`) in regex filters for inline event handlers and ensure `decodeHtmlEntities` decodes `&equals;`.

## 2024-05-26 - XSS Bypass via Zero-Padded Hexadecimal Encoded Equals
**Vulnerability:** XSS via inline event handlers where the equals sign is obfuscated using zero-padded hexadecimal HTML entities (e.g., `&#x03d;`, `&#x003d;`).
**Learning:** When sanitizing strings against XSS, stripping inline event handlers (`on*`) happens before HTML entity decoding. While the regex properly handled zero-padding for decimal entities (e.g., `&#0*61;`), it failed to account for zero-padding in hexadecimal entities (e.g., `&#x3d;`).
**Prevention:** Ensure regex filters explicitly match zero-padded variants of both decimal and hexadecimal encoded characters (like `&#x0*3d;?`) when neutralizing obfuscated structural characters prior to full decoding.
