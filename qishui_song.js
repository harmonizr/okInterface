var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
//console.log(obj)
// if(obj.track.artists){
//     for(let i in obj.track.artists){
//         obj.track.artists[i].user_info.is_vip = true;
//         obj.track.artists[i].user_info.vip_stage = "free";
//     }
// }
console.log(obj);
//obj.track.artists[0].user_info.is_vip = true;

// //obj.track.label_info.only_vip_download=true;
// obj.track.label_info.only_vip_playable = false;

// obj.track.preview.duration = obj.track.colors.duration;
// obj.track.preview.start = 0;

// obj.track.audition_info.start_time_ms = 0;
// obj.track.audition_info.duration_ms= obj.track.colors.duration;


//音质
// obj.track.label_info.quality_map.lossless.play_detail.need_vip = false;
// obj.track.label_info.quality_map.medium.play_detail.need_vip = false;
// obj.track.label_info.quality_map.highest.play_detail.need_vip = false;
// obj.track.label_info.quality_map.higher.play_detail.need_vip = false;
// obj.track.label_info.quality_map.spatial.play_detail.need_vip = false;
// obj.track.label_info.quality_only_vip_can_play=[""];

//body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改