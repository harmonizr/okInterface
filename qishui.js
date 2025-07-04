var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

//obj.friend_rankings.rankings[0].user_brief.medium_avatar_url.is_vip = true;
//obj.playlists[0].owner.is_vip = true;
//obj.playlists[1].owner.is_vip = true;

obj.data.sections[0].asset_group.assets[2].amount_type="day";
obj.data.sections[0].asset_group.assets[2].amount=20;

obj.data.sections[1].task_group.tasks[0].assets[0].amount_type="day";
obj.data.sections[1].task_group.tasks[0].assets[0].amount=20;
// let countdown_text={
//     "countdown": {
//         "duration": 20,
//         "suffix": "天",
//         "unit": 2,
//         "format": "d"
//     }
// }
//obj.data.sections[1].task_group.tasks[0].view.subtitle.countdown_text.countdown.duration=20;

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改