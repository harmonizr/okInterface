// tieba-frs-page.js — Loon 脚本：去除百度贴吧 frs/page 帖子流中内嵌的广告卡片
// 原理：frs/page 是 protobuf 外层 + 内嵌 JSON。广告卡片是若干段独立的「广告 item」JSON
//       （每段都有 protobuf 长度前缀），特征是顶层键 "ad_common"。
//       本脚本把每段广告 item 的 JSON 内容原地改写成「同长度」的空对象（内部全填空格），
//       总字节数不变 → protobuf 长度帧不破坏；App 解析到空 item 即跳过，整卡消失。
//       帖子（field 126 "feed"）不动。
// 运行要求：requires_body=true, binary_body_mode=true（$response.body 为 Uint8Array）

(function () {
  try {
    var body = $response.body; // Uint8Array
    if (!body || body.length === 0) { $done({}); return; }
    var b = body;
    var n = b.length;

    // 目标字节模式：ASCII 的 "ad_common"（11 字节）
    var MARK = [0x22, 0x61, 0x64, 0x5f, 0x63, 0x6f, 0x6d, 0x6d, 0x6f, 0x6e, 0x22];

    function findMarker(b, from, n) {
      for (var i = from; i + MARK.length <= n; i++) {
        if (b[i] === MARK[0]) {
          var ok = true;
          for (var j = 1; j < MARK.length; j++) {
            if (b[i + j] !== MARK[j]) { ok = false; break; }
          }
          if (ok) return i;
        }
      }
      return -1;
    }

    // 从 pos（在对象内部）向前（下标增大）做「字符串感知」的括号配平，返回对象结束下标（'}'）
    function objectEnd(b, start, n) {
      var depth = 0, inStr = false, esc = false;
      for (var k = start; k < n; k++) {
        var c = b[k];
        if (inStr) {
          if (esc) { esc = false; }
          else if (c === 0x5c) { esc = true; }        // backslash
          else if (c === 0x22) { inStr = false; }      // "
        } else {
          if (c === 0x22) inStr = true;
          else if (c === 0x7b) depth++;                // {
          else if (c === 0x7d) { depth--; if (depth === 0) return k; } // }
        }
      }
      return -1;
    }

    // 从 marker 位置向后（下标减小）找「包围它的、最内层」对象起始 '{'
    function objectStart(b, pos, n) {
      var depth = 0;
      for (var i = pos; i >= 0; i--) {
        var c = b[i];
        if (c === 0x7d) { depth++; }                    // }
        else if (c === 0x7b) {                           // {
          if (depth === 0) return i;
          depth--;
        }
      }
      return -1;
    }

    // 收集所有广告 item 的 [start,end]，再从后向前把内部填成空格（同长度）
    var ranges = [];
    var p = 0;
    while (true) {
      var m = findMarker(b, p, n);
      if (m < 0) break;
      var s = objectStart(b, m, n);
      if (s >= 0) {
        var e = objectEnd(b, s, n);
        if (e > s) ranges.push([s, e]);
        p = e > 0 ? e + 1 : m + MARK.length;
      } else { p = m + MARK.length; }
    }

    // 安全校验：只保留「顶层内嵌 JSON 文档」的广告 item，避免误伤帖子
    var JSON_STRUCT = [0x2c, 0x5b, 0x7b, 0x3a, 0x22]; // , [ { : "
    var valid = [];
    for (var q = 0; q < ranges.length; q++) {
      var a = ranges[q][0], z = ranges[q][1];
      var ok = b[a] === 0x7b && b[z] === 0x7d;                       // 首尾是 { }
      ok = ok && (z - a + 1) < 300000;                                // 长度合理
      ok = ok && (a > 0 && JSON_STRUCT.indexOf(b[a - 1]) === -1);    // 前面不是 JSON 结构字节（说明是独立内嵌文档）
      if (ok) valid.push([a, z]);
    }
    ranges = valid;
    if (ranges.length === 0) { $done({}); return; }

    // 从后往前填，避免索引失效
    for (var r = ranges.length - 1; r >= 0; r--) {
      var s2 = ranges[r][0], e2 = ranges[r][1];
      for (var k = s2 + 1; k < e2; k++) b[k] = 0x20;    // 内部全变空格
      // 保持 b[s2]='{' 与 b[e2]='}' 不变 → 变成 {   ...   }（同长度空对象）
    }

    console.log('[tieba-frs] 去除广告 item 数: ' + ranges.length);
    $done({ body: b });   // 原长度不变，只改了内容
  } catch (e) {
    console.log('[tieba-frs] 出错，保持原响应: ' + e);
    $done({});
  }
})();