var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

//obj.track.artists[0].user_info.is_vip = true;

obj.track.limited_free_info.expire_time = 30;

//obj.track.label_info.only_vip_download=true;
obj.track.label_info.only_vip_playable = false;

obj.track.preview.duration = obj.track.colors.duration;
obj.track.preview.start = 0;

obj.track.audition_info.start_time_ms = 0;
obj.track.audition_info.duration_ms= obj.track.colors.duration;

//搜索
 if (obj.hasOwnProperty('only_vip_playable')) 
    {
        obj.only_vip_playable = false;
    }
// 遍历对象的每个属性
Object.values(obj).forEach(value => setOnlyVipPlayableToFalse(value));

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改