 // 直接测试你提供的数据
const testData = "XbmowmS5UVdAYgX4BLaKkYDMyLvSD1/EuiEfmHUZ//BtsIlUDOQ/NrtAEz22OUiAO0iCxUBVZ3yD2ed";

console.log('=== Base64 测试 ===');
console.log('测试数据: ' + testData);
console.log('长度: ' + testData.length + ' (应该是 4 的倍数)');

// 检查是否是有效的 Base64
function isValidBase64(str) {
    const regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return regex.test(str.replace(/\s/g, '')) && str.length % 4 === 0;
}

console.log('是否有效 Base64: ' + isValidBase64(testData));

// 尝试解码
try {
    let decoded;
    
    if (typeof atob !== 'undefined') {
        console.log('使用 atob()');
        decoded = atob(testData);
    } else {
        // 自定义解码
        function simpleBase64Decode(str) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
            let result = '';
            let i = 0;
            
            str = str.replace(/[^A-Za-z0-9+/]/g, '');
            
            while (i < str.length) {
                const enc1 = chars.indexOf(str.charAt(i++));
                const enc2 = chars.indexOf(str.charAt(i++));
                const enc3 = chars.indexOf(str.charAt(i++));
                const enc4 = chars.indexOf(str.charAt(i++));
                
                const byte1 = (enc1 << 2) | (enc2 >> 4);
                const byte2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                const byte3 = ((enc3 & 3) << 6) | enc4;
                
                result += String.fromCharCode(byte1);
                if (enc3 !== 64) result += String.fromCharCode(byte2);
                if (enc4 !== 64) result += String.fromCharCode(byte3);
            }
            
            return result;
        }
        
        console.log('使用自定义解码函数');
        decoded = simpleBase64Decode(testData);
    }
    
    console.log('✅ 解码成功');
    console.log('解码后长度: ' + decoded.length);
    console.log('解码内容: ' + decoded);
    
    // 查看十六进制表示
    let hexStr = '';
    for (let i = 0; i < Math.min(decoded.length, 50); i++) {
        hexStr += ('00' + decoded.charCodeAt(i).toString(16)).slice(-2) + ' ';
    }
    console.log('十六进制: ' + hexStr);
    
} catch (error) {
    console.log('❌ 解码失败: ' + error.message);
}

$done();



// var body = $response.body;//声明一个变量body并以响应消息体赋值
// var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

//var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
// var obj = body;//JSON.parse()将json形式的body转变成对象处理

// obj.datas.xxyyVipLevel = 1;

// obj.datas.fzVipDeadline = 1769498970000;
// obj.datas.vipDeadline = 1769498970000;
// obj.datas.xxyyVipDeadline = 1769498970000;

// obj.datas.dpVipDeadline = 1769498970000;
// obj.datas.flippedVipDeadline = 1769498970000;
// obj.datas.zcnVipDeadline = 1769498970000;
// obj.datas.ybVipDeadline = 1769498970000;

// obj.datas.xxyyVipFlag = 1;
// obj.datas.vipFlag = 1;

// obj.datas.zcnVipFlag = 1;
// obj.datas.foreverVipFlag = 1;
// obj.datas.flippedForeverVipFlag = 1;



// body = JSON.stringify(obj);//重新打包回json字符串
// $done({body});//结束修改