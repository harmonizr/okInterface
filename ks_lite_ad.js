// 快手极速版 (kpn=NEBULA) - 去视频广告 v4 (全端点版)
// Loon Script (新语法 Script API), JS / ES5
// 设计: 只做局部字符串手术, 绝不整包 JSON.parse/stringify (响应含 19 位 int64,
//       整包 round-trip 会损坏 photo_id 导致拉流失败)。
//
// 处理端点 (按 URL 分发):
//   az2-api.ksapisrv.com:
//     rest/nebula/tube/standard/serial/episode/scroll  清 insertAdInfo / IAA计时 / 商业横幅
//     rest/nebula/ad/splashAd                          ads -> []
//   api.e.kuaishou.cn:
//     rest/e/neo/mixed/ad        混插广告视频本体      feeds -> []
//     rest/e/v2/diverse/ad       广告视频本体          data.feeds -> []
//     rest/miniSeries/n/iaa/scheme          adScheme(base64) mixedAd/fullMixed -> false
//     rest/miniSeries/n/commercial/iaa/panel  看广告解锁入口  adsInfo.canAccessAds -> false
// 未命中/异常: 原样放行

(function () {
    "use strict";

    if (!$response || $response.status !== 200 || !$response.body || !$response.body.length) {
        $done({}); return;
    }
    var url = $request.url || "";
    var isScroll = /rest\/nebula\/tube\/standard\/serial\/episode\/scroll/.test(url);
    var isSplash = /rest\/nebula\/ad\/splash/.test(url);
    var isMixedAd = /\/rest\/e\/neo\/mixed\/ad/.test(url);
    var isDiverseAd = /\/rest\/e\/v2\/diverse\/ad/.test(url);
    var isIaaScheme = /\/rest\/miniSeries\/n\/iaa\/scheme/.test(url);
    var isCommercialPanel = /\/rest\/miniSeries\/n\/commercial\/iaa\/panel/.test(url);
    if (!(isScroll || isSplash || isMixedAd || isDiverseAd || isIaaScheme || isCommercialPanel)) {
        $done({}); return;
    }

    // ---------- 通用工具 ----------

    // 定位 "key":value 的 value 结尾位置; 支持 字符串/对象/数组/数字
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
            return -1;
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

    // 替换所有 "key" 的值; newValue 为 JSON 字面量文本 (可出现在顶层或任意嵌套层级)
    function replaceJsonValue(s, key, newValue) {
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
            out += rest.slice(0, i) + '"' + key + '":' + newValue;
            rest = rest.slice(end);
        }
        return out;
    }

    // 对每个 "key" 的 JSON 对象值: parse -> fn -> stringify 写回; fn 返回 null 表示不动
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

    // ---------- Base64 (UTF-8 感知) ----------
    var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    function b64encode(str) {
        var bytes = [], i = 0;
        while (i < str.length) {
            var c = str.charCodeAt(i++);
            if (c < 0x80) { bytes.push(c); }
            else if (c < 0x800) { bytes.push(192 + (c >> 6), 128 + (c & 63)); }
            else if (c >= 0xD800 && c < 0xDC00 && i < str.length) {
                var c2 = str.charCodeAt(i++);
                var cp = 0x10000 + ((c & 0x3FF) << 10) + (c2 & 0x3FF);
                bytes.push(240 + (cp >> 18), 128 + ((cp >> 12) & 63), 128 + ((cp >> 6) & 63), 128 + (cp & 63));
            }
            else { bytes.push(224 + (c >> 12), 128 + ((c >> 6) & 63), 128 + (c & 63)); }
        }
        var out = '';
        for (i = 0; i < bytes.length; i += 3) {
            var a = bytes[i];
            var b = i + 1 < bytes.length ? bytes[i + 1] : 0;
            var dd = i + 2 < bytes.length ? bytes[i + 2] : 0;
            out += B64.charAt(a >> 2);
            out += B64.charAt(((a & 3) << 4) | (b >> 4));
            out += i + 1 < bytes.length ? B64.charAt(((b & 15) << 2) | (dd >> 6)) : '=';
            out += i + 2 < bytes.length ? B64.charAt(dd & 63) : '=';
        }
        return out;
    }
    function b64decode(s) {
        s = s.replace(/[^A-Za-z0-9+\/]/g, '');
        s = s + '==='.slice(0, (4 - s.length % 4) % 4);
        var map = {}, i;
        for (i = 0; i < 64; i++) map[B64.charAt(i)] = i;
        var bytes = [], buf = 0, bits = 0;
        for (i = 0; i < s.length; i++) {
            var v = map[s.charAt(i)];
            if (v === undefined) continue;
            buf = (buf << 6) | v;
            bits += 6;
            if (bits >= 8) { bits -= 8; bytes.push((buf >> bits) & 255); }
        }
        var out = '', j = 0, cp;
        while (j < bytes.length) {
            var x = bytes[j++];
            if (x < 0x80) { out += String.fromCharCode(x); }
            else if (x < 0xE0) { out += String.fromCharCode(((x & 31) << 6) | (bytes[j++] & 63)); }
            else if (x < 0xF0) {
                cp = ((x & 15) << 10) | ((bytes[j++] & 63) << 6) | (bytes[j++] & 63);
                out += String.fromCharCode(cp);
            } else {
                cp = ((x & 7) << 16) | ((bytes[j++] & 63) << 12) | ((bytes[j++] & 63) << 6) | (bytes[j++] & 63);
                cp -= 0x10000;
                out += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
            }
        }
        return out;
    }

    // 修改 base64 字符串值 "key":"<b64json>" 里的 JSON 字段
    function patchB64JsonValue(body, key, fn) {
        var i = body.indexOf('"' + key + '"');
        if (i < 0) return body;
        var v = i + key.length + 2;
        if (v >= body.length || body.charAt(v) !== ':') return body;
        v++;
        while (body.charAt(v) === ' ') v++;
        if (body.charAt(v) !== '"') return body;
        v++;
        var end = v;
        for (; end < body.length; end++) {
            if (body.charAt(end) === '\\') { end++; continue; }
            if (body.charAt(end) === '"') break;
        }
        if (end >= body.length) return body;
        var inner;
        try { inner = JSON.parse(b64decode(body.slice(v, end))); } catch (e) { return body; }
        if (!inner || typeof inner !== 'object') return body;
        var res = fn(inner);
        if (!res) return body;
        return body.slice(0, v) + b64encode(JSON.stringify(res)) + body.slice(end);
    }

    // ---------- 执行 ----------
    var body = $response.body;

    if (isScroll) {
        body = replaceJsonValue(body, 'adTubeInnerTitleConfig', '{}');
        body = replaceJsonValue(body, 'verticalTubeIaaAdTime', '0');
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
    } else if (isSplash) {
        body = replaceJsonValue(body, 'ads', '[]');
    } else if (isMixedAd || isDiverseAd) {
        // 广告视频本体: 清空 feed (neo 在顶层, diverse 在 data 下, 同 key 名)
        body = replaceJsonValue(body, 'feeds', '[]');
    } else if (isIaaScheme) {
        // 关闭短剧流内混插广告开关
        body = patchB64JsonValue(body, 'adScheme', function (o) {
            if (!('mixedAd' in o) && !('fullMixed' in o)) return null;
            o.mixedAd = false;
            o.fullMixed = false;
            return o;
        });
    } else if (isCommercialPanel) {
        // 关闭 "看广告解锁" 入口
        body = replaceJsonValue(body, 'adsInfo', '{"canAccessAds":false}');
    }

    try {
        JSON.parse(body);
    } catch (e) {
        $done({});
        return;
    }
    $done({ body: body });
})();