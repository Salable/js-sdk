import {ElementGenerator} from '../element-generator';

describe('Unit Test | Resource | Element Generator', () => {
  let elementGenerator: ElementGenerator;

  beforeAll(() => {
    elementGenerator = new ElementGenerator();
  });

  describe('Create Element with class', () => {
    test('Create Element with Class', () => {
      // Arrange
      const type = 'div';
      const className = 'my-class';

      // Act
      const result = elementGenerator._createElementWithClass(type, className);

      // Assert
      expect(result.tagName).toBe(type.toUpperCase());
      expect(result.className).toBe(className);
    });
  });

  describe('Create Tooltip', () => {
    test('it should create a tooltip element and attach it to the parent element', () => {
      // Arrange
      const el = document.createElement('button');
      const elParent = document.createElement('div');
      const tooltipText = 'Tooltip text';
      const id = 'tooltip1';

      // Act
      elementGenerator._createTooltip(el, elParent, tooltipText, id);

      // Assert
      expect(el.getAttribute('aria-describedby')).toBe(id);

      const tooltipElHolder = elParent.querySelector('.salable-tooltip-holder') as HTMLElement;
      expect(tooltipElHolder).not.toBeNull();

      const tooltipEl = tooltipElHolder.querySelector('.salable-tooltip') as HTMLElement;
      expect(tooltipEl).not.toBeNull();
      expect(tooltipEl.innerText).toBe(tooltipText);
      expect(tooltipEl.id).toBe(id);
      expect(tooltipEl.getAttribute('role')).toBe('tooltip');
    });

    test('it should show the tooltip element when mouse is over the element', () => {
      // Arrange
      const el = document.createElement('button');
      const elParent = document.createElement('div');
      const tooltipText = 'Tooltip text';
      const id = 'tooltip1';

      elementGenerator._createTooltip(el, elParent, tooltipText, id);

      const tooltipEl = elParent.querySelector('.salable-tooltip');

      // Act
      el.dispatchEvent(new MouseEvent('mouseover'));

      // Assert
      expect(tooltipEl?.classList.contains('salable-tooltip-visible')).toBe(true);
    });

    test('it should hide the tooltip element when mouse leaves the element', () => {
      // Arrange
      const el = document.createElement('button');
      const elParent = document.createElement('div');
      const tooltipText = 'Tooltip text';
      const id = 'tooltip1';

      elementGenerator._createTooltip(el, elParent, tooltipText, id);

      const tooltipEl = elParent.querySelector('.salable-tooltip');

      // Act
      el.dispatchEvent(new MouseEvent('mouseover'));
      el.dispatchEvent(new MouseEvent('mouseleave'));

      // Assert
      expect(tooltipEl?.classList.contains('salable-tooltip-visible')).toBe(false);
    });
  });

  describe('Create Css Stylesheet Link', () => {
    test('it should create a stylesheet link element and attach it to the head element', () => {
      // Arrange
      const link = 'https://example.com/styles.css';
      const id = 'styles';

      // Act
      elementGenerator._createCssStyleSheetLink(link, id);

      // Assert
      const head = document.getElementsByTagName('head')[0];
      const linkStylesheet = head.querySelector(`link[href="${link}"]`) as HTMLElement;

      expect(linkStylesheet).not.toBeNull();
      expect(linkStylesheet.getAttribute('rel')).toBe('stylesheet');
      expect(linkStylesheet.id).toBe(id);
    });
  });

  describe('Create Inline Script', () => {
    let sibling: Element;

    beforeEach(() => {
      sibling = document.createElement('div');
    });

    test('it should create an inline script element and insert it as a sibling', () => {
      // Arrange
      const script = 'console.log("Hello, world!")';
      const id = 'my-script';

      // Act
      elementGenerator._createInlineScript(script, sibling, id);

      // Assert
      const scriptEl = sibling.querySelector(`script#${id}`) as HTMLElement;
      expect(scriptEl).not.toBeNull();
      expect(scriptEl.textContent).toBe(script);
    });
  });

  describe('Create Lottie Animation', () => {
    test('it should return a string with valid bodymovin.loadAnimation options', () => {
      // Arrange
      const element = 'my-animation';
      const lottieFilePath = '/path/to/my-animation.json';

      // Act
      const result = elementGenerator._createLottieAnimation(element, lottieFilePath);

      // Assert
      const expected = `
      bodymovin.loadAnimation({
        container: ${element}, 
        path: '${lottieFilePath}', 
        renderer: 'svg', 
        loop: true, 
        autoplay: true, 
      });
    `;
      expect(result).toBe(expected);
    });
  });
});
