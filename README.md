# gz-spider

[中文文档](https://github.com/GeoffZhu/spider/blob/master/README.zh.md)

A web spider framework for NodeJs, base on Puppeteer & Axios;

## Feture
- IP Proxy
- Fail retry
- Support Puppeteer
- Easily compatible with various task queue services
- Easily multiprocessing

## Install

``` bash
npm i gz-spider --save
```

## Usage

``` javascript
const spider = require('gz-spider');

// All your spider code register in Processer
spider.setProcesser({
  ['getUserInfo']: async (fetcher, params) => {
    // fetcher.page is original puppeteer page 
    let resp = await fetcher.axios.get(`https://www.google.com/search?q=${params}`);

    // throw 'Retry', will retry this processer
    // throw 'ChangeProxy', will retry this processer use new proxy
    // throw 'Fail', will finish this processer with message(fail) Immediately

    if (resp.status === 200) {
      // Data processing start
      let result = resp.data + 1;
      // Data processing end
      return result;
    } else {
      throw 'retry';
    }
  }
});

// Get data
spider.getData('getUserInfo', params).then(userInfo => {
  console.log(userInfo);
});

```

## Config

This framework is divided into three components, fetcher, strategy and processer. 

### Fetcher

``` javascript
spider.setFetcher({
  axiosTimeout: 5000,
  proxyTimeout: 180 * 1000
  proxy() {
    // support async function，you can get proxy config from remote.
    return {
      host: '127.0.0.1',
      port: '9000'
    }
  }
});
```

- `axiosTimeout`: [Number] Peer request timeout ms
- `proxyTimeout`: [Number] When config.proxy is [Function], will re-run proxy function and get new proxy host+port
- `proxy`: [Object | Function] When `proxy` is [Function], support async function，you can get proxy config from remote
  - `proxy.host` [String]
  - `proxy.port` [String]

### Strategy

``` javascript
spider.setStrategy({
  retryTimes: 2
});
```

- `retryTimes`: [Number] Max retry times for one task

## Work with task queue

### Process

``` javascript
Get one task -> `spider.getData(processerKey, processerIn)` -> Complete task with processed data
```

### Simulate task queue use MySQL

1. Create table `spider-task`, include at least `'id', 'status', 'processer_key', 'processer_input', 'processer_output'`
2. Write api to get one todo task (status = todo), for example `GET /spider/task`
3. Write api to update db table with processed data, for example `PUT /spider/task`

``` javascript
const axios = require('axios');

while (true) {
  // Get one task
  let resp = await axios.get('http://127.0.0.1:8080/spider/task');

  if (!resp.data.task) break;
  
  let { id, processerKey, processerInput } = resp.data.task;
  let processerOutput = await spider.getData(processerKey, processerInput);

  // Complete task with processed data
  await axios.put('http://127.0.0.1:8080/spider/task', {
    id, processerOutput,
    status: 'success'
  });
}
```
