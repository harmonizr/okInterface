
// var body = $response.body;//声明一个变量body并以响应消息体赋值
// var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
var body = {
    "status": 1001,
    "message": "操作成功",
    "sign": "XXXXXXXX",
    "accessToken": "2016408398014459904",
    "timestamp": 1769584199803,
    "datas": {
        "xxyyVipLevel": 0,
        "appRemind": 1,
        "invited": 0,
        "userGrade": 0,
        "id": 4301911618,
        "userLevel": 0,
        "isSub": 0,
        "bindAppleFlag": 0,
        "dpVipDeadline": 1769584086000,
        "foreverVipFlag": 0,
        "subverterIdentityTitle": "",
        "day5VipFlag": 0,
        "vipDeadline": 1769584086000,
        "className": "",
        "skipGuideFlag": 1,
        "nickname": "游客3214",
        "hasPurpose": 0,
        "vipLevel": 0,
        "bindWxFlag": 0,
        "flippedUserLevel": "A0",
        "stage": "大学生",
        "userPurpose": "",
        "vipType": "",
        "flippedVipDeadline": 1769584086000,
        "xxyyVipDeadline": 1769584086000,
        "zcnVipDeadline": 1769584086000,
        "subCount": 0,
        "subverterLevelTitle": "未知",
        "zcnVipFlag": 0,
        "flippedVipLevel": 0,
        "userNo": "700499070",
        "isNew": true,
        "popIndex": false,
        "xxyyVipFlag": 0,
        "reduceCoupon": true,
        "headPortrait": "https://img.binfenyingyu.com/app/flipped/app-flipped-avatar-default-male.png",
        "day2VipFlag": 0,
        "hasPwd": 0,
        "fzVipActive": 0,
        "mobile": "",
        "flippedVipFlag": 0,
        "wxRemind": 0,
        "hasInterest": 0,
        "newUserFlag": 0,
        "createTime": 1769584086000,
        "ybVipDeadline": 1769584086000,
        "classNumber": 0,
        "zcnVipLevel": 0,
        "flippedForeverVipFlag": 0,
        "vipFlag": 0,
        "mainUserNo": "",
        "userIdentityType": 0
    }
}
//var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
var obj = body;//JSON.parse()将json形式的body转变成对象处理

obj.datas.xxyyVipLevel = 1;

obj.datas.fzVipDeadline = 1769498970000;
obj.datas.vipDeadline = 1769498970000;
obj.datas.xxyyVipDeadline = 1769498970000;

obj.datas.dpVipDeadline = 1769498970000;
obj.datas.flippedVipDeadline = 1769498970000;
obj.datas.zcnVipDeadline = 1769498970000;
obj.datas.ybVipDeadline = 1769498970000;

obj.datas.xxyyVipFlag = 1;
obj.datas.vipFlag = 1;

obj.datas.zcnVipFlag = 1;
obj.datas.foreverVipFlag = 1;
obj.datas.flippedForeverVipFlag = 1;



body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改