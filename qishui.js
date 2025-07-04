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
obj.data.sections[1].task_group.tasks[0].view.subtitle.forEach(task => {
            if (task.view && task.view.subtitle) {
                // 保留原有的type属性
                const originalType = task.view.subtitle.type;
                
                // 构建新的subtitle结构
                task.view.subtitle = {
                    type: originalType,
                    prefix: {
                        type: 1,
                        plain_text: "已解锁"
                    },
                    type: 2,
                    countdown_text: {
                        countdown: {
                            duration: 18,
                            suffix: "天",
                            unit: 2,
                            format: "d"
                        }
                    },
                    suffix: {
                        type: 1,
                        plain_text: " 再看2次提前解锁下一天"
                    }
                };
            }
        });

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改
