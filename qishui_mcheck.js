var body = $response.body;//声明一个变量body并以响应消息体赋值
console.log($response)
console.log(body)
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
console.log("obj.media_status[0].label_info:"+obj.media_status[0].label_info)

if(obj.media_status[0].label_info != null){
    obj.media_status[0].label_info.quality_only_vip_can_play = [""];
    obj.media_status[0].label_info.quality_map.lossless.play_detail.need_vip = false;
    obj.media_status[0].label_info.quality_map.highest.play_detail.need_vip = false;
    obj.media_status[0].label_info.quality_map.hi_res.play_detail.need_vip = false;
    obj.media_status[0].label_info.quality_map.spatial.play_detail.need_vip = false;

}
console.log("obj.media_status:"+obj.media_status)
if(obj.media_status){
 obj.media_status[0].limited_free_info.expire_time = 60000;
}
// if(obj.media_status){
//     for(let i in obj.media_status){
//         obj.media_status[i].label_info.quality_only_vip_can_play = [""];
//         obj.media_status[i].label_info.quality_map.lossless.play_detail.need_vip = false;    
//         obj.media_status[i].label_info.only_vip_playable = false;
//         let limited_free_info = obj.media_status[i].limited_free_info
//         if(limited_free_info){
//              limited_free_info.limited_free = false;
//         }
//     }
// }

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改