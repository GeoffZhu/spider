const fetcher = require('./fetcher');

let config = {
  retryTimes: 1,
};

const get = async (processer, ...args) => {
  let fetcherInstance = await fetcher.getFetcherInstance();

  if (!fetcherInstance) {
    throw new Error('no fetcher');
  }

  let resp, errMessage;
  for (let i = 0; i < config.retryTimes; i++) {
    try {
      resp = await processer(fetcherInstance, ...args);
      break;
    } catch (err) {
      if (err === 'Fail') {
        errMessage = err;
        break;
      } else if (err === 'ChangeProxy') {
        console.log(`LOG: Changing proxy`);
        fetcherInstance = await fetcher.resetFetcherInstance();
        continue;
      } else if (err === 'Retry') {
        console.log(`LOG: ${i + 1} times fail, Reason(active retry)`);
        if (config.retryTimes === i + 1) {
          errMessage = 'Fail, Unable to retry';
        }
        continue;
      } else {
        console.log(`LOG: ${i + 1} times fail, Reason(${err.message})`);
        errMessage = err.message;
      }
    }
  }

  if (resp === undefined) throw new Error(errMessage);

  return resp;
};

module.exports = {
  get,
  setConfig(userConfig) {
    config = {
      ...config,
      ...userConfig,
    };
  },
};
