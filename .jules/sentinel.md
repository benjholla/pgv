## 2024-05-18 - [Fix reverse tabnabbing bypass in sanitizeString]
**Vulnerability:** External links (`<a target="_blank">`) could bypass the `rel="noopener noreferrer"` protection in `sanitizeString`.
**Learning:** The previous regex implementation was vulnerable to early termination due to unescaped characters, duplicate attributes, and unexpected whitespace or custom targets. Attempting to parse HTML securely with regex is prone to error and edge cases (e.g. self-closing tags and unquoted attributes).
**Prevention:** Rather than parsing individual attributes with regex iteratively, the fix modifies the anchor string as a whole using simple replacement. This guarantees `rel="noopener noreferrer"` is appended securely or overwrites existing `rel` attributes, ensuring safety without relying on strict tokenization.

## 2026-08-01 - [Fix reverse tabnabbing bypass via unspaced attributes in sanitizeString]
**Vulnerability:** External links using unspaced attributes (e.g. `<a/href="evil.com" target="_blank">`) could bypass the `rel="noopener noreferrer"` protection because the regex `/<a\s+/` strictly required a whitespace character after the opening tag.
**Learning:** Browsers are extremely lenient and will parse tags even when whitespace is omitted and replaced by slashes or other delimiters. Regexes meant to enforce security policies must account for these non-standard boundary delimiters (like `[\s/]`).
**Prevention:** Updated the regex logic in `sanitizeString` to accept either spaces or slashes (`/[\s/]/) after `<a`, and updated the internal attribute tokenization regex to accurately capture attribute names bounded by `=` or `/`.
