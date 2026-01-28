 // 保存完整数据以便用外部工具分析
const body = $response.body;

console.log('保存完整响应数据...');
console.log('原始长度: ' + body.length + ' 字符');

// 保存 Base64 数据
$persistentStore.write(body, 'full_response_base64');
console.log('Base64 数据已保存: full_response_base64');

// 尝试解码并保存二进制数据
try {
    const decoded = atob(body);
    console.log('解码成功，二进制长度: ' + decoded.length + ' 字节');
    
    // 保存十六进制表示（适合分析）
    let hexStr = '';
    for (let i = 0; i < decoded.length; i++) {
        hexStr += ('00' + decoded.charCodeAt(i).toString(16)).slice(-2);
    }
    
    $persistentStore.write(hexStr, 'full_response_hex');
    console.log('十六进制数据已保存: full_response_hex (长度: ' + hexStr.length + ' 字符)');
    
    // 保存前100字节的详细分析
    let analysis = '=== 响应数据分析 ===\n';
    analysis += 'Base64 长度: ' + body.length + '\n';
    analysis += '解码后长度: ' + decoded.length + ' 字节\n\n';
    analysis += '前100字节十六进制:\n';
    
    for (let i = 0; i < Math.min(100, decoded.length); i++) {
        if (i % 16 === 0) analysis += '\n' + i.toString().padStart(4, '0') + ': ';
        const hex = decoded.charCodeAt(i).toString(16).padStart(2, '0');
        analysis += hex + ' ';
    }
    
    analysis += '\n\n前100字节ASCII:';
    for (let i = 0; i < Math.min(100, decoded.length); i++) {
        if (i % 16 === 0) analysis += '\n' + i.toString().padStart(4, '0') + ': ';
        const code = decoded.charCodeAt(i);
        analysis += (code >= 32 && code <= 126) ? decoded.charAt(i) : '.';
        analysis += ' ';
    }
    
    $persistentStore.write(analysis, 'response_analysis');
    console.log('分析报告已保存: response_analysis');
    
    // 判断可能的类型
    console.log('\n=== 类型判断 ===');
    if (decoded.length % 16 === 0) {
        console.log('🔐 可能是 AES 加密（长度是16的倍数）');
    }
    if (decoded.charCodeAt(0) === 0x1F && decoded.charCodeAt(1) === 0x8B) {
        console.log('🗜️  可能是 Gzip 压缩');
    }
    if (decoded.charAt(0) === '{' || decoded.charAt(0) === '[') {
        console.log('📄 可能是 JSON（但需要解密/解压）');
    }
    
} catch (error) {
    console.log('解码失败: ' + error.message);
}

console.log('\n建议：');
console.log('1. 将这些数据导入电脑分析');
console.log('2. 使用工具如 CyberChef (gchq.github.io/CyberChef)');
console.log('3. 尝试 Base64 -> 各种解密/解压');
console.log('4. 查看应用源码找加密算法');

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