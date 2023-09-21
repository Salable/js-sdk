export class BaseComponent {
  protected _createCssStyleSheetLink(link: string, id: string) {
    const head = document.getElementsByTagName('head')[0];
    const linkStylesheet = document.createElement('link');
    linkStylesheet.setAttribute('href', link);
    linkStylesheet.setAttribute('rel', 'stylesheet');
    if (id) linkStylesheet.id = id;
    head.appendChild(linkStylesheet);
  }

  protected _loadScript = (FILE_URL: string, id: string, type = 'text/javascript') => {
    return new Promise((resolve, reject) => {
      try {
        const bodyScript = document.createElement('script');

        bodyScript.type = type;
        bodyScript.async = true;
        bodyScript.id = id;
        bodyScript.src = FILE_URL;

        bodyScript.addEventListener('load', () => {
          resolve({ status: true });
        });

        bodyScript.addEventListener('error', () => {
          reject({
            status: false,
            message: `Failed to load the script ${id}`,
          });
        });

        document.body.appendChild(bodyScript);
      } catch (error) {
        reject(error);
      }
    });
  };
}
