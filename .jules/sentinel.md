## 2024-05-18 - [Fix reverse tabnabbing bypass in sanitizeString]
**Vulnerability:** External links (`<a target="_blank">`) could bypass the `rel="noopener noreferrer"` protection in `sanitizeString`.
**Learning:** The previous regex implementation was vulnerable to early termination due to unescaped characters, duplicate attributes, and unexpected whitespace or custom targets. Attempting to parse HTML securely with regex is prone to error and edge cases (e.g. self-closing tags and unquoted attributes).
**Prevention:** Rather than parsing individual attributes with regex iteratively, the fix modifies the anchor string as a whole using simple replacement. This guarantees `rel="noopener noreferrer"` is appended securely or overwrites existing `rel` attributes, ensuring safety without relying on strict tokenization.

## 2026-08-01 - [Fix reverse tabnabbing bypass via unspaced attributes in sanitizeString]
**Vulnerability:** External links using unspaced attributes (e.g. `<a/href="evil.com" target="_blank">`) could bypass the `rel="noopener noreferrer"` protection because the regex `/<a\s+/` strictly required a whitespace character after the opening tag.
**Learning:** Browsers are extremely lenient and will parse tags even when whitespace is omitted and replaced by slashes or other delimiters. Regexes meant to enforce security policies must account for these non-standard boundary delimiters (like `[\s/]`).
**Prevention:** Updated the regex logic in `sanitizeString` to accept either spaces or slashes (`/[\s/]/) after `<a`, and updated the internal attribute tokenization regex to accurately capture attribute names bounded by `=` or `/`.

## 2025-10-24 - [Fix XSS Bypass with Backticks]
**Vulnerability:** A cross-site scripting (XSS) vulnerability existed in `sanitizeString` where malicious URIs (e.g., `javascript:`) could bypass the blocklist when enclosed in backticks (`` ` ``) as HTML attribute wrappers.
**Learning:** The previous implementation used the regex `/(?:^|["'=]|\burl\()\s*.../i` to identify dangerous URI schemes. This failed to account for modern browsers allowing backticks as valid attribute delimiters. When an attacker provided an input like `<a href=\`javascript:alert(1)\`>`, the regex did not match, allowing the payload to execute. This highlights the importance of keeping regex-based security filters updated with all possible HTML attribute delimiter variations.
**Prevention:** Always include the backtick (`` ` ``) character in the delimiter character class `["'`=]` when checking for dangerous URIs in HTML string sanitizers to ensure all potential attribute wrapping contexts are covered.

## 2025-02-27 - [Block Additional Dangerous Tags in sanitizeString]
**Vulnerability:** While `sanitizeString` correctly blocked `<script>` and several other functional tags, it missed older or more obscure tags that could still execute code, invoke network requests, or bypass DOM structures, such as `<applet>`, `<foreignObject>` (SVG), `<template>`, `<frame>`, and `<audio>` / `<video>`.
**Learning:** Modern web applications, especially those supporting SVG rendering inside their components, must enforce blocklists that account for a wider spectrum of tags than just HTML5 interactive tags. SVG tags like `foreignObject` can re-introduce HTML contexts unexpectedly.
**Prevention:** Expanded the iterative regex tag stripper `|<\/?(...)\b[^>]*>?/gi` to comprehensively include `<applet>`, `<frame>`, `<frameset>`, `<bgsound>`, `<template>`, `<foreignObject>`, `<animateTransform>`, `<animateMotion>`, `<discard>`, `<audio>`, `<video>`, `<source>`, and `<track>`.

## 2025-10-25 - [Fix inline event handler XSS bypass via control characters in sanitizeString]
**Vulnerability:** Inline event handlers like `onerror` could evade the `sanitizeString` stripping mechanism if an attacker embedded control characters (like null bytes, tabs, or newlines) directly inside the attribute name (e.g., `o\x00nerror=`). The previous regular expression relied on `\b` (word boundary), which failed to match when control characters broke the word continuum.
**Learning:** Browsers are exceptionally resilient and may simply drop or ignore invalid control characters inside HTML attribute names, successfully executing the reconstructed event handler. Relying on `\b` for security-critical regex matching is dangerous when dealing with unconstrained user input that may contain obfuscating control characters.
**Prevention:** Replaced `\b` with an explicit character exclusion class `(^|[^a-z0-9])` and explicitly permitted interspersed control characters `[\s\x00-\x1F\x7F]*` within the event handler prefix (e.g., between 'o' and 'n') to ensure it catches obfuscated attributes safely without suffering from ReDoS.

## 2024-05-20 - [Fix XSS Bypass with nested entities in decodeHtmlEntities]
**Vulnerability:** A cross-site scripting (XSS) vulnerability existed where payloads encoded with entities like `&amp;colon;` or entities often used in URL bypassing like `&sol;` could bypass the sanitizer since `decodeHtmlEntities` did not decode them, allowing them to eventually be rendered as executable URIs.
**Learning:** `decodeHtmlEntities` only decoded `&colon;`, `&tab;`, `&newline;`, and numeric HTML entities. However, by double encoding entities (e.g. `&amp;colon;`), an attacker could smuggle the payload through the first decoding pass, or bypass regexes completely by using alternative delimiters like `&sol;` for `/`, or `&lpar;` for `(`.
**Prevention:** Always ensure the entity decoder converts all potentially dangerous syntax characters (`&`, `/`, `\`, `(`, `)`) and explicitly handles nested encoding tricks (like decoding `&amp;` before other entities) so the subsequent sanitization steps can effectively identify and block the normalized payloads.

## 2024-05-21 - [Fix XSS Bypass with HTML Entity Quotes]
**Vulnerability:** A cross-site scripting (XSS) vulnerability existed where payloads using `&quot;` and `&apos;` for quote delimiters (e.g. `<a href=&quot;javascript:alert(1)&quot;>`) could bypass the dangerous URI regex.
**Learning:** `decodeHtmlEntities` did not decode standard XML/HTML entities like `&quot;`, `&apos;`, `&lt;`, and `&gt;`. The subsequent `dangerousUrisRegex` looks for dangerous URIs starting with literal quotes `["'=]`. By supplying HTML entities for quotes, the attacker avoids the regex's delimiter check, allowing the payload to execute.
**Prevention:** Always ensure standard HTML entities for structural components like quotes and brackets (`&quot;`, `&apos;`, `&lt;`, `&gt;`) are fully decoded in the string sanitization pipeline so that regex checks designed for plaintext correctly match the malicious content.

## 2024-05-22 - [Fix XSS Bypass with data URI encoded delimiters]
**Vulnerability:** A cross-site scripting (XSS) vulnerability existed where payloads using `&comma;` and `&semi;` for structural delimiters (e.g. `<a href="data:text/html&semi;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">`) could bypass the dangerous URI regex or string checks.
**Learning:** `decodeHtmlEntities` did not decode standard XML/HTML entities like `&comma;` and `&semi;`. `data:` URIs are specifically vulnerable to this because they use commas and semicolons to separate the mime type, encoding scheme, and payload. If these are obfuscated with entities, the browser decodes them later during DOM insertion, successfully executing the payload, while the early sanitizer string matching fails to see the literal delimiters.
**Prevention:** Always ensure standard HTML entities for structural components like commas and semicolons (`&comma;`, `&semi;`) are fully decoded in the string sanitization pipeline so that regex and substring checks correctly identify dangerous data URIs.
