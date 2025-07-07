var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
if(obj.playlists){
    for(let i in obj.playlists){
        let is_vip = obj.playlists[i].user_artist_info.user_brief.is_vip
        is_vip =true;
    }
}

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改