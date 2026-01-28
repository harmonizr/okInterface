// 文件名：aes-cbc-decrypt.js
// 完整解密脚本

// 你的两个加密数据（用于测试对比）
const testData1 = "XbmowmS5UVdAYgX4BLaKkQEj8mitJT7CFurdDJ0sJkshJaSeOgLQC9nSsGU/dJWBO0iCxUBVZ3yD2ed58ATddmN3swV4TKvx5vVF7MDKp9me0nyA0m/52tEJYhKMwR9bplVBSSDf42fXrN7nZiV2lEymA/Lbe1FRGEZXiiRpQXFebxEhLnEOYjsGqtHz8xPAHWFqkP6nCdti1PT4eP8zIwdZpPIHR4UjV0Y/S0umKyswsHJIy8cJ+l2N3C03munSu0mEQT6Mwmu5p5T+WzSBzFofAxzer+jr5aGlQKywLuQenhXV7gDow6PllxLCLk/3RqkneZmy07N7kh9Tveqvw5m+7rviKVExbovSBwAhnoat4QiJvDUVHrXQpVwFnwUd+E7WUtFcMsCpIAZ/8hF8bszxNvkTPkNQLYNzrB0/rU1e1Dswcg0ZYkOORWqDIZW7VRjfEtL83rxzlhW1PQHGhoY772lVXGnpsepPQ3uWaHto127HuFqVCXKKyMMK7z1Nf9UFAh6IJemPUmySUh/p26FnQStp52/ZE0/2b1DexfI3uibqp7ykK0YcDUrsScAZzMSjuKCHd+sT4/MunVKB1prY5I5Abq6TV1HLagc8LUE2cYlu0fa0wB4weckjBa1BZgHmgotNSG5WNj8ce1JYgU+GiyVLcp63dcOMic9TwQYhanWMSw4yEA8cTQf8HpsXXS0OYhkXasQbN3C8ilLzrUmMlmU7J9dODeCngKJvK00q2/AgYolVc/2ElyByo08obUHqes9xP3F6pqo+odki9/3lxPIEmDNGqyW3B4Oovuif34WprkWZVpvOPAZGl/NblLbHoCSFYzD3EAVe3MBk6P/wWq0ZsHOpFQ7AwqVf271PG8Ma7Wk5XBrYxEAvTOl+ZgS9VFeGvfWMjtpGhDTu19aMZ+pozpFpx+pho5lUa0QPjDGDw/krdfxKbmVdRw7L4UDcUxzNB69pbUHlu2z3KjqJzH+9pWKj2g342f7/Bh+IeBgwOVYdDqx7GeKX578fE3pyOekZ/ciWyDuZmT8lRSj7ZGpj+hfoET3GA+3HZbwrRYdmx6yT5fKE3YO7L9LlSwjeiOMy+ja2W7IcVHStxVvY2tvQIOjH68F3yK+fiy5K8JFc78CLXXWabRKEbjYfWeFhNk7N8d5VZPr04rkVoU8xPn810AyhtLCmEwkPqme6N+uQ6t9xsv+y4mkqtza59zj7kSoSyrx34vFwxa6IC0Vj7cB0ggU4GvyorqcCZjwTw44txJP7rLF4I17vVecQjs8WPY3C6/2FUxyj/bo4XyTkgxLywJlc8hnVk6SEpIxceITqC2rHeMVMPV1C1Zmx4ZHLkkCkhnVk3I7i8a9mIbWVeML2umgNmDmrhbyhs93dkakRhIE7QUwieYyClCD/cfMZjnQJAs9hhTduyUBrw0DbiAdVAjpsNhegOyFJmskxSDapBb0xtwsNgAB+2vKXMHMgH09jNW3wh66GWH6om43LI0CccSqe+Pnth+4XGTaS30gmz0jg99n6rXmUguylqvnK1WvvMf53tIArvXpD7iPqJ4Kf3Uu925toZexy36Paa6u7tbcsAHgJ5ozvJOK8";
const testData2 = "XbmowmS5UVdAYgX4BLaKkRDfIny6wsmMPbsInd51M+f9Zl/KaBYdLQhYGvNv/alQO0iCxUBVZ3yD2ed58ATddmN3swV4TKvx5vVF7MDKp9me0nyA0m/52tEJYhKMwR9bplVBSSDf42fXrN7nZiV2lEymA/Lbe1FRGEZXiiRpQXFebxEhLnEOYjsGqtHz8xPAHWFqkP6nCdti1PT4eP8zIwdZpPIHR4UjV0Y/S0umKyswsHJIy8cJ+l2N3C03munSu0mEQT6Mwmu5p5T+WzSBzFofAxzer+jr5aGlQKywLuQenhXV7gDow6PllxLCLk/3RqkneZmy07N7kh9Tveqvw5m+7rviKVExbovSBwAhnoat4QiJvDUVHrXQpVwFnwUd+E7WUtFcMsCpIAZ/8hF8bszxNvkTPkNQLYNzrB0/rU1e1Dswcg0ZYkOORWqDIZW7VRjfEtL83rxzlhW1PQHGhoY772lVXGnpsepPQ3uWaHto127HuFqVCXKKyMMK7z1Nf9UFAh6IJemPUmySUh/p26FnQStp52/ZE0/2b1DexfI3uibqp7ykK0YcDUrsScAZzMSjuKCHd+sT4/MunVKB1prY5I5Abq6TV1HLagc8LUE2cYlu0fa0wB4weckjBa1BZgHmgotNSG5WNj8ce1JYgU+GiyVLcp63dcOMic9TwQYhanWMSw4yEA8cTQf8HpsXXS0OYhkXasQbN3C8ilLzrUmMlmU7J9dODeCngKJvK00q2/AgYolVc/2ElyByo08obUHqes9xP3F6pqo+odki9/3lxPIEmDNGqyW3B4Oovuif34WprkWZVpvOPAZGl/NblLbHoCSFYzD3EAVe3MBk6P/wWq0ZsHOpFQ7AwqVf271PG8Ma7Wk5XBrYxEAvTOl+ZgS9VFeGvfWMjtpGhDTu19aMZ+pozpFpx+pho5lUa0QPjDGDw/krdfxKbmVdRw7L4UDcUxzNB69pbUHlu2z3KjqJzH+9pWKj2g342f7/Bh+IeBgwOVYdDqx7GeKX578fE3pyOekZ/ciWyDuZmT8lRSj7ZGpj+hfoET3GA+3HZbwrRYdmx6yT5fKE3YO7L9LlSwjeiOMy+ja2W7IcVHStxVvY2tvQIOjH68F3yK+fiy5K8JFc78CLXXWabRKEbjYfWeFhNk7N8d5VZPr04rkVoU8xPn810AyhtLCmEwkPqme6N+uQ6t9xsv+y4mkqtza59zj7kSoSyrx34vFwxa6IC0Vj7cB0ggU4GvyorqcCZjwTw44txJP7rLF4I17vVecQjs8WPY3C6/2FUxyj/bo4XyTkgxLyyJlc8hnVk6SEpIxceITqC2rHeMVMPV1C1Zmx4ZHLkkCkhnVk3I7i8a9mIbWVeML2umgNmDmrhbyhs93dkakRhIE7QUwieYyClCD/cfMZjnQJAs9hhTduyUBrw0DbiAdVAjpsNhegOyFJmskxSDapBb0xtwsNgAB+2vKXMHMgH09jNW3wh66GWH6om43LI0CccSqe+Pnth+4XGTaS30gmz0jg99n6rXmUguylqvnK1WpvMf53tIArvXpD7iPqJ4Kf3Uu925toZexy36NJVUDlCUsnc7cs1YnKgxJ3";

