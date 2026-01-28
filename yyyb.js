// 文件名：decrypt-response.js
// 用于 Loon 的 AES-CBC 解密脚本

// 辅助函数：Base64 解码
function base64Decode(str) {
    try {
        // 移除可能的换行符
        const cleanStr = str.replace(/\n/g, '').replace(/\r/g, '');
        return atob(cleanStr);
    } catch (e) {
        console.log('Base64 解码失败:'+ e);
        return null;
    }
}

// 辅助函数：十六进制字符串转字节数组
function hexToBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
}

// 辅助函数：字节数组转十六进制字符串
function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 辅助函数：字符串转字节数组
function stringToBytes(str) {
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}

// 辅助函数：字节数组转字符串
function bytesToString(bytes) {
    return String.fromCharCode.apply(null, bytes);
}

// 解密函数（使用 Web Crypto API）
async function decryptAES_CBC(encryptedBytes, keyBytes, ivBytes) {
    try {
        // 导入密钥
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBytes,
            { name: 'AES-CBC' },
            false,
            ['decrypt']
        );
        
        // 解密
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-CBC',
                iv: ivBytes
            },
            cryptoKey,
            encryptedBytes
        );
        
        return new Uint8Array(decrypted);
    } catch (error) {
        console.log('解密失败:'+ error);
        return null;
    }
}

// 尝试解压 Gzip
function tryGunzip(bytes) {
    try {
        // 检查是否是 gzip（前两个字节：1F 8B）
        if (bytes.length >= 2 && bytes[0] === 0x1F && bytes[1] === 0x8B) {
            // 需要 pako 库，如果没有加载则返回原数据
            if (typeof pako !== 'undefined') {
                return pako.inflate(bytes, { to: 'string' });
            }
        }
        // 如果不是 gzip 或 pako 不可用，直接转字符串
        return bytesToString(bytes);
    } catch (e) {
        return bytesToString(bytes);
    }
}

// 主函数
async function main() {
    // 获取响应数据
    const encryptedBase64 = $response.body;
    
    // Base64 解码
    const decodedStr = base64Decode(encryptedBase64);
    if (!decodedStr) {
        console.log('Base64 解码失败');
        return $done({});
    }
    
    // 转为字节数组
    const allBytes = stringToBytes(decodedStr);
    
    // 分离 IV 和密文
    const ivBytes = allBytes.slice(0, 16);      // 前16字节是IV
    const cipherBytes = allBytes.slice(16);     // 剩余是密文
    
    console.log('IV (hex):'+ bytesToHex(ivBytes));
    console.log('密文长度:'+ cipherBytes.length, '字节');
    
    // 常见密钥列表
    const commonKeys = [
        // AES-128 密钥（16字节）
        "0123456789ABCDEF",
        "1234567890123456",
        "ABCDEFGHIJKLMNOP",
        "abcdefghijklmnop",
        "0000000000000000",
        "1111111111111111",
        "2222222222222222",
        
        // 可能的 App 密钥
        "mobile_client_key",
        "android_app_key1",
        "ios_app_key_2024",
        "client_secret_16",
        
        // 其他
        "qwertyuiopasdfgh",
        "asdfghjklzxcvbnm",
        "zxcvbnmasdfghjkl",
        "password12345678",
        "encryptionkey01",
        "decryptionkey01"
    ];
    
    // 尝试每个密钥
    for (const keyStr of commonKeys) {
        // 确保密钥是16字节
        let finalKey = keyStr;
        if (keyStr.length > 16) finalKey = keyStr.substring(0, 16);
        if (keyStr.length < 16) finalKey = keyStr.padEnd(16, '0');
        
        const keyBytes = stringToBytes(finalKey);
        
        console.log(`尝试密钥: ${finalKey}`);
        
        try {
            // 解密
            const decryptedBytes = await decryptAES_CBC(cipherBytes, keyBytes, ivBytes);
            if (!decryptedBytes || decryptedBytes.length === 0) {
                continue;
            }
            
            // 尝试解压
            const decryptedText = tryGunzip(decryptedBytes);
            
            // 检查是否是 JSON
            if (decryptedText.includes('{') && decryptedText.includes('}')) {
                try {
                    // 尝试提取 JSON 部分
                    const jsonStart = decryptedText.indexOf('{');
                    const jsonEnd = decryptedText.lastIndexOf('}') + 1;
                    const jsonStr = decryptedText.substring(jsonStart, jsonEnd);
                    const jsonData = JSON.parse(jsonStr);
                    
                    console.log(`✅ 解密成功！密钥: ${finalKey}`);
                    
                    // 返回 JSON 格式的响应
                    return $done({
                        body: JSON.stringify(jsonData, null, 2),
                        headers: {
                            ...$response.headers,
                            'Content-Type': 'application/json; charset=UTF-8'
                        }
                    });
                } catch (e) {
                    // 不是有效的 JSON，但仍然返回解密结果
                    console.log('不是有效的 JSON，但已解密');
                }
            }
            
            // 如果解密出有意义的数据（长度合理）
            if (decryptedText.length > 10 && decryptedText.length < 10000) {
                console.log(`✅ 解密成功！密钥: ${finalKey}`);
                console.log(`前200字符: ${decryptedText.substring(0, 200)}`);
                
                return $done({
                    body: decryptedText,
                    headers: $response.headers
                });
            }
            
        } catch (error) {
            // 继续尝试下一个密钥
            console.log(`密钥 ${finalKey} 失败:`+ error.message);
            continue;
        }
    }
    
    // 如果所有密钥都失败
    console.log('所有常见密钥都失败了');
    
    // 保存原始信息供分析
    const analysisInfo = {
        iv: bytesToHex(ivBytes),
        cipherLength: cipherBytes.length,
        totalLength: allBytes.length,
        first16BytesOfCipher: bytesToHex(cipherBytes.slice(0, 16))
    };
    
    console.log('分析信息:'+ JSON.stringify(analysisInfo, null, 2));
    
    // 返回原始响应（不修改）
    return $done({});
}

// 执行主函数
try {
    main().catch(error => {
        console.log('脚本执行错误:'+ error);
        $done({});
    });
} catch (error) {
    console.log('脚本错误:'+ error);
    $done({});
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