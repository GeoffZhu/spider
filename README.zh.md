# gz-spider

一个基于Puppeteer和Axios的NodeJs爬虫框架

## 特性
- 可配置代理
- 支持任务重试
- 支持Puppeteer
- 异步队列服务友好
- 多进程友好

## 安装

``` bash
npm i gz-spider --save
```

## 使用

``` javascript
const spider = require('gz-spider');

// 每个爬虫是一个方法，需要通过setProcesser注册
spider.setProcesser({
  ['getGoogleSearchResult']: async (fetcher, params) => {
    // fetcher.page是原始的puppeteer page，可以直接用于打开页面
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

// 开始爬取
spider.getData('getGoogleSearchResult', params).then(userInfo => {
  console.log(userInfo);
});

```

## 配置

框架由三部分组成，fetcher、strategy、processer。

### Fetcher

``` javascript
spider.setFetcher({
  axiosTimeout: 5000,
  proxyTimeout: 180 * 1000
  proxy() {
    // 支持返回Promise，可以从远端拉取代理的配置
    return {
      host: '127.0.0.1',
      port: '9000'
    }
  }
});
```

- `axiosTimeout`: [Number] 每次爬虫请求的超时时间
- `proxyTimeout`: [Number] 更新代理IP时间，代理IP有超时的场景使用，会重新执行proxy function，使用新的代理IP
- `proxy`: [Object | Function] 当 `proxy`是[Function], 支持异步，可以从远端拉取代理的配置
  - `proxy.host` [String]
  - `proxy.port` [String]

### Strategy

``` javascript
spider.setStrategy({
  retryTimes: 2
});
```

- `retryTimes`: [Number] 最大重试次数

## 与任务队列结合使用

### 流程

``` javascript
获取任务 -> `spider.getData(processerKey, processerIn)` -> 完成任务并带上处理好的数据
```

### 用MySql模拟任务队列

1. 创建`spider-task`表, 至少包含`'id', 'status', 'processer_key', 'processer_input', 'processer_output'`
2. 写一个拉取未完成任务的接口, 例如 `GET /spider/task`
3. 写一个完成任务的接口， 例如 `PUT /spider/task`

``` javascript
const axios = require('axios');

while (true) {
  // 获取任务
  let resp = await axios.get('http://127.0.0.1:8080/spider/task');

  if (!resp.data.task) break;
  
  let { id, processerKey, processerInput } = resp.data.task;
  let processerOutput = await spider.getData(processerKey, processerInput);

  // 完成任务并带上处理好的数据
  await axios.put('http://127.0.0.1:8080/spider/task', {
    id, processerOutput,
    status: 'success'
  });
}
```

## 对于爬虫的一些想法

### 为什么需要爬虫框架
爬虫框架可以简化开发流程，提供统一规范，提升效率。一套优秀的爬虫框架会利用多线程，多进程，分布式，IP池等能力，帮助开发者快速开发出易于维护的工业级爬虫，长期受用。

### 对爬虫的正确理解
爬虫的运行方式就决定了它无法做到长久稳定和实时。在设计爬虫框架的时候，围绕的点是异步任务队列。工程上爬虫框架会提供一个高效的数据处理流水线，并可适配多种任务队列。

gz-spider分为三个组成部分，fetcher，strategy和processer。
fetcher抓取器，其中包含常用的http和puppeteer，并且可以挂各种类型的代理。
strategy策略中心，负责配置爬取失败后的各种策略。
processer负责从原始数据结构处理为目标数据的过程，也是爬虫框架用户要写的部分

## License
[MIT](https://opensource.org/licenses/MIT)