// Base64 解码并分离 IV 和密文
function splitIVAndCipher(base64Data) {
    const bytes = $data.fromBase64(base64Data).bytes;
    const iv = bytes.slice(0, 16);      // 前16字节是IV
    const cipher = bytes.slice(16);     // 剩余是密文
    return { iv, cipher };
}

// 解密函数
async function decryptAES_CBC(cipherBytes, keyBytes, ivBytes) {
    try {
        const decrypted = $crypto.decrypt({
            data: cipherBytes,
            algorithm: 'AES-CBC',
            key: keyBytes,
            iv: ivBytes
        });
        return $data.fromBytes(decrypted);
    } catch (error) {
        console.log('解密失败:', error);
        return null;
    }
}

// 尝试常见密钥进行解密
const commonKeys = [
    // 16字节 AES-128 密钥
    "0123456789ABCDEF",
    "1234567890123456",
    "ABCDEFGHIJKLMNOP",
    "abcdefghijklmnop",
    "0000000000000000",
    
    // 可能的应用密钥
    "mobile_client_key",
    "android_app_key1",
    "ios_app_key_2024",
    "client_secret_16",
    
    // 其他常见密钥
    "qwertyuiopasdfgh",
    "asdfghjklzxcvbnm",
    "zxcvbnmasdfghjkl",
    "password12345678"
];

