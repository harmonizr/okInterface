//console.log( $request)
var headers = $request.headers;//声明一个变量header并以响应消息体赋值
//var obj = JSON.parse(header);//JSON.parse()将json形式的header转变成对象处理
//console.log(obj)


// 生成UUID
// 生成随机UUID（无x变量，不报错）
let chars = '0123456789abcdef';
let uuid = '';
for(let i=0;i<36;i++){
  if(i===8||i===13||i===18||i===23) uuid+='-';
  else if(i===14) uuid+='4';
  else if(i===19) uuid+=chars[Math.floor(Math.random()*4)+8];
  else uuid+=chars[Math.floor(Math.random()*16)];
}
const langList = [
  "zh-CN,zh;q=0.9,en;q=0.8",
  "zh-CN,zh;q=0.8",
  "zh-CN,zh,en-US;q=0.9,en;q=0.8",
  "zh-CN,zh;q=0.95"
];
const randomLang = langList[Math.floor(Math.random() * langList.length)];

// 三个参数直接定义好
headers["x-copygo-client-key"]  = uuid;
headers["x-copygo-display-name"]  = "v_" + uuid.split('-')[0];
headers["user-agent"] =  ["Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1","Mozilla/5.0 (Linux; Android 14; SM‑S9110) AppleWebKit/537.36 Chrome/129.0.0.0 Mobile","Mozilla/5.0 (Linux; Android 13; MI‑14) AppleWebKit/537.36 Chrome/128.0.0.0 Mobile"][Math.floor(Math.random()*3)];
headers["accept-language"] = randomLang
//console.log(header)
$done({headers});//结束修改
