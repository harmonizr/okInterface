// tieba-frs-page.js — Loon 脚本：贴吧帖子流去广告 + 模拟会员关直播卡
// v3：性能修复版（v2 在 Loon 引擎上跑满 20s 超时被杀 → 响应被挂住 = 卡顿）
//   - 广告清空路径与旧版逐字节一致（已验证可用），不动。
//   - 直播卡标记(is_vip_close_live)合并进同一次扫描，避免第二次全量扫描。
//   - svip 翻转只在 ±200B 小窗口内做。
//   - 总步数保险阀：极端慢引擎下最多跑 ~1.5 倍全量扫描步数即停（已做的原地改写都是同长度、部分完成也安全）。
// 原理：frs/page 是「protobuf 外层 + 内嵌 JSON」。
//   A) 广告 item：若干段带长度前缀的独立 JSON 文档（顶层键 ad_common），原地改写成同长度空对象。
//      只有当「该 JSON 前的 protobuf 长度前缀」精确等于其字节长度时才改写，拿不准就原样放行。
//   B) 直播引流卡：卡配置 JSON 里含 is_vip_close_live:1 + svip_status:0。
//      把 svip_status 的 0 翻成 1（同长度），App 按会员逻辑自动关掉直播卡。
// 运行要求：requires_body=true, binary_body_mode=true（$response.body 为 Uint8Array）

(function () {
  try {
    var body = $response.body;
    if (!body || body.length === 0) { $done({}); return; }
    var b = body, n = b.length;
    if (n < 64) { $done({}); return; }

    // ===== 单次前向扫描：同时收集 ad_common 与 is_vip_close_live 位置 =====
    // ad_common = "ad_common" : 22 61 64 5f 63 6f 6d 6d 6f 6e
    // is_vip_close_live     : 69 73 5f 76 69 70 5f 63 6c 6f 73 65 5f 6c 69 76 65
    var adPos = [], livePos = [];
    var CAP = (n >> 1) + n * 2 + 400000;   // 保险阀：最多约 1.5 倍全量步数
    var steps = 0, aborted = false;
    for (var i = 0; i + 17 <= n; i++) {
      if ((++steps & 4095) === 0 && steps > CAP) { aborted = true; break; }
      var c = b[i];
      if (c === 0x22) {
        if (b[i+1]===0x61 && b[i+2]===0x64 && b[i+3]===0x5f && b[i+4]===0x63 &&
            b[i+5]===0x6f && b[i+6]===0x6d && b[i+7]===0x6d && b[i+8]===0x6f && b[i+9]===0x6e) {
          adPos.push(i);
        }
      } else if (c === 0x69) {
        if (b[i+1]===0x73 && b[i+2]===0x5f && b[i+3]===0x76 && b[i+4]===0x69 &&
            b[i+5]===0x70 && b[i+6]===0x5f && b[i+7]===0x63 && b[i+8]===0x6c &&
            b[i+9]===0x6f && b[i+10]===0x73 && b[i+11]===0x65 && b[i+12]===0x5f &&
            b[i+13]===0x6c && b[i+14]===0x69 && b[i+15]===0x76) {
          livePos.push(i);
        }
      }
    }

    // ===== 工具：对象边界 + 长度前缀校验（与旧版一致）=====
    function objectStart(pos) {
      var depth = 0, i = pos;
      while (i >= 0) {
        var cc = b[i];
        if (cc === 0x7d) depth++;
        else if (cc === 0x7b) { if (depth === 0) return i; depth--; }
        i--;
      }
      return -1;
    }
    function objectEnd(start) {
      var depth = 0, inStr = false, esc = false;
      for (var k = start; k < n; k++) {
        var cc = b[k];
        if (inStr) {
          if (esc) esc = false;
          else if (cc === 0x5c) esc = true;
          else if (cc === 0x22) inStr = false;
        } else {
          if (cc === 0x22) inStr = true;
          else if (cc === 0x7b) depth++;
          else if (cc === 0x7d) { depth--; if (depth === 0) return k; }
        }
      }
      return -1;
    }
    function lengthPrefixMatches(s, contentLen) {
      if (s < 1) return false;
      var i = s - 1;
      while (i > 0 && (b[i-1] & 0x80)) i--;
      var val = 0, shift = 0;
      for (var k = i; k < s; k++) { val += (b[k] & 0x7f) * Math.pow(2, shift); shift += 7; }
      return val === contentLen;
    }

    // ===== A) 清空广告 item（同长度空格填充；长度前缀精确匹配才动手）=====
    var ranges = [], changed = 0;
    for (var q = 0; q < adPos.length; q++) {
      var m = adPos[q];
      var s = objectStart(m);
      if (s >= 0) {
        var e = objectEnd(s);
        var cl = (e > s) ? (e - s + 1) : 0;
        if (b[s] === 0x7b && b[e] === 0x7d && cl > 0 && cl < 300000 &&
            lengthPrefixMatches(s, cl)) {
          ranges.push([s, e]);
        }
      }
    }
    for (var r = ranges.length - 1; r >= 0; r--) {
      var a = ranges[r][0], z = ranges[r][1];
      for (var k2 = a + 1; k2 < z; k2++) b[k2] = 0x20;
      changed++;
    }

    // ===== B) 直播卡：is_vip_close_live 之后 200B 内找 "svip_status":0 → 翻成 1 =====
    var svipFlip = 0;
    for (var L = 0; L < livePos.length; L++) {
      var lp = livePos[L];
      var lim = lp + 217; if (lim > n) lim = n;
      var found = -1;
      for (var j = lp + 17; j + 13 <= lim; j++) {
        if (b[j]===0x22 && b[j+1]===0x73 && b[j+2]===0x76 && b[j+3]===0x69 && b[j+4]===0x70 &&
            b[j+5]===0x5f && b[j+6]===0x73 && b[j+7]===0x74 && b[j+8]===0x61 && b[j+9]===0x74 &&
            b[j+10]===0x75 && b[j+11]===0x73 && b[j+12]===0x22) { found = j; break; }
      }
      if (found >= 0) {
        var q2 = found + 13;
        while (q2 < n && b[q2] === 0x20) q2++;
        if (q2 < n && b[q2] === 0x3a) q2++;
        while (q2 < n && b[q2] === 0x20) q2++;
        if (q2 < n && b[q2] === 0x30) { b[q2] = 0x31; svipFlip++; }
      }
    }

    if (changed === 0 && svipFlip === 0) { $done({}); return; }
    console.log('[tieba-frs] 广告item:' + changed + ' svip翻转:' + svipFlip + (aborted ? ' (保险阀触发,已停止)' : ''));
    $done({ body: b });
  } catch (e) {
    console.log('[tieba-frs] 出错，保持原响应: ' + e);
    $done({});
  }
})();