// 主解密函数
async function main() {
    const encryptedBase64 = $response.body;
    
    // 分离IV和密文
    const { iv, cipher } = splitIVAndCipher(encryptedBase64);
    console.log('IV (hex):'+ $data.fromBytes(iv).toHex());
    console.log('密文长度:'+ cipher.length, '字节');
    
    // 尝试每个密钥
    for (const keyStr of commonKeys) {
        if (keyStr.length < 16) continue;
        
        // 如果密钥不是16字节，补齐或截断
        let finalKey = keyStr;
        if (keyStr.length > 16) finalKey = keyStr.substring(0, 16);
        if (keyStr.length < 16) finalKey = keyStr.padEnd(16, '0');
        
        const keyBytes = $data.fromUTF8(finalKey).bytes;
        
        console.log(`尝试密钥: ${finalKey}`);
        
        try {
            // 解密
            const decryptedData = await decryptAES_CBC(cipher, keyBytes, iv);
            if (!decryptedData) continue;
            
            // 尝试解压（如果是压缩的）
            let text;
            try {
                const decompressed = decryptedData.gunzip();
                text = decompressed.toUTF8();
            } catch (e) {
                // 如果不是压缩的，直接转为UTF-8
                text = decryptedData.toUTF8();
            }
            
            console.log(`解密结果前100字符: ${text.substring(0, 100)}`);
            
            // 检查是否是JSON
            if (text.includes('{') && text.includes('}')) {
                try {
                    const jsonStart = text.indexOf('{');
                    const jsonEnd = text.lastIndexOf('}') + 1;
                    const jsonStr = text.substring(jsonStart, jsonEnd);
                    const jsonData = JSON.parse(jsonStr);
                    
                    console.log(`✅ 解密成功！密钥: ${finalKey}`);
                    
                    $done({
                        body: JSON.stringify(jsonData, null, 2),
                        headers: {
                            ...$response.headers,
                            'Content-Type': 'application/json; charset=UTF-8'
                        }
                    });
                    return;
                } catch (e) {
                    console.log('JSON解析失败，但数据已解密');
                }
            }
            
            // 如果不是JSON，也返回结果
            if (text.length > 10) {
                console.log(`✅ 解密成功（非JSON）! 密钥: ${finalKey}`);
                $done({ body: text });
                return;
            }
            
        } catch (error) {
            // 继续尝试下一个密钥
            continue;
        }
    }
    
    // 如果所有密钥都失败，尝试暴力破解
    console.log('常见密钥都失败了，尝试模式分析...');
    
    // 保存原始数据供进一步分析
    const analysis = {
        iv: $data.fromBytes(iv).toHex(),
        ciphertext: $data.fromBytes(cipher).toHex().substring(0, 100) + '...',
        totalLength: encryptedBase64.length,
        cipherLength: cipher.length
    };
    
    console.log('分析信息:'+ JSON.stringify(analysis, null, 2));
    
    $done({});
}

// 运行主函数
main().catch(error => {
    console.log('脚本执行错误:'+error);
    $done({});
});

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