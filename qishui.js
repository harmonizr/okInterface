var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

//obj.friend_rankings.rankings[0].user_brief.medium_avatar_url.is_vip = true;
obj.playlists[0].owner.is_vip = true;
obj.playlists[1].owner.is_vip = true;

body = JSON.stringify(OBJ);//重新打包回json字符串
$done({body});//结束修改