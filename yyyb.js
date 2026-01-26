var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
obj.datas.subverterVo.vipDeadline = 1830246630000;
obj.datas.subverterVo.fzVipDeadline = 1830246630000;
obj.datas.subverterVo.vipFlag = 1;
obj.datas.subverterVo.fzVipLevel = 1;
obj.datas.subverterVo.xxyyVipFlag = 1;
obj.datas.isAudit = 1;
obj.datas.subverterVo.identity = "VIP";
//obj.datas.vipMonthTimeFlag = false;
body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改