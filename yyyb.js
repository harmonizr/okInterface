// 文件名：decode-response.js
// 匹配你要处理的特定请求

(async function() {
    // 获取响应体
    let body = $response.body;
    
    // 检查是否有自定义加密
    if ($response.headers['encryType'] === '1') {
        // 这里需要根据实际加密算法处理
        // 常见的可能是 Base64、AES、自定义算法等
        // 示例：如果是 Base64
        body = atob(body); // Base64 解码
    }
    
    // 检查是否是 gzip 压缩
    if ($response.headers['Content-Encoding'] === 'gzip') {
        // Loon 通常会自动解压 gzip，但如果需要手动处理：
        // 将十六进制字符串转换为字节数组
        const bytes = hexToBytes(body);
        // 使用 pako 或内置方法解压（需要导入 pako 库）
        // body = ungzip(bytes);
    }
    
    // 尝试解析为 JSON
    try {
        const jsonData = JSON.parse(body);
        console.log("ddddd");
        console.log(jsonData)
        // 替换响应体为格式化 JSON
        $done({
            body: JSON.stringify(jsonData, null, 2),
            headers: {
                ...$response.headers,
                'Content-Type': 'application/json; charset=UTF-8'
            }
        });
    } catch (error) {
        console.log('解析失败，原始响应:', body);
        $done({});
    }
})();

// 辅助函数：十六进制转字节数组
function hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
}

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