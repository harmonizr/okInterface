// 文件名：decrypt-with-$crypto.js
// 使用 Loon 内置的 $crypto 对象解密

// 分析数据并尝试解密
function analyzeAndDecrypt() {
    const encryptedBase64 = $response.body;
    
    console.log('=== 开始解密 ===');
    console.log('加密数据长度:'+encryptedBase64.length);
    
    try {
        // 1. Base64 解码
        const decodedStr = atob(encryptedBase64);
        console.log('Base64解码后长度:'+ decodedStr.length, '字节');
        
        // 2. 分离 IV 和密文（前16字节是IV）
        const ivHex = [];
        for (let i = 0; i < 16; i++) {
            ivHex.push(decodedStr.charCodeAt(i).toString(16).padStart(2, '0'));
        }
        const iv = ivHex.join('');
        console.log('IV (hex):'+ iv);
        
        // 3. 提取密文部分
        const ciphertext = decodedStr.substring(16);
        console.log('密文长度:'+ ciphertext.length, '字节');
        
        // 4. 常见密钥列表
        const commonKeys = [
            // 16字节 AES-128 密钥
            "0123456789ABCDEF",
            "1234567890123456",
            "ABCDEFGHIJKLMNOP",
            "abcdefghijklmnop",
            "0000000000000000",
            "1111111111111111",
            
            // 可能的 App 密钥
            "mobile_client_key",
            "android_app_key1",
            "ios_app_key_2024",
            "client_secret_16",
            
            // 基于分析的密钥猜测
            "5db9a8c264b95157",  // IV 的前半部分
            "406205f804b68a91",  // IV 的后半部分
            "5db9a8c264b95157 406205f804b68a91", // 完整IV
            "b68a915db9a8c264",  // IV 的变体
        ];
        
        // 5. 尝试使用每个密钥解密
        for (const key of commonKeys) {
            console.log(`尝试密钥: ${key}`);
            
            try {
                // 使用 Loon 的 $crypto 解密
                // 注意：Loon 的 $crypto.AES.decrypt 可能需要特定格式
                const decrypted = $crypto.AES.decrypt({
                    data: ciphertext,
                    key: key,
                    iv: iv,
                    mode: 'cbc',
                    padding: 'pkcs7'
                });
                
                if (decrypted && decrypted.length > 0) {
                    console.log(`解密成功！密钥: ${key}`);
                    console.log(`解密结果长度: ${decrypted.length}`);
                    
                    // 尝试转换为字符串
                    let resultStr;
                    try {
                        // 如果是字节数组，转换为字符串
                        if (typeof decrypted === 'object' && decrypted.byteLength) {
                            resultStr = String.fromCharCode.apply(null, new Uint8Array(decrypted));
                        } else {
                            resultStr = decrypted.toString();
                        }
                        
                        console.log(`前100字符: ${resultStr.substring(0, 100)}`);
                        
                        // 检查是否是 JSON
                        if (resultStr.includes('{') && resultStr.includes('}')) {
                            try {
                                const jsonData = JSON.parse(resultStr);
                                return {
                                    success: true,
                                    key: key,
                                    data: JSON.stringify(jsonData, null, 2)
                                };
                            } catch (e) {
                                return {
                                    success: true,
                                    key: key,
                                    data: resultStr
                                };
                            }
                        }
                        
                        return {
                            success: true,
                            key: key,
                            data: resultStr
                        };
                        
                    } catch (e) {
                        console.log('转换字符串失败:'+ e);
                    }
                }
            } catch (error) {
                // 继续尝试下一个密钥
                console.log(`密钥 ${key} 失败: ${error.message}`);
            }
        }
        
        return { success: false, error: '所有密钥尝试失败' };
        
    } catch (error) {
        console.log('处理过程出错:', error);
        return { success: false, error: error.message };
    }
}

// 主函数
function main() {
    const result = analyzeAndDecrypt();
    
    if (result.success) {
        console.log(`✅ 解密成功！使用的密钥: ${result.key}`);
        
        // 返回解密后的响应
        $done({
            body: result.data,
            headers: {
                ...$response.headers,
                'Content-Type': 'application/json; charset=UTF-8'
            }
        });
    } else {
        console.log('❌ 解密失败:'+ result.error);
        
        // 返回分析信息
        $done({
            body: JSON.stringify({
                error: '解密失败',
                message: result.error,
                original_length: $response.body.length
            }, null, 2),
            headers: {
                ...$response.headers,
                'Content-Type': 'application/json'
            }
        });
    }
}

// 执行
main();


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