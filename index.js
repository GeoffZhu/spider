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
  setProcesser(name, processer) {
    this.processers[name] = processer
  },
  setProcessers(processers) {
    Object.keys(processers).forEach(name => {
      this.setProcesser(name, processers[name])
    })
  },
  getAllProcessers() {
    return Object.keys(this.processers)
  },
  getData(processerKey, params) {
    return strategy.get(this.processers[processerKey], params);
  },
};

module.exports = spider;
