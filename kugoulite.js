var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

var today = new Date();
var year = today.getFullYear();
var month = today.getMonth() + 1;  // 月份从0开始，所以要加1
var day = today.getDate();
var time = year + '-' + month + '-' + day
console.log(time);
obj.data.list

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改