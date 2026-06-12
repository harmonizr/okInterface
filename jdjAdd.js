(async () => {
    try {
        let i = Number($persistentStore.read("i")) || 0;
        let randomUA = "";
        let suffix = "";
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
        const uaList = [
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1"
        ];
        // 字符集：大小写字母 + 数字
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        // 后缀长度（和你示例一致：16位）
        const suffixLen = 16;
        
        for (let i = 0; i < suffixLen; i++) {
            const randomIdx = Math.floor(Math.random() * chars.length);
            suffix += chars[randomIdx];
        }
        //大于设置的次数重置i为0，换个uid,小于设置的次数，从$persistentStore.read拿之前的
        if(i>=$argument.times){
            i=0;
        }
        if(i==0){
            console.log("i==0....")
            randomUA = uaList[Math.floor(Math.random() * uaList.length)];
            suffix = "nid_"+suffix;

            let url = "https://acbull.site/api/jdj/set-display-name";
            let headers = {
                'origin':'https://acbull.site',
                'user-agent':randomUA,
                //'content-length':'20',
                'referer':'https://acbull.site/jdj/',
                'accept':'*/*',
                'sec-fetch-dest':'empty',
                'priority':'u=3, i',
                'sec-fetch-mode':'cors',
                'x-network-id':suffix,
                'sec-fetch-site':'same-origin',
                'content-type':'application/json',
                'accept-encoding':'gzip, deflate, br, zstd',
                'accept-language':'zh-CN,zh-Hans;q=0.9',
            };
            const nums = "0123456789";
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
            // 海量常用中文汉字（一级常用汉字）
            const chinese = `的一是在不了有和人这中大为上个国我以他来时用生到作地于出就分对成可主发年动同工也下能过子产种面而方后多行地然天于同民日事相处头里自合开两第如部现么事十全三使之行本就家风可到别外天四然二起新来数见民多三之入学道义都好然没明还同法如此各自其将两发然也用及时分然点生事分心几无前所手又行意方在多同行出当然如本力公然开但因其从而后可所之下十者行进着等度家电力里化如水自理小物现实加都两体制使日前下者高已理小物都加然大两本可下子自会和面年出然事也生方多行等分同出说同法家要时分三我成于可出对可其也下以然成可主发年动同工也下能过子产种面而方后多行地然天于同民日事相处头里自合开两第如部现么事十全三使之行本就家风可到别外天四然二起新来数见民多三之入学道义都好然没明还同法如此各自其将两发然也用及时分然点生事分心几无前所手又行意方在多同行出当然如本力公然开但因其从而后可所之下十者行进着等度家电力里化如水自理小物现实加都两体制使日前下者高已理小物都加然大两本可下子自会和面年出然事也生方多行等分同出说同法家要时分三我成于可出对可其也下以然成`;

            // 合并所有字符池
            const charPool = nums + letters + chinese;
            let name = "";

            for (let i = 0; i < 5; i++) {
                const idx = Math.floor(Math.random() * charPool.length);
                name += charPool[idx];
            }
            if($argument.name!=""){
                name = $argument.name
            }
            let body = {"displayName":name};
            var params = {
                url:url,
                timeout:5000,
                headers:headers,
                //alpn:'h2',
                body:JSON.stringify(body),
            };
            const getNameResp = await postRequest(params);
            const getNameJson = JSON.parse(getNameResp.body);
            if (getNameResp.resp.status !== 200) {
                throw new Error(`获取 name 失败: ${getNameJson.message}`);
            }
            console.log("请求name成功:"+getNameResp.body);


        }else{
            console.log("i!=0....")
            suffix = $persistentStore.read("suffix");
            randomUA = $persistentStore.read("randomUA");

        }
        
        console.log("start init.....")

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
            name = initJson.data.list[i].publisherDisplayName;
            if(initJson.data.list[i].publisherNoHelpCount>0){
                if($argument.times>0 && initJson.data.list[i].id == $persistentStore.read("id")){//当账号没重置时，避免助力到上次链接，所以跳过换新链接
                    continue;
                }
                id = initJson.data.list[i].id;
                name = initJson.data.list[i].publisherDisplayName;
                Flag = false;
            }
        }



        
        //let id = $argument.helpId;
        if(initJson.data.checkSubmit.compensationActive == true){
            console.log("无限补偿中........")
            //就是先助力了，i+1了，再补偿的话i！=0了，suffix会用旧的，所以要重新赋值
            randomUA = uaList[Math.floor(Math.random() * uaList.length)];
            suffix = "nid_"+suffix;
            console.log(suffix)
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
            if(Flag ==true){
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
            $persistentStore.write(id, "id");
            $persistentStore.write(i + 1, "i");
            $persistentStore.write(randomUA, "randomUA");
            $persistentStore.write(suffix, "suffix");
        }

        if(i==0||initJson.data.checkSubmit.compensationActive == true){
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
            let tjbUrlList = [$argument.tjbUrl,$argument.tjbUrl2,$argument.tjbUrl3,,$argument.tjbUrl4,$argument.tjbUrl5,$argument.tjbUrl6];
            let randomTjbUrl = tjbUrlList[Math.floor(Math.random() * tjbUrlList.length)];

            let inviteBody = {
                link: randomTjbUrl,
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
           //无限补偿要重置账号，一个账号只能提交一次
           if(initJson.data.checkSubmit.compensationActive == true){
                $persistentStore.write(0, "i");
           }

            $done(); // 只调用一次，结束脚本
        }else{
           
            $done(); // 只调用一次，结束脚本
        }

    } catch (err) {
        console.log("脚本异常:"+err);
        $notification.post("脚本异常", "", err.message);
        $done();
    }
})();