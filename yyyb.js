console.log($request.url)
const url = $request.url;
// 通用请求场景（fetch示例）
fetch(url)
  .then(res => res.text()) // 先获取text/plain格式的文本
  .then(text => JSON.parse(text)) // 解析为JSON对象
  .then(json => {
    console.log('解析后的JSON：', json);
    // 后续操作json数据
});
// var body = $response.body;//声明一个变量body并以响应消息体赋值
// var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
// obj = JSON.parse(data);//JSON.parse()将json形式的body转变成对象处理
// obj.datas.xxyyVipLevel = 1;

// obj.datas.fzVipDeadline = 1769498970000;
// obj.datas.vipDeadline = 1769498970000;
// obj.datas.xxyyVipDeadline = 1769498970000;

// obj.datas.dpVipDeadline = 1769498970000;
// obj.datas.flippedVipDeadline = 1769498970000;
// obj.datas.zcnVipDeadline = 1769498970000;
// obj.datas.ybVipDeadline = 1769498970000;

// obj.datas.xxyyVipFlag = 1;
// obj.datas.vipFlag = 1;

// obj.datas.zcnVipFlag = 1;
// obj.datas.foreverVipFlag = 1;
// obj.datas.flippedForeverVipFlag = 1;



// body = JSON.stringify(obj);//重新打包回json字符串
// $done({body});//结束修改