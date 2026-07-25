const fs = require('fs');

let content = fs.readFileSync('src/renderer.ts', 'utf8');

// 1. clearBtn
content = content.replace(
    /clearBtn\.innerHTML = `<svg[^>]*>[\s\S]*?<\/svg>`;/,
    `clearBtn.appendChild(
      createSvgElement("svg", {
        "viewBox": "0 0 24 24",
        "width": "16",
        "height": "16",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }, [
        createSvgElement("circle", { "cx": "12", "cy": "12", "r": "10" }),
        createSvgElement("line", { "x1": "15", "y1": "9", "x2": "9", "y2": "15" }),
        createSvgElement("line", { "x1": "9", "y1": "9", "x2": "15", "y2": "15" })
      ])
    );`
);

// 2. dropdownBtn search
content = content.replace(
    /dropdownBtn\.innerHTML = `[\s\S]*?<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2\.5" stroke-linecap="round" stroke-linejoin="round">[\s\S]*?<path d="\$\{icons\.chevronDown\}"><\/path>[\s\S]*?<\/svg>[\s\S]*?`;/,
    `dropdownBtn.appendChild(
      createSvgElement("svg", {
        "aria-hidden": "true",
        "viewBox": "0 0 24 24",
        "width": "14",
        "height": "14",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-width": "2.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }, [
        createSvgElement("path", { "d": icons.chevronDown })
      ])
    );`
);

// 3. searchBtn
content = content.replace(
    /searchBtn\.innerHTML = `[\s\S]*?<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2\.5" stroke-linecap="round" stroke-linejoin="round">[\s\S]*?<circle cx="11" cy="11" r="8"><\/circle>[\s\S]*?<line x1="21" y1="21" x2="16\.65" y2="16\.65"><\/line>[\s\S]*?<\/svg>[\s\S]*?`;/,
    `searchBtn.appendChild(
      createSvgElement("svg", {
        "aria-hidden": "true",
        "viewBox": "0 0 24 24",
        "width": "16",
        "height": "16",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-width": "2.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }, [
        createSvgElement("circle", { "cx": "11", "cy": "11", "r": "8" }),
        createSvgElement("line", { "x1": "21", "y1": "21", "x2": "16.65", "y2": "16.65" })
      ])
    );`
);

// 4. cycleBtn
content = content.replace(
    /cycleBtn\.innerHTML = `[\s\S]*?<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2\.5" stroke-linecap="round" stroke-linejoin="round">[\s\S]*?<path d="M3 12a9 9 0 1 0 9-9 9\.75 9\.75 0 0 0-6\.74 2\.74L3 8"><\/path>[\s\S]*?<path d="M3 3v5h5"><\/path>[\s\S]*?<\/svg>[\s\S]*?`;/,
    `cycleBtn.appendChild(
      createSvgElement("svg", {
        "aria-hidden": "true",
        "viewBox": "0 0 24 24",
        "width": "16",
        "height": "16",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-width": "2.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }, [
        createSvgElement("path", { "d": "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }),
        createSvgElement("path", { "d": "M3 3v5h5" })
      ])
    );`
);

// 5. closeBtn
content = content.replace(
    /closeBtn\.innerHTML = `[\s\S]*?<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2\.5" stroke-linecap="round" stroke-linejoin="round">[\s\S]*?<line x1="18" y1="6" x2="6" y2="18"><\/line>[\s\S]*?<line x1="6" y1="6" x2="18" y2="18"><\/line>[\s\S]*?<\/svg>[\s\S]*?`;/,
    `closeBtn.appendChild(
      createSvgElement("svg", {
        "aria-hidden": "true",
        "viewBox": "0 0 24 24",
        "width": "16",
        "height": "16",
        "fill": "none",
        "stroke": "currentColor",
        "stroke-width": "2.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }, [
        createSvgElement("line", { "x1": "18", "y1": "6", "x2": "6", "y2": "18" }),
        createSvgElement("line", { "x1": "6", "y1": "6", "x2": "18", "y2": "18" })
      ])
    );`
);

