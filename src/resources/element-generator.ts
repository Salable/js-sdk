export class ElementGenerator {
  _createElementWithClass(type: string, className: string) {
    const el = document.createElement(type);
    el.className = className;
    return el;
  }

  _createTooltip(el: HTMLElement, elParent: Element, tooltipText: string, id: string) {
    const toolTipElHolder = this._createElementWithClass('div', 'salable-tooltip-holder');
    const toolTipEl = this._createElementWithClass('span', 'salable-tooltip');
    toolTipEl.innerText = tooltipText;
    toolTipEl.id = id;
    toolTipEl.setAttribute('role', 'tooltip');
    toolTipElHolder.appendChild(toolTipEl);
    el.setAttribute('aria-describedby', id);
    toolTipElHolder.appendChild(el);
    elParent.appendChild(toolTipElHolder);

    el.addEventListener('mouseover', () => toolTipEl.classList.add('salable-tooltip-visible'));
    el.addEventListener('mouseleave', () => toolTipEl.classList.remove('salable-tooltip-visible'));
  }

  _createCssStyleSheetLink(link: string, id: string) {
    const head = document.getElementsByTagName('head')[0];
    const linkStylesheet = document.createElement('link');
    linkStylesheet.setAttribute('href', link);
    linkStylesheet.setAttribute('rel', 'stylesheet');
    if (id) linkStylesheet.id = id;
    head.appendChild(linkStylesheet);
  }

  _createInlineScript(script: string, sibling: Element, id: string) {
    const inlineScript = document.createElement('script');
    inlineScript.textContent = script;
    if (id) inlineScript.id = id;
    sibling.insertBefore(inlineScript, null);
  }

  _createLottieAnimation(element: string, lottieFilePath: string) {
    return `
      bodymovin.loadAnimation({
        container: ${element}, 
        path: '${lottieFilePath}', 
        renderer: 'svg', 
        loop: true, 
        autoplay: true, 
      });
    `;
  }
}
