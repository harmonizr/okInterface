var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

//搜索
 if (obj.hasOwnProperty('only_vip_playable')) 
    {
        obj.only_vip_playable = false;
    }
// 遍历对象的每个属性
Object.values(obj).forEach(value => setOnlyVipPlayableToFalse(value));

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改