// 6. downloadBtn inside downloadGraph group
content = content.replace(
    /downloadBtn\.innerHTML = `[\s\S]*?<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2\.5" stroke-linecap="round" stroke-linejoin="round">[\s\S]*?<path d="\$\{icons\.download\}"><\/path>[\s\S]*?<\/svg>[\s\S]*?<span>\$\{formatLabels\[this\.#downloadFormat\]\}<\/span>[\s\S]*?`;/,
    `downloadBtn.appendChild(
        createSvgElement("svg", {
          "aria-hidden": "true",
          "viewBox": "0 0 24 24",
          "width": "16",
          "height": "16",
          "fill": "none",
          "stroke": "currentColor",
          "stroke-width": "2.5",
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        }, [
          createSvgElement("path", { "d": icons.download })
        ])
      );
      const span = document.createElement("span");
      span.textContent = formatLabels[this.#downloadFormat];
      downloadBtn.appendChild(span);`
);

// 7. dropdownBtn inside downloadGraph group
content = content.replace(
    /dropdownBtn\.innerHTML = `[\s\S]*?<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2\.5" stroke-linecap="round" stroke-linejoin="round">[\s\S]*?<path d="\$\{icons\.chevronDown\}"><\/path>[\s\S]*?<\/svg>[\s\S]*?`;/,
    `dropdownBtn.appendChild(
        createSvgElement("svg", {
          "aria-hidden": "true",
          "viewBox": "0 0 24 24",
          "width": "14",
          "height": "14",
          "fill": "none",
          "stroke": "currentColor",
          "stroke-width": "2.5",
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        }, [
          createSvgElement("path", { "d": icons.chevronDown })
        ])
      );`
);

// 8. originalBtnHtml tracking -> originalBtnChildren
content = content.replace(/let originalBtnHtml = "";/, `let originalBtnChildren: Element[] = [];`);
content = content.replace(/originalBtnHtml = downloadBtn\.innerHTML;/, `originalBtnChildren = Array.from(downloadBtn.children);`);

// 9. Spinner replacement
content = content.replace(
    /downloadBtn\.innerHTML = `[\s\S]*?<svg class="pgv-spinner" aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2\.5" stroke-linecap="round" stroke-linejoin="round">[\s\S]*?<line x1="12" y1="2" x2="12" y2="6"><\/line>[\s\S]*?<line x1="12" y1="18" x2="12" y2="22"><\/line>[\s\S]*?<line x1="4\.93" y1="4\.93" x2="7\.76" y2="7\.76"><\/line>[\s\S]*?<line x1="16\.24" y1="16\.24" x2="19\.07" y2="19\.07"><\/line>[\s\S]*?<line x1="2" y1="12" x2="6" y2="12"><\/line>[\s\S]*?<line x1="18" y1="12" x2="22" y2="12"><\/line>[\s\S]*?<line x1="4\.93" y1="19\.07" x2="7\.76" y2="16\.24"><\/line>[\s\S]*?<line x1="16\.24" y1="7\.76" x2="19\.07" y2="4\.93"><\/line>[\s\S]*?<\/svg>[\s\S]*?<span>\$\{formatLabels\[this\.#downloadFormat\]\}<\/span>[\s\S]*?`;/,
    `downloadBtn.replaceChildren(
        createSvgElement("svg", {
          "class": "pgv-spinner",
          "aria-hidden": "true",
          "viewBox": "0 0 24 24",
          "width": "16",
          "height": "16",
          "fill": "none",
          "stroke": "currentColor",
          "stroke-width": "2.5",
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        }, [
          createSvgElement("line", { "x1": "12", "y1": "2", "x2": "12", "y2": "6" }),
          createSvgElement("line", { "x1": "12", "y1": "18", "x2": "12", "y2": "22" }),
          createSvgElement("line", { "x1": "4.93", "y1": "4.93", "x2": "7.76", "y2": "7.76" }),
          createSvgElement("line", { "x1": "16.24", "y1": "16.24", "x2": "19.07", "y2": "19.07" }),
          createSvgElement("line", { "x1": "2", "y1": "12", "x2": "6", "y2": "12" }),
          createSvgElement("line", { "x1": "18", "y1": "12", "x2": "22", "y2": "12" }),
          createSvgElement("line", { "x1": "4.93", "y1": "19.07", "x2": "7.76", "y2": "16.24" }),
          createSvgElement("line", { "x1": "16.24", "y1": "7.76", "x2": "19.07", "y2": "4.93" })
        ])
      );
      const spinnerSpan = document.createElement("span");
      spinnerSpan.textContent = formatLabels[this.#downloadFormat];
      downloadBtn.appendChild(spinnerSpan);`
);

// 10. Restore children
content = content.replace(/downloadBtn\.innerHTML = originalBtnHtml;/, `downloadBtn.replaceChildren(...originalBtnChildren);`);

fs.writeFileSync('src/renderer.ts', content);
