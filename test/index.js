const spider = require('../index.js');

// spider.setStrategy({
//   retryTimes: 2
// });

// spider.setFetcher({
//   proxyTimeOut: 180 * 1000,
//   axiosTimeout: 5000,
//   proxy() {
//     return {
//       host: '127.0.0.1',
//       port: '7890'
//     }
//   }
// });

spider.setProcesser({
  ['getGoogleSearchResult']: async ({axios}, params) => {
    let resp = await axios.get(`https://www.twitter.com/search?q=${params}`);
    if (resp.status === 200) {
      return resp.data;
    } else {
      throw 'Fail';
    }
  }
});

// trigger getGoogleSearchResult 
spider.getData('getGoogleSearchResult', 'keyword').then(result => {
  console.log(result);
}).catch(e => {
  console.log(e);
});