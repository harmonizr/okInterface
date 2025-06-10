const url = $request.url;
const headers = $request.headers;

// 移除广告请求
if (url.includes("/ad/")) {
    $done({ status: 404 });
    return;
}

// 设置必要的请求头
if (headers) {
    headers["x-real-ip"] = "118.88.88.88";
    headers["x-forwarded-for"] = "118.88.88.88";
    headers["x-client-ip"] = "118.88.88.88";
    headers["client-ip"] = "118.88.88.88";
    headers["appver"] = "8.10.90";
    headers["buildver"] = "810901";
    headers["mobilename"] = "iPhone15,2";
    headers["channel"] = "appstore";
    headers["resolution"] = "1170*2532";
    headers["User-Agent"] = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 NeteaseMusic/8.10.901 (iPhone; iOS 16.6; Scale/3.00)";
    
    // 添加 VIP Cookies
    if (!headers["Cookie"]) headers["Cookie"] = "";
    headers["Cookie"] += "; __csrf=; MUSIC_U=; __remember_me=true";
}

$done({ headers });