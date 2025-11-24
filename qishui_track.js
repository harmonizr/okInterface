var body = $response.body;//声明一个变量body并以响应消息体赋值

var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

obj.track.label_info.quality_map.lossless.play_detail.need_vip = false;
obj.track.label_info.quality_map.hi_res.play_detail.need_vip = false;
obj.track.label_info.quality_map.spatial.play_detail.need_vip = false;


body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改