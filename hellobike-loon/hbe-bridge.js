// ============================================================
// 哈啰净化 · Loon 桥接脚本 (hbe-bridge.js)
// 作用: 在 Loon [Script] 环境中补齐 QX 专有 API
//   - $prefs  : QX 持久化键值存储 -> Loon localStorage (无 localStorage 时退化为进程内内存)
//   - $notify : QX 通知 -> Loon notify(title, body, url)
//   - $done   : QX 完成回调 -> Loon done(), 并把 "HTTP/1.1 200 OK" 形式 status 归一化为数字
// 运行时会拉取上游 ZenmoFeiShi/Qx 的 easybike-ad.js 并执行;
// 拉取结果缓存于 localStorage (HelloBikeJSCacheV1, 6 小时有效, 失效时优先用旧缓存兜底)。
// 注意: 本文件内联进 Loon snippet 时必须压成单行且不含双引号 "
// ============================================================
(function () {
  var HBE_SRC = 'https://raw.githubusercontent.com/ZenmoFeiShi/Qx/main/easybike-ad.js';
  var HBE_JS_CACHE_KEY = 'HelloBikeJSCacheV1';
  var HBE_JS_MAX_AGE = 6 * 3600 * 1000;
  var hbeLS = null;
  try { if (typeof localStorage !== 'undefined' && localStorage) hbeLS = localStorage; } catch (hbeE1) {}
  var hbeMem = {};
  function hbeKV(hbeBackend) {
    if (hbeBackend) {
      return {
        valueForKey: function (hbeK) { try { var hbeV = hbeBackend.getItem(hbeK); return hbeV === null ? null : hbeV; } catch (hbeE) { return null; } },
        setValueForKey: function (hbeV, hbeK) { try { hbeBackend.setItem(hbeK, hbeV); return true; } catch (hbeE) { return false; } },
        removeValueForKey: function (hbeK) { try { hbeBackend.removeItem(hbeK); } catch (hbeE) {} }
      };
    }
    return {
      valueForKey: function (hbeK) { return Object.prototype.hasOwnProperty.call(hbeMem, hbeK) ? hbeMem[hbeK] : null; },
      setValueForKey: function (hbeV, hbeK) { hbeMem[hbeK] = hbeV; return true; },
      removeValueForKey: function (hbeK) { delete hbeMem[hbeK]; }
    };
  }
  if (typeof $prefs !== 'object' || !$prefs) $prefs = hbeKV(hbeLS);
  if (typeof $notify !== 'function') {
    $notify = function (hbeT, hbeB, hbeU) {
      try { if (typeof notify === 'function') notify(hbeT || '', hbeB || '', hbeU || ''); } catch (hbeE) {}
    };
  }
  var hbeEngine = (typeof $done === 'function') ? $done : null;
  $done = function (hbeR) {
    try {
      if (hbeR && typeof hbeR === 'object') {
        var hbeN = {}, hbeKS = Object.keys(hbeR), hbeI;
        for (hbeI = 0; hbeI < hbeKS.length; hbeI++) hbeN[hbeKS[hbeI]] = hbeR[hbeKS[hbeI]];
        if (typeof hbeN.status === 'string') {
          var hbeM = /^\d{3}/.exec(hbeN.status);
          hbeN.status = hbeM ? Number(hbeM[0]) : 200;
        }
        if (typeof hbeN.status !== 'number' && typeof hbeN.statusCode === 'number') hbeN.status = hbeN.statusCode;
        hbeR = hbeN;
      }
      if (typeof done === 'function') { done(hbeR); return; }
      if (hbeEngine) hbeEngine(hbeR);
    } catch (hbeE) {}
  };
  var hbeFetchFn = (typeof fetch === 'function') ? fetch : ((typeof $fetch === 'function') ? $fetch : null);
  function hbeRun(hbeSrc) {
    try { (0, eval)(hbeSrc); } catch (hbeE) { try { new Function(hbeSrc)(); } catch (hbeE2) {} }
  }
  function hbeBoot() {
    var hbeCached = null;
    try {
      var hbeRaw = hbeLS ? hbeLS.getItem(HBE_JS_CACHE_KEY) : '';
      if (hbeRaw) {
        var hbeP = JSON.parse(hbeRaw);
        if (hbeP && typeof hbeP.t === 'number' && typeof hbeP.s === 'string') hbeCached = hbeP;
      }
    } catch (hbeE) {}
    if (hbeCached && Date.now() - hbeCached.t < HBE_JS_MAX_AGE) { hbeRun(hbeCached.s); return; }
    if (!hbeFetchFn) { if (hbeCached) hbeRun(hbeCached.s); return; }
    hbeFetchFn(HBE_SRC)
      .then(function (hbeResp) {
        if (hbeResp && typeof hbeResp.text === 'function') return hbeResp.text();
        return Promise.resolve(hbeResp ? hbeResp.body : '');
      })
      .then(function (hbeSrc) {
        if (typeof hbeSrc !== 'string' || hbeSrc.length < 1000) throw new Error('hbe-too-short');
        try { if (hbeLS) hbeLS.setItem(HBE_JS_CACHE_KEY, JSON.stringify({ t: Date.now(), s: hbeSrc })); } catch (hbeE) {}
        hbeRun(hbeSrc);
      })
      .catch(function () { if (hbeCached) hbeRun(hbeCached.s); });
  }
  hbeBoot();
})();
