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
obj.data.sections[1].task_group.tasks.forEach(task => {
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
                            duration: 20,
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
             if (task.discrepancy_data && task.discrepancy_data.reward_ads) {
               
                // 构建新的subtitle结构
               task.discrepancy_data.reward_ads = {
                        "progress": [
                            {
                                "seq": 1800,
                                "is_completed": true,
                                "children": [
                                    {
                                        "seq": 1801,
                                        "text": {
                                            "type": 0
                                        },
                                        "is_completed": true
                                    },
                                    {
                                        "seq": 1802,
                                        "text": {
                                            "type": 0
                                        },
                                        "is_completed": true
                                    }
                                ],
                                "text": {
                                    "type": 1,
                                    "plain_text": "第18天"
                                }
                            },
                            {
                                "seq": 1900,
                                "is_completed": false,
                                "children": [
                                    {
                                        "seq": 1901,
                                        "text": {
                                            "type": 0
                                        },
                                        "is_completed": false
                                    },
                                    {
                                        "seq": 1902,
                                        "text": {
                                            "type": 0
                                        },
                                        "is_completed": false
                                    }
                                ],
                                "text": {
                                    "type": 1,
                                    "plain_text": "第19天"
                                }
                            },
                            {
                                "seq": 2000,
                                "is_completed": false,
                                "children": [
                                    {
                                        "seq": 2001,
                                        "text": {
                                            "type": 0
                                        },
                                        "is_completed": false
                                    },
                                    {
                                        "seq": 2002,
                                        "text": {
                                            "type": 0
                                        },
                                        "is_completed": false
                                    }
                                ],
                                "text": {
                                    "type": 1,
                                    "plain_text": "第20天"
                                }
                            }
                        ]
                    }
                                }
        });

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改
