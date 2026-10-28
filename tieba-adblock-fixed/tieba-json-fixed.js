(function(){
const url = $request.url;
const method = $request.method;
const postMethod = "POST";

console.log(`贴吧json-2026.10.28 fixed`);

// 非200响应（网关错误页/限流等）一律原样放行，绝不改写
const resStatus = $response.status ? $response.status : $response.statusCode;
if (resStatus !== 200) {
    console.log(`贴吧json:status=${resStatus},原样放行`);
    $done({});
}

let body;
try {
    body = JSON.parse($response.body);
} catch (error) {
    // 响应体不是合法JSON（空体/HTML错误页/非JSON接口）时原样放行，避免中断请求
    console.log('贴吧json:响应体解析失败,原样放行:' + (error && error.message ? error.message : error));
    $done({});
    return;
}

let modified = false;

if (url.includes("c/f/ad/getSplashAd")) {
    if (body.error_code === 0) {
        console.log(`去除开屏广告:${body.error_code}`);
        body.error_code = 2230209;
        body.data = null;
        modified = true;
    } else {
        console.log(`无需处理开屏广告:${body.error_code}`);
    }
} else if (url.includes("tiebaads/commonbatch") && method === postMethod) {
    // 看图模式下的广告
    let adCmd = getUrlParamValue(url, "adcmd");
    if (!adCmd) {
        console.log(`url:${url}`);
    } else {
        console.log(`commonbatch:${adCmd}`);
        if (body.error_code === 0) {
            if (!body.res?.ad?.length) {
                console.log('ad字段为空');
            } else {
                body.res.ad = [];
                // 即使ad有内容 也不一定显示广告
                // 因为如果服务器下发的数据少了一些字段同样是无广告的
                console.log('成功');
                modified = true;
            }
        } else {
            console.log('error_code不为0:' + body.error_code);
        }
    }
} else if (url.includes('c/f/pb/picpage')) {
    console.log(`picpage`);
    const liveLength = body.recom_live_list?.length;
    if (liveLength) {
        console.log(`去除直播:${liveLength}`);
        body.recom_live_list = [];
        modified = true;
    }
} else if (url.includes('c/s/sync')) {
    // get post(贴吧使用了post)均可访问
    console.log('贴吧-sync');
    if ('floating_icon' in body) {
        if (body.floating_icon) {
            console.log('去除右下角悬浮icon');
            body.floating_icon = null;
            modified = true;
        } else {
            console.log('无需修改floating_icon字段值');
        }
    } else {
        console.log('无floating_icon字段');
    }

    // 回帖栏的广告
    if ('advertisement_config' in body) {
        if (body.advertisement_config?.advertisement_str) {
            console.log(`去除advertisement_str`);
            body.advertisement_config = null;
            modified = true;
        } else {
            console.log('无需处理advertisement_config');
        }
    } else {
        console.log('无advertisement_config字段');
    }

    // 部分广告配置在abtest中
    if (body.cloud_control_data_info?.common_config?.external_abtest_switch) {
        console.log(`去除external_abtest_switch`);
        body.cloud_control_data_info.common_config.external_abtest_switch = null;
        modified = true;
    }
    if (body.config?.switch?.length) {
        for (const item of body.config.switch) {
            // 穿山甲/广点通/快手/Ubix/百青藤/
            if (['platform_csj_init', 'platform_ks_init', 'platform_gdt_init',
                'platform_baidu_bqt_init', 'platform_jy_init', 'platform_ubix_init', 'platform_hw_init'].includes(item.name)) {
                if (item.type !== '0') {
                    item.type = '0';
                    modified = true;
                    console.log(`禁止初始化${item.name}`);
                }
            }
            if ('ad_baichuan_open' === item.name) {
                if (item.type !== '0') {
                    item.type = '0';
                    modified = true;
                    console.log(`关闭开屏广告`);
                }
            }
        }
    }

    if ('screen_fill_data_result' in body && body.screen_fill_data_result) {
        if (body.screen_fill_data_result.screen_fill_advertisement_bear_switch === "1") {
            body.screen_fill_data_result.screen_fill_advertisement_bear_switch = '0';
            modified = true;
            console.log('开屏不展示小熊广告');
        }
        if (body.screen_fill_data_result.screen_fill_advertisement_plj_cpc_switch === "1") {
            body.screen_fill_data_result.screen_fill_advertisement_plj_cpc_switch = '0';
            modified = true;
            console.log('开屏不展示序章CPC');
        }
        if (body.screen_fill_data_result.screen_fill_advertisement_plj_switch === "1") {
            body.screen_fill_data_result.screen_fill_advertisement_plj_switch = '0';
            modified = true;
            console.log('开屏不展示序章');
        }
    }

    if ('ad_stlog_switch' in body) {
        if (body.ad_stlog_switch === '1') {
            body.ad_stlog_switch = '0';
            modified = true;
            console.log('修改ad_stlog_switch');
        }
    }

    if ('lcs_strategy' in body) {
        // 控制长连接开关 开启时帖子会走socket
        if (body.lcs_strategy && body.lcs_strategy.conn_conf === '0') {
            body.lcs_strategy.conn_conf = '1';
            modified = true;
            console.log('修改conn_conf');
        }
    }
} else if (url.includes("c/f/frs/page")) {
    console.log('贴吧-FrsPage');
    if (body.live_fuse_forum?.length) {
        body.live_fuse_forum = [];
        modified = true;
        console.log(`去除吧头直播`);
    }

    if (body.activityhead?.is_ad) {
        body.activityhead = {};
        modified = true;
        console.log('去除吧内header图片广告');
    }
    if (body.thread_list?.length) {
        const filtered = removeLive(body.thread_list);
        if (filtered.length < body.thread_list.length) {
            body.thread_list = filtered;
            modified = true;
        }
    }
    if (removeGoodsInfo(body.forum?.banner_list?.app)) {
        modified = true;
    }
} else if (url.includes("c/f/frs/threadlist")) {
    console.log('贴吧-threadlist');
    if (removeGoodsInfo(body.banner_list?.app)) {
        modified = true;
    }
} else if (url.includes("c/f/pb/page")) {
    console.log('贴吧-PbPage');
    if (body.recom_ala_info?.live_id) {
        console.log('帖子详情页推荐的直播广告去除');
        body.recom_ala_info = null;
        modified = true;
    }

    if (body.post_list?.length) {
        for (const post of body.post_list) {
            if (post.outer_item) {
                console.log('outer_item去除');
                post.outer_item = null;
                modified = true;
            }
        }
    }
    if (removeGoodsInfo(body.banner_list?.app)) {
        modified = true;
    }
    const bannerGoodsInfoLength = body.banner_list?.pb_banner_ad?.goods_info?.length;
    if (bannerGoodsInfoLength) {
        console.log(`去除pb_banner_ad的goods_info:${bannerGoodsInfoLength}`);
        body.banner_list.pb_banner_ad.goods_info = [];
        modified = true;
    }
} else if (url.includes("c/f/excellent/personalized")) {
    console.log('贴吧-personalized');
    if (removeGoodsInfo(body.banner_list?.app)) {
        modified = true;
    }
    if (body.thread_list?.length) {
        const filtered = removeLive(body.thread_list);
        if (filtered.length < body.thread_list.length) {
            body.thread_list = filtered;
            modified = true;
        }
    }
    if (body.live_answer) {
        console.log('去除推荐页上方的banner广告');
        body.live_answer = null;
        modified = true;
    }
} else if (url.includes("c/f/frs/generalTabList")) {
    console.log('贴吧-generalTabList');
    if (removeGoodsInfo(body.app_list)) {
        modified = true;
    }
} else {
    // 未识别的路径不做修改，直接放行原始响应（避免误伤新功能接口）
    console.log(`路径未匹配,原样放行:${method},${url}`);
    $done({});
    return;
}

// 没有实际修改时直接放行原始响应，避免重新序列化带来的不必要风险
if (!modified) {
    console.log('贴吧json:无需修改,原样放行');
    $done({});
} else {
    $done({
        body: JSON.stringify(body)
    });
}


function getUrlParamValue(url, queryName) {
    return Object.fromEntries(url.substring(url.indexOf("?") + 1)
        .split("&")
        .map(pair => pair.split("="))
    )[queryName];
}

function removeGoodsInfo(app) {
    if (app?.length) {
        let goodsInfoSize = 0;
        app.forEach(item => {
            if (item.goods_info?.length) {
                goodsInfoSize++;
                item.goods_info = [];
            }
        })
        if (goodsInfoSize) {
            console.log(`去除goods_info:${goodsInfoSize}`);
            return true;
        }
    }
    return false;
}

function removeLive(threadList) {
    return threadList.filter(item => {
        if (item.ala_info) {
            console.log('去除推荐的直播帖子');
            return false;
        }
        return true;
    });
}
})();
