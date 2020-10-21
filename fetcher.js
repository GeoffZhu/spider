const puppeteer = require('puppeteer');
const axios = require('axios');
const utils = require('./utils');

const BROWSER_ARGS = [
  '--disable-gpu',
  '--disable-setuid-sandbox',
  '--no-sandbox',
  '--ignore-certificate-errors',
  '--window-size=1366,768',
  '--enable-automation',
];

let config = {
  headless: true,
  axiosTimeout: 5000,
};

class Fetcher {
  constructor(proxy) {
    this.proxy = proxy || {};
    this.state = {
      browser: null,
      page: null,
      axios: null,
      timeOut: null,
    };
  }

  async init() {
    let { proxy, state } = this;

    if (config.proxyTimeout) {
      state.timeOut = Date.now() + config.proxyTimeout;
    } else {
      state.timeOut = Infinity;
    }

    if (proxy.host && proxy.port) {
      state.axios = axios.create({ proxy, timeout: config.axiosTimeout });
      state.browser = await puppeteer.launch({
        args: [...BROWSER_ARGS, `--proxy-server=${proxy.host}:${proxy.port}`],
        headless: config.headless,
      });
      console.log(
        `LOG: Create new fetcher with proxy ${proxy.host}:${proxy.port}`
      );
    } else {
      state.axios = axios.create({ timeout: config.axiosTimeout });
      state.browser = await puppeteer.launch({
        args: BROWSER_ARGS,
        headless: config.headless,
      });
    }

    state.page = await state.browser.pages()[0];
    if (!state.page) state.page = await state.browser.newPage();

    await state.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    // await state.page.setRequestInterception(true);
  }
  async destroy() {
    if (this.state.browser) await this.state.browser.close();
    this.state = {};
  }

  get browser() {
    return this.state.browser;
  }
  get page() {
    return this.state.page;
  }
  get axios() {
    return this.state.axios;
  }
}

let fetcherInstance;
const resetFetcherInstance = async () => {
  if (fetcherInstance) await fetcherInstance.destroy();

  if (config.proxy) {
    if (typeof config.proxy === 'function') {
      let { host, port } = await config.proxy();
      fetcherInstance = new Fetcher({ host, port });
    } else if (typeof config.proxy === 'object') {
      let { host, port } = config.proxy;
      fetcherInstance = new Fetcher({ host, port });
    } else {
      console.warn('TypeError: config.proxy');
      fetcherInstance = new Fetcher();
    }
  } else {
    fetcherInstance = new Fetcher();
  }

  await fetcherInstance.init();

  return fetcherInstance;
};

const getFetcherInstance = async (forceReset = false) => {
  if (
    fetcherInstance &&
    Date.now() <= fetcherInstance.state.timeOut &&
    !forceReset
  ) {
    return fetcherInstance;
  } else {
    return await resetFetcherInstance();
  }
};

utils.cleanup(async () => {
  if (fetcherInstance) await fetcherInstance.destroy();
});

module.exports = {
  resetFetcherInstance,
  getFetcherInstance,
  setConfig(userConfig) {
    config = {
      ...config,
      ...userConfig,
    };
  },
};
