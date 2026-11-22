// Kuaishou Lite (Kuaishou Lite, kpn=NEBULA) - Remove video ads in series feed + splash ad
// Loon Script (new syntax Script API), JS
// Applicable endpoints (determined by actual measurement from HAR 2026-11-22):
//   rest/nebula/tube/standard/serial/episode/scroll  -> Clear ad insertion / IAA timer / commercial banner in series (short drama) feed
//   rest/nebula/ad/splashAd                          -> Clear splash ad list
// Keep the unlock mechanism (unlockSeriesAdType), only remove the ads themselves

(function () {
    "use strict";

    function utf8Length(s) {
        var n = 0, i = 0;
        while (i < s.length) {
            var c = s.charCodeAt(i);
            if (c < 0x80) { n += 1; i += 1; }
            else if (c < 0x800) { n += 2; i += 1; }
            else if (c >= 0xD800 && c < 0xDC00 && i + 1 < s.length &&
                     s.charCodeAt(i + 1) >= 0xDC00 && s.charCodeAt(i + 1) < 0xE000) { n += 4; i += 2; }
            else { n += 3; i += 1; }
        }
        return n;
    }

    function safeParse(v) {
        if (typeof v === "string") {
            try { return JSON.parse(v); } catch (e) { return null; }
        }
        if (v && typeof v === "object") return v;
        return null;
    }

    function finish(newBody) {
        if (newBody === null || newBody === undefined) { $done({}); return; }
        // Loon 在修改响应 Body 后自动处理 Content-Length / Transfer-Encoding / Content-Encoding
        $done({ body: newBody });
    }

    if (!$response || $response.status !== 200 || !$response.body) { $done({}); return; }

    var root;
    try { root = JSON.parse($response.body); } catch (e) { $done({}); return; }
    if (!root || typeof root !== "object") { $done({}); return; }

    var url = $request.url || "";

    // ---------- Splash ad: clear ad list ----------
    if (/rest\/nebula\/ad\/splashAd/.test(url)) {
        root.ads = [];
        if (typeof root.policy === "string") {
            var p = safeParse(root.policy);
            if (p && typeof p === "object") {
                p.clearAds = true;
                p.splashAdShowInterval = 0;
                p.splashAdDayLimit = 0;
                root.policy = JSON.stringify(p);
            }
        }
        finish(JSON.stringify(root));
        return;
    }

    // ---------- Series feed: clear ad insertion, IAA timer, commercial banner ----------
    if (/rest\/nebula\/tube\/standard\/serial\/episode\/scroll/.test(url)) {
        var feeds = root.feeds;
        if (Array.isArray(feeds)) {
            for (var i = 0; i < feeds.length; i++) {
                var f = feeds[i];
                if (!f || !f.standardSerial || !f.standardSerial.serial) continue;
                var cp = f.standardSerial.serial.customParams;
                if (!cp || typeof cp !== "object") continue;

                // Commercial banner / inner title ad (jump to CommercialSeriesDetail)
                if ("adTubeInnerTitleConfig" in cp) cp.adTubeInnerTitleConfig = "";
                // In-feed IAA ad timer
                if ("verticalTubeIaaAdTime" in cp) cp.verticalTubeIaaAdTime = 0;

                // seriesAdConfig (stringified JSON): disable ad insertion, keep unlock ad
                var sc = safeParse(cp.seriesAdConfig);
                if (sc && typeof sc === "object") {
                    delete sc.insertAdInfo;
                    sc.supportBannerAd = false;
                    sc.bannerAdGap = 0;
                    if (typeof sc.seriesCommonParam === "string") {
                        var c = safeParse(sc.seriesCommonParam);
                        if (c && typeof c === "object") {
                            c.hitSeriesFeedAdverseSwitch = false;
                            c.hitComicSeriesIaapFeedAdSwitch = false;
                            sc.seriesCommonParam = JSON.stringify(c);
                        }
                    }
                    if (typeof cp.seriesAdConfig === "string") {
                        cp.seriesAdConfig = JSON.stringify(sc);
                    }
                }
            }
        }
        finish(JSON.stringify(root));
        return;
    }

    $done({});
})();