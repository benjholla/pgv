## 2024-05-18 - [Add Keyboard Shortcut for Search]
**Learning:** Adding a keyboard shortcut like '/' for global search significantly speeds up navigation, but it's crucial to skip the listener when the active element is an input to avoid interfering with normal text entry. Tooltips are a good place to discover these shortcuts.
**Action:** Always check `event.target` tag names (like INPUT or TEXTAREA) before intercepting global keyboard shortcuts. Update tooltips to implicitly teach users shortcuts.
