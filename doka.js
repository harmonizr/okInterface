var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

obj.data.status = "vip_user";  
obj.data.is_vip = true;
obj.data.product_id = "com.ydgn.dokacamera.yearly";
obj.data.expire_date = "2030-02-21 21:54:36";
obj.data.trial_period = true;
obj.data.is_vip = true;

// obj.data.expire_time = "2030-02-21 21:54:36";
// obj.data.remaining_count = 999;
body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改