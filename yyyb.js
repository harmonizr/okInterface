const url =$response.url;
fetch(url)
  .then(response => response.text())
  .then(text => {
    try {
      const obj = JSON.parse(text);
      console.log(obj);
    } catch (e) {
      console.error('解析失败:', e);
    }
});

// var body = $response.body;//声明一个变量body并以响应消息体赋值
// var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

obj.datas.xxyyVipLevel = 1;

obj.datas.fzVipDeadline = 1769498970000;
obj.datas.vipDeadline = 1769498970000;
obj.datas.xxyyVipDeadline = 1769498970000;

obj.datas.dpVipDeadline = 1769498970000;
obj.datas.flippedVipDeadline = 1769498970000;
obj.datas.zcnVipDeadline = 1769498970000;
obj.datas.ybVipDeadline = 1769498970000;

obj.datas.xxyyVipFlag = 1;
obj.datas.vipFlag = 1;

obj.datas.zcnVipFlag = 1;
obj.datas.foreverVipFlag = 1;
obj.datas.flippedForeverVipFlag = 1;



body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改