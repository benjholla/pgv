function buildSvgFromHtml(htmlStr) {
    const template = document.createElement('template');
    template.innerHTML = htmlStr;
    const svgNode = template.content.firstElementChild;
    // Walk tree to change to SVG namespace? No, innerHTML inside template doesn't use SVG namespace unless it has <svg> but DOMParser might be better.
}
