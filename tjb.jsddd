
var header = $request.header;//声明一个变量header并以响应消息体赋值
var obj = JSON.parse(header);//JSON.parse()将json形式的header转变成对象处理
console.log(obj)

const u = crypto.randomUUID();
obj.x-copygo-client-key = u;
obj.x-copygo-display-name = "v_" + u.split("-")[0];
obj.user-agen = "Mozilla/5.0 (iPhone; CPU iPhone OS " + (16+Math.floor(Math.random()*3)) + "_" + Math.floor(Math.random()*9) + " like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1";

const params = {
  "x-copygo-client-key": u,
  "x-copygo-display-name": "v_" + u.split("-")[0],
  "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS " + (16+Math.floor(Math.random()*3)) + "_" + Math.floor(Math.random()*9) + " like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1"
};
console.log(params);
header = JSON.stringify(obj);//重新打包回json字符串
$done({header});//结束修改