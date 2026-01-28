      // Loon 脚本
const body = $response.body;
console.log('原始数据:', body);
console.log('数据长度:', body.length);

try {
    // Base64 解码
    const decoded = $text.base64Decode(body);
    console.log('Base64 解码后:', decoded);
    console.log('解码长度:', decoded.length);
    
    // 尝试解析为 JSON
    try {
        const jsonData = JSON.parse(decoded);
        console.log('✅ Base64 -> JSON 解析成功!');
        console.log('JSON 数据:', jsonData);
    } catch (jsonError) {
        console.log('解码后不是 JSON，可能是其他格式:', jsonError.message);
        
        // 查看解码后的前100个字符
        console.log('解码内容预览:', decoded.substring(0, Math.min(100, decoded.length)));
        
        // 检查是否是二进制数据
        const isBinary = Array.from(decoded).some(c => c.charCodeAt(0) < 32 && c.charCodeAt(0) !== 10 && c.charCodeAt(0) !== 13);
        if (isBinary) {
            console.log('⚠️ 解码后包含二进制数据，可能需要进一步处理');
        }
    }
} catch (base64Error) {
    console.log('Base64 解码失败:', base64Error.message);
}

$done();
// var body = $response.body;//声明一个变量body并以响应消息体赋值
// var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

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