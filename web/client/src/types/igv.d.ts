declare module 'igv' {
  namespace browser {
    function createBrowser(container: HTMLElement, options: any): Promise<any>;
  }
  export default {
    browser
  };
}