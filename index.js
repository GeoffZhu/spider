
const strategy = require('./strategy');
const fetcher = require('./fetcher');

const spider = {
  processers: {},
  setStrategy(config) {
    strategy.setConfig(config);
  },
  setFetcher(config) {
    fetcher.setConfig(config);
  },
  setProcesser(processers) {
    this.processers = {
      ...this.processers,
      ...processers
    }
  },
  getData(processerKey, params) {
    return strategy.get(this.processers[processerKey], params);
  }
};

module.exports = spider;