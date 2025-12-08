var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

//obj.data.busi_vip_list[0].vip_end_time = "2025-12-31 12:32:53"
var busiVipList = obj.data.busi_vip["2197992154"];
busiVipList.forEach(vip => {
    vip.vip_end_time = "2025-12-31 12:32:53"
})

body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改