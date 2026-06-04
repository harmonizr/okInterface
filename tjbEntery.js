var body = $response.body;//声明一个变量body并以响应消息体赋值

var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

obj.message = "操作成功";
obj.code = 200;
let data = {
    "shortId": "xoo7V2Yb6xzm",
    "entry": {
      "createdAt": 1779682340563,
      "extras": {
        "extra_code": "HU293"
      },
      "usedCount": 0,
      "rawText": "09《c12pg0RJw43₤ https://m.tb.cn/h.R7cRrzz  CZ009 最高赚188加抵金",
      "markedInvalidCount": 0,
      "titleDisplay": null,
      "deeplinkRendered": {
        "ios": "tbopen://m.taobao.com/tbopen/index.html?action=ali.open.nav&module=h5&h5Url=https%3A%2F%2Fm.tb.cn%2Fh.R7cRrzz",
        "h5": "https://m.tb.cn/h.R7cRrzz",
        "android": "tbopen://m.taobao.com/tbopen/index.html?action=ali.open.nav&module=h5&h5Url=https%3A%2F%2Fm.tb.cn%2Fh.R7cRrzz"
      },
      "shortId": "xoo7V2Yb6xzm",
      "expiresAt": 1779941540563,
      "shareUrl": "https://m.tb.cn/h.R7cRrzz",
      "markedFullCount": 0,
      "maxUseTimes": 1,
      "coreToken": "R7cRrzz",
      "status": "active",
      "publisherDisplayName": "v_9wf0be2d"
    },
    "isRevived": true
  };
obj[data] = data;

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改
