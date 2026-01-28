 // 完整的 Base64 解码和解析脚本
const body = $response.body;
console.log('原始响应体长度: ' + body.length + ' 字符');

// 检查是否是有效的 Base64
function isValidBase64(str) {
    // 移除可能的空白字符
    str = str.replace(/\s/g, '');
    return /^[A-Za-z0-9+/]*={0,2}$/.test(str) && str.length % 4 === 0;
}

console.log('是否为有效 Base64: ' + isValidBase64(body));

try {
    // 解码 Base64
    const decoded = atob(body);
    console.log('Base64 解码成功');
    console.log('解码后长度: ' + decoded.length + ' 字节');
    
    // 查看前 200 个字符（看看是什么格式）
    const preview = decoded.substring(0, Math.min(200, decoded.length));
    console.log('解码内容预览: ' + preview);
    
    // 显示十六进制表示的前 100 字节
    console.log('十六进制预览:');
    let hexPreview = '';
    for (let i = 0; i < Math.min(100, decoded.length); i++) {
        const hex = decoded.charCodeAt(i).toString(16).padStart(2, '0');
        hexPreview += hex + ' ';
        if ((i + 1) % 16 === 0) hexPreview += '\n';
    }
    console.log(hexPreview);
    
    // 尝试解析为 JSON（可能失败）
    try {
        const jsonData = JSON.parse(decoded);
        console.log('✅ 直接 JSON 解析成功');
        console.log('JSON 结构: ' + JSON.stringify(jsonData).substring(0, 200));
        
        // 返回格式化 JSON
        $done({
            headers: {
                ...$response.headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(jsonData, null, 2)
        });
        return;
    } catch (jsonError) {
        console.log('❌ 不是 JSON 格式: ' + jsonError.message);
    }
    
    // 尝试检测数据类型
    if (decoded.startsWith('{') || decoded.startsWith('[')) {
        console.log('数据以 { 或 [ 开头，但 JSON 解析失败，可能是格式错误');
    } else if (decoded.charCodeAt(0) === 0x1F && decoded.charCodeAt(1) === 0x8B) {
        console.log('✅ 检测到 Gzip 压缩数据 (魔数 1F 8B)');
        // 可能需要解压
    } else if (decoded.charCodeAt(0) === 0x78 && decoded.charCodeAt(1) === 0x9C) {
        console.log('✅ 检测到 Zlib 压缩数据 (魔数 78 9C)');
        // 可能需要解压
    } else {
        console.log('可能是加密的二进制数据或其他格式');
    }
    
    // 保存数据供后续分析
    $persistentStore.write(decoded, 'full_decoded_data');
    console.log('完整解码数据已保存到持久化存储: full_decoded_data');
    
} catch (error) {
    console.log('❌ Base64 解码失败: ' + error.message);
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