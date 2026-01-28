 console.log($request.url)
const url = $request.url;
// 完整可运行，替换url即可
async function parsePlainToJson(url) {
  try {
    const res = await fetch(url);
    const plainText = await res.text(); // 取text/plain响应体
    const json = JSON.parse(plainText.trim()); // 去首尾空格，解析为JSON
    return json;
  } catch (err) {
    console.error('解析失败：'+ err); // 捕获格式错/网络错
    return {}; // 兜底返回空对象，避免页面报错
  }
}

// 调用
parsePlainToJson(url).then(json => {
  console.log('解析后JSON：');
    console.log( JSON.parse(json));

  // 后续业务逻辑
});

// var body = $response.body;//声明一个变量body并以响应消息体赋值
// var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

//var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
// var obj = body;//JSON.parse()将json形式的body转变成对象处理

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