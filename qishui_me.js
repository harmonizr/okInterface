var body = $request.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
obj.limited_free_param.rewind_pre_intercept_type="ad_vip_song_guide_new";
obj.limited_free_param.expire_time=1752087576;
obj.limited_free_param[limited_free]=false;

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改