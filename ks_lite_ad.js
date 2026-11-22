// 快手极速版 (kpn=NEBULA) - 去剧集流内视频广告
// Loon Script (新语法 Script API), JS / ES5
// 关键设计: 只做局部字符串手术, 绝不整包 JSON.parse/stringify
//   原因: 响应里的 photo_id / serialId 是 19 位 int64, 超过 JS 安全整数上限(2^53),
//         整包 round-trip 会把 ID 改坏 -> 客户端按坏 ID 拉流 -> 播放失败/网络错误。
//   只有 seriesAdConfig 这个块内确认无大整数, 才允许单独 parse 该块。
//
// 处理对象 (URL 命中时):
//   rest/nebula/tube/standard/serial/episode/scroll
//     - "adTubeInnerTitleConfig" 广告横幅/内嵌标题(指向商业广告短剧)  -> 空对象
//     - "verticalTubeIaaAdTime"  流内 IAA 广告计时                    -> 0
//     - "seriesAdConfig".insertAdInfo(广告插入点)                     -> 删除
//       (保留 unlockSeriesAdType 看广告解锁机制, 不影响解锁)
//   rest/nebula/ad/splashAd
//     - "ads" 数组 -> []
// 未命中/异常: 一律原样放行 ($done({}))

(function () {
    "use strict";

    if (!$response || $response.status !== 200 || !$response.body || !$response.body.length) {
        $done({}); return;
    }
    var url = $request.url || "";
    var isScroll = /rest\/nebula\/tube\/standard\/serial\/episode\/scroll/.test(url);
    var isSplash = /rest\/nebula\/ad\/splashAd/.test(url);
    if (!isScroll && !isSplash) { $done({}); return; }

    // 定位 "key":value 的 value 结尾位置(不闭包); 支持 字符串/对象/数组/数字
    function valueEnd(s, start) {
        var ch = s.charAt(start);
        if (ch === '{' || ch === '[') {
            var close = ch === '{' ? '}' : ']';
            var depth = 0, inStr = false, esc = false;
            for (var j = start; j < s.length; j++) {
                var c = s.charAt(j);
                if (inStr) {
                    if (esc) { esc = false; }
                    else if (c === '\\') { esc = true; }
                    else if (c === '"') { inStr = false; }
                } else if (c === '"') { inStr = true; }
                else if (c === ch) { depth++; }
                else if (c === close) { depth--; if (depth === 0) return j + 1; }
            }
            return -1; // 不闭合
        }
        if (ch === '"') {
            var k = start + 1;
            for (; k < s.length; k++) {
                if (s.charAt(k) === '\\') { k++; continue; }
                if (s.charAt(k) === '"') break;
            }
            if (k >= s.length) return -1;
            return k + 1;
        }
        for (var m = start; m < s.length; m++) {
            var cc = s.charCodeAt(m);
            if (cc === 44 || cc === 125 || cc === 93 || cc === 10 || cc === 13) return m;
        }
        return s.length;
    }

    // 替换顶层 "key" 的值; newValue 为不带引号包裹的 JSON 字面量文本
    function replaceJsonValue(s, key, newValue) {
        var out = "";
        var rest = s;
        for (;;) {
            var i = rest.indexOf('"' + key + '"');
            if (i < 0) { out += rest; break; }
            var colon = i + key.length + 2;         // 收尾引号后一位, 应为 ':'
            if (colon >= rest.length || rest.charAt(colon) !== ':') {
                out += rest.slice(0, i + 1);        // 误匹配(出现在别的字符串里), 跳过
                rest = rest.slice(i + 1);
                continue;
            }
            var v = colon + 1;
            while (rest.charAt(v) === ' ') v++;
            var end = valueEnd(rest, v);
            if (end < 0) { out += rest; break; }    // 值不闭合, 保守放弃
            out += rest.slice(0, i) + '"' + key + '":' + newValue;
            rest = rest.slice(end);
        }
        return out;
    }

    // 对每一个 "key" 出现处: JSON.parse 其值对象, 用 fn 修改, 再 JSON.stringify 写回同一段;
    // fn 返回 null 表示该处不改, 原样保留
    function transformJsonValue(s, key, fn) {
        var out = "";
        var rest = s;
        for (;;) {
            var i = rest.indexOf('"' + key + '"');
            if (i < 0) { out += rest; break; }
            var colon = i + key.length + 2;
            if (colon >= rest.length || rest.charAt(colon) !== ':') {
                out += rest.slice(0, i + 1);
                rest = rest.slice(i + 1);
                continue;
            }
            var v = colon + 1;
            while (rest.charAt(v) === ' ') v++;
            var end = valueEnd(rest, v);
            if (end < 0) { out += rest; break; }
            var valText = rest.slice(v, end);
            var obj;
            try { obj = JSON.parse(valText); } catch (e) { obj = null; }
            if (obj && typeof obj === 'object') {
                var res = fn(obj);
                if (res !== null && res !== undefined) {
                    out += rest.slice(0, i) + '"' + key + '":' + JSON.stringify(res);
                    rest = rest.slice(end);
                    continue;
                }
            }
            out += rest.slice(0, end);
            rest = rest.slice(end);
        }
        return out;
    }

    var body = $response.body;

    if (isScroll) {
        // 1) 广告横幅/内嵌标题 -> 清空
        body = replaceJsonValue(body, 'adTubeInnerTitleConfig', '{}');
        // 2) IAA 广告计时 -> 关闭
        body = replaceJsonValue(body, 'verticalTubeIaaAdTime', '0');
        // 3) seriesAdConfig 块内: 删广告插入点, 关横幅 (保留看广告解锁 unlockSeriesAdType)
        body = transformJsonValue(body, 'seriesAdConfig', function (o) {
            var changed = false;
            if ('insertAdInfo' in o) { delete o.insertAdInfo; changed = true; }
            if ('supportBannerAd' in o) { o.supportBannerAd = false; changed = true; }
            if ('bannerAdGap' in o) { o.bannerAdGap = 0; changed = true; }
            if (typeof o.seriesCommonParam === 'string') {
                try {
                    var c = JSON.parse(o.seriesCommonParam);
                    if (c && typeof c === 'object') {
                        c.hitSeriesFeedAdverseSwitch = false;
                        c.hitComicSeriesIaapFeedAdSwitch = false;
                        o.seriesCommonParam = JSON.stringify(c);
                        changed = true;
                    }
                } catch (e) {}
            }
            return changed ? o : null;
        });
    } else {
        // 开屏广告: 清空广告列表
        body = replaceJsonValue(body, 'ads', '[]');
    }

    // 保守校验: 结果必须仍是 JSON, 否则原样放行
    try {
        JSON.parse(body);
    } catch (e) {
        $done({});
        return;
    }
    $done({ body: body });
})();