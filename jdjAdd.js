(async () => {
    try {
        let i = Number($persistentStore.read("i")) || 0;
        //大于三次重置i为0，换个uid,小于三次，从$persistentStore.read拿之前的
        if(i>=3){
            i=0;
        }
        if(i==0){
            const uaList = [
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1",
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1"
            ];
            const randomUA = uaList[Math.floor(Math.random() * uaList.length)];

            // 字符集：大小写字母 + 数字
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            // 后缀长度（和你示例一致：16位）
            const suffixLen = 16;
            let suffix = '';
            
            for (let i = 0; i < suffixLen; i++) {
                const randomIdx = Math.floor(Math.random() * chars.length);
                suffix += chars[randomIdx];
            }
            suffix = "nid_"+suffix;
        }else{
            suffix = $persistentStore.read("suffix");
            randomUA = $persistentStore.read("randomUA");

        }
  

        // 封装 $httpClient.post 为 Promise
        function postRequest(params) {
            return new Promise((resolve, reject) => {
                $httpClient.post(params, (err, resp, body) => {
                    if (err) return reject(err);
                    resolve({ resp, body });
                });
            });
        }
        function getRequest(params) {
            return new Promise((resolve, reject) => {
                $httpClient.get(params, (err, resp, body) => {
                    if (err) return reject(err);
                    resolve({ resp, body });
                });
            });
        }
     

        console.log("start init.....")
        let firstUrl = "https://acbull.site/api/jdj/init";


        let url = "https://acbull.site/api/jdj/init";
        let headers = {
            'user-agent': randomUA,
            'sec-fetch-dest':'empty',
            'accept-language':'zh-CN,zh-Hans;q=0.9',
            'sec-fetch-mode':'cors',
            'x-network-id': suffix,
            'priority':'u=3, i',
            'accept':'*/*',
            'referer':'https://acbull.site/jdj/',
            'accept-encoding':'gzip, deflate, br, zstd',
            'sec-fetch-site':'same-origin',
        };

        var initParams = {
            url:url,
            timeout:5000,
            headers:headers,
            alpn:'h2',
        };

        var firstParams = {
            url:firstUrl,
            timeout:5000,
            headers:headers,
            alpn:'h2',
        };
  
        const initResp = await getRequest(initParams);

        //console.log("initResp..."+JSON.stringify(initResp))
        const initJson = JSON.parse(initResp.body);
       

        if (initResp.resp.status !== 200) {
            throw new Error(`获取 init 失败: ${initJson.message}`);
        }
        let Flag =  true;

        let id = initJson.data.list[0].id;
        let name = initJson.data.list[0].publisherDisplayName;
        for(let i in initJson.data.list){
            if(initJson.data.list[i].full == true){
                continue;
            }
            if(initJson.data.list[i].publisherNoHelpCount>0){
                id = initJson.data.list[i].id;
                name = initJson.data.list[i].publisherDisplayName;
                flag = false;
            }
        }
        //let id = $argument.helpId;
        if(initJson.data.checkSubmit.compensationActive == true){
            console.log("无限补偿中........")
        }else{
            console.log("start help.....")
            let helpUrl = "https://acbull.site/api/jdj/invite-links/"+id+"/used";
            console.log(helpUrl)
            let helpHeaders = {
                'accept-encoding':'gzip, deflate, br, zstd',
                'accept':'*/*',
                'sec-fetch-mode':'cors',
                'sec-fetch-site':'same-origin',
                'sec-fetch-dest':'empty',
                'x-network-id': suffix,
                'content-length':'0',
                'origin':'https://acbull.site',
                'user-agent':randomUA,
                'referer':'https://acbull.site/jdj/',
                'priority':'u=3, i',
                'accept-language':'zh-CN,zh-Hans;q=0.9',
            };

            var helpParams = {
                url:helpUrl,
                timeout:5000,
                headers:helpHeaders,
                alpn:'h2',
            };


            const helpResp = await postRequest(helpParams);
            const helpJson = JSON.parse(helpResp.body);
            console.log(suffix)
            if(flag ==true){
                console.log("助力正常链接....")
            }else{
                console.log("助力不良链接....")
            }
            console.log(name)
            console.log(helpJson)

            if (helpJson.success !== true) {
                throw new Error(`提交失败: ${helpJson.message}`);
            }

            console.log("请求成功:"+helpResp.body);
        }
        console.log("invite........")
        let inviteUrl = "https://acbull.site/api/jdj/invite-links";

        let inviteHeaders = {
            'accept':'*/*',
            'sec-fetch-site':'same-origin',
            'accept-encoding':'gzip, deflate, br, zstd',
            'priority':'u=3, i',
            //'content-length':'101',
            'user-agent':randomUA,
            'accept-language':'zh-CN,zh-Hans;q=0.9',
            'referer':'https://acbull.site/jdj/',
            'sec-fetch-mode':'cors',
            'origin':'https://acbull.site',
            'x-network-id':suffix,
            'content-type':'application/json',
            'sec-fetch-dest':'empty',
        };
        console.log($argument.tjbUrl)
        let inviteBody = {
            link: $argument.tjbUrl,
            maxHelp:10
        };

        var inviteParams = {
            url:inviteUrl,
            timeout:5000,
            headers:inviteHeaders,
            
            //alpn:'h2',
            body:JSON.stringify(inviteBody),
        };
             
        const inviteResp = await postRequest(inviteParams);
         
        console.log("inviteResp........")
        console.log(JSON.stringify(inviteResp))
        const inviteJson = JSON.parse(inviteResp.body);


        if (inviteResp.resp.status !== 200) {
            throw new Error(`提交失败: ${inviteJson.message}`);
        }

        console.log("请求成功:"+inviteResp.body);

        $persistentStore.write(i + 1, "i");
        $persistentStore.write(randomUA, "randomUA");
        $persistentStore.write(suffix, "suffix");

        $done(); // 只调用一次，结束脚本

    } catch (err) {
        console.log("脚本异常:"+err);
        $notification.post("脚本异常", "", JSON.stringify(err));
        $done();
    }
})();