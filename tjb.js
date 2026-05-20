/**
 * 优化版 Loon/Quantumult X 脚本
 * 支持：
 * - 随机 UA / Accept-Language / UUID
 * - 两个 URL 交替请求或随机请求
 * - page_token 获取后再发主请求
 * - 正确使用 async/await，不会卡住
 */

(async () => {
    try {
        const url = "https://cv.intgold.cn/api/quan/v1/boards/tjb/entries";

        // 生成 UUID v4
        const chars = "0123456789abcdef";
        let uuid = "";
        for (let i = 0; i < 36; i++) {
            if (i === 8 || i === 13 || i === 18 || i === 23) uuid += "-";
            else if (i === 14) uuid += "4";
            else if (i === 19) uuid += chars[Math.floor(Math.random() * 4) + 8];
            else uuid += chars[Math.floor(Math.random() * 16)];
        }

        // 随机 UA & Accept-Language
        const uaList = [
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1"
        ];
        const randomUA = uaList[Math.floor(Math.random() * uaList.length)];

        const langList = ["zh-CN,zh;q=0.9", "zh-CN,zh;q=0.85", "zh-CN,zh;q=0.8"];
        const randomLang = langList[Math.floor(Math.random() * langList.length)];

        // URL 选择逻辑
        let tjbUrl = $argument.tjbUrl;
        let i = Number($persistentStore.read("i")) || 0;

        if ($argument.isOne === "链接2") {
            tjbUrl = $argument.tjbUrl2;
        }

        if ($argument.isRandom === true) {
            const tjbUrlList = [$argument.tjbUrl, $argument.tjbUrl2];
            tjbUrl = tjbUrlList[i % 2];
        }

        const body = {
            raw_text: tjbUrl,
            agreed: true,
            extra_email: "",
            max_use_times: 1
        };

        // 封装 $httpClient.post 为 Promise
        function postRequest(params) {
            return new Promise((resolve, reject) => {
                $httpClient.post(params, (err, resp, body) => {
                    if (err) return reject(err);
                    resolve({ resp, body });
                });
            });
        }

        // 获取 page_token
        const getTokeUrl = "https://cv.intgold.cn/api/web-security/page-token";
        const getTokeParams = {
            url: getTokeUrl,
            timeout: 5000,
            headers: {
                'content-type': 'application/json',
                'accept': 'application/json',
                'sec-fetch-dest': 'empty',
                'user-agent': randomUA,
                'referer': 'https://cv.intgold.cn/b/tjb',
                'origin': 'https://cv.intgold.cn',
                'sec-fetch-mode': 'cors',
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept-language': randomLang,
                'priority': 'u=3, i',
            },
            body: "{}"
        };

        const tokenResp = await postRequest(getTokeParams);
        const tokenJson = JSON.parse(tokenResp.body);

        if (tokenJson.code !== 200) {
            throw new Error(`获取 page_token 失败: ${tokenJson.message}`);
        }

        const pageToken = tokenJson.data.token;
        console.log("pageToken"+pageToken)

        // 准备主请求
        const params = {
            alpn:'h2',
            url: url,
            timeout: 5000,
            headers: {
                'priority': 'u=3, i',
                'origin': 'https://cv.intgold.cn',
                'content-type': 'application/json',
                'accept-language': randomLang,
                'x-copygo-display-name': "v_" + uuid.split("-")[0],
                'x-copygo-client-key': uuid,
                'user-agent': randomUA,
                'accept-encoding': 'gzip, deflate, br, zstd',
                'accept': 'application/json',
                'x-copygo-page_token': pageToken,

                'sec-fetch-site':'same-origin',
                'sec-fetch-mode':'cors',
                'content-length':'138',
                'referer':'https://cv.intgold.cn/b/tjb',
                'accept':'application/json',
                'sec-fetch-dest':'empty'
            },
            body: JSON.stringify(body)
        };

        const mainResp = await postRequest(params);
        const mainJson = JSON.parse(mainResp.body);
        console.log("mainJson"+mainJson);
        if (mainJson.code !== 200) {
            throw new Error(`提交失败: ${mainJson.message}`);
        }

        console.log("请求成功:"+mainResp.body);

        // 随机模式计数器更新
        if ($argument.isRandom === true) {
            $persistentStore.write(i + 1, "i");
        }

        $done(); // 只调用一次，结束脚本

    } catch (err) {
        console.log("脚本异常:"+err.message);
        if ($argument.isRandom === true) {
            $persistentStore.write(1, "stop");
        }
        $notification.post("脚本异常", "", err.message);
        $done({ disable: true });
    }
})();