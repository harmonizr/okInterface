 // 基于 accessToken 的 AES 解密方案
const body = $response.body;

console.log('基于 accessToken 的 AES 解密');
console.log('原始 Base64 长度: ' + body.length);
console.log('access_token: ' + $request);

try {
    // 1. 获取 accessToken（从不同位置尝试）
    let accessToken =  $response.accessToken;
    
    // 方法1：从请求头获取
    const authHeader = $request.headers['Authorization'] || $request.headers['authorization'];
    if (authHeader && authHeader.includes('Bearer ')) {
        accessToken = authHeader.split('Bearer ')[1];
        console.log('从 Authorization 头获取 token: ' + accessToken.substring(0, 20) + '...');
    }
    
    // 方法2：从 URL 参数获取
    if (!accessToken) {
        const url = new URL($request.url);
        accessToken = url.searchParams.get('accessToken') || 
                      url.searchParams.get('access_token') || 
                      url.searchParams.get('token');
        if (accessToken) {
            console.log('从 URL 参数获取 token: ' + accessToken.substring(0, 20) + '...');
        }
    }
    
    // 方法3：从请求体获取（如果是 POST）
    if (!accessToken && $request.body) {
        try {
            const bodyJson = JSON.parse($request.body);
            accessToken = bodyJson.accessToken || bodyJson.access_token || bodyJson.token;
            if (accessToken) {
                console.log('从请求体获取 token: ' + accessToken.substring(0, 20) + '...');
            }
        } catch (e) {
            // 不是 JSON 格式
        }
    }
    
    if (!accessToken) {
        console.log('❌ 未找到 accessToken');
        console.log('请求头: ' + JSON.stringify($request.headers));
        console.log('请求 URL: ' + $request.url);
        $done();
        return;
    }
    
    // 2. 从 accessToken 生成密钥和 IV
    const { key, iv } = generateKeyFromToken(accessToken);
    console.log('生成的密钥长度: ' + key.length);
    console.log('生成的 IV 长度: ' + iv.length);
    console.log('密钥预览: ' + key.substring(0, 16));
    console.log('IV 预览: ' + iv);
    
    // 3. Base64 解码
    const decoded = atob(body);
    console.log('Base64 解码成功，长度: ' + decoded.length + ' 字节');
    
    // 4. 尝试解密
    let decrypted = null;
    
    if (typeof CryptoJS !== 'undefined') {
        try {
            const ciphertext = CryptoJS.enc.Latin1.parse(decoded);
            const cryptoKey = CryptoJS.enc.Utf8.parse(key);
            const cryptoIv = CryptoJS.enc.Utf8.parse(iv);
            
            const decryptedData = CryptoJS.AES.decrypt(
                { ciphertext: ciphertext },
                cryptoKey,
                { 
                    iv: cryptoIv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }
            );
            
            decrypted = decryptedData.toString(CryptoJS.enc.Utf8);
            
            if (!decrypted) {
                throw new Error('解密结果为空');
            }
            
            console.log('✅ 解密成功，长度: ' + decrypted.length);
        } catch (cryptoError) {
            console.log('CryptoJS 解密失败: ' + cryptoError.message);
        }
    }
    
    if (decrypted) {
        // 5. 尝试解析 JSON
        try {
            const jsonData = JSON.parse(decrypted);
            console.log('✅ JSON 解析成功');
            
            $done({
                headers: {
                    ...$response.headers,
                    'Content-Type': 'application/json; charset=utf-8'
                },
                body: JSON.stringify(jsonData, null, 2)
            });
        } catch (jsonError) {
            console.log('解密后不是 JSON，内容: ' + decrypted.substring(0, 200));
            $done({body: decrypted});
        }
    } else {
        console.log('❌ 解密失败，保存信息供分析');
        saveDecryptionInfo(body, accessToken, key, iv, decoded);
        $done();
    }
    
} catch (error) {
    console.log('❌ 处理失败: ' + error.message);
    $done();
}

// 从 accessToken 生成密钥和 IV 的函数
function generateKeyFromToken(token) {
    console.log('Token 原始长度: ' + token.length);
    
    // 常见的密钥生成方式：
    // 1. 直接使用 token 作为密钥（如果长度合适）
    // 2. 取 token 的一部分
    // 3. 对 token 进行 MD5/SHA256 哈希
    // 4. Base64 解码 token
    
    const results = [];
    
    // 方案1：直接使用（如果长度是16/24/32）
    if (token.length === 16 || token.length === 24 || token.length === 32) {
        results.push({
            key: token,
            iv: token.substring(0, 16)  // 取前16位作为IV
        });
    }
    
    // 方案2：取前16/24/32位作为密钥
    if (token.length >= 32) {
        results.push({
            key: token.substring(0, 32),
            iv: token.substring(16, 32)
        });
    }
    if (token.length >= 24) {
        results.push({
            key: token.substring(0, 24),
            iv: token.substring(8, 24)
        });
    }
    if (token.length >= 16) {
        results.push({
            key: token.substring(0, 16),
            iv: token.substring(0, 16)
        });
    }
    
    // 方案3：对 token 进行 MD5（如果 CryptoJS 可用）
    if (typeof CryptoJS !== 'undefined') {
        const md5Hash = CryptoJS.MD5(token).toString();
        results.push({
            key: md5Hash.substring(0, 16),
            iv: md5Hash.substring(16, 32)
        });
        
        // SHA256
        const sha256Hash = CryptoJS.SHA256(token).toString();
        results.push({
            key: sha256Hash.substring(0, 32),
            iv: sha256Hash.substring(32, 48)
        });
    }
    
    // 方案4：尝试 Base64 解码 token
    try {
        const decodedToken = atob(token);
        if (decodedToken.length >= 16) {
            results.push({
                key: decodedToken.substring(0, 16),
                iv: decodedToken.substring(0, 16)
            });
        }
    } catch (e) {
        // token 可能不是 Base64
    }
    
    // 返回第一个方案（你可以修改这里尝试所有方案）
    return results[0] || { key: token.substring(0, 16), iv: token.substring(0, 16) };
}

function saveDecryptionInfo(body, token, key, iv, decoded) {
    const info = {
        timestamp: new Date().toISOString(),
        url: $request.url,
        token_preview: token.substring(0, 20) + '...',
        token_length: token.length,
        key: key,
        iv: iv,
        key_length: key.length,
        iv_length: iv.length,
        encrypted_data_length: body.length,
        decrypted_data_length: decoded.length,
        first_16_bytes: Array.from(decoded.substring(0, 16)).map(c => 
            ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(' ')
    };
    
    $persistentStore.write(JSON.stringify(info, null, 2), 'decryption_info');
    console.log('解密信息已保存');
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