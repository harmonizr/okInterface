// tieba-frs-page.js — Loon 脚本：去除百度贴吧 frs/page 帖子流里内嵌的广告卡片
// 原理：frs/page 是「protobuf 外层 + 内嵌 JSON」。广告卡片是若干段独立的、
//       带长度前缀的 protobuf 字符串字段（顶层键 "ad_common"）。
//       本脚本把每段广告 JSON「原地」改写成同长度空对象（内部全填空格），
//       总字节数不变 → protobuf 长度帧完好；App 解析到空 item 即跳过，整卡消失。
// 安全设计（关键）：只有当「该 JSON 前面的 protobuf 长度前缀」精确等于其字节长度时
//       才改写；任何拿不准的边界一律跳过（原样放行），保证绝不把帖子/响应改坏。
// 运行要求：requires_body=true, binary_body_mode=true（$response.body 为 Uint8Array）

(function () {
  try {
    var body = $response.body; // Uint8Array
    if (!body || body.length === 0) { $done({}); return; }
    var b = body, n = b.length;

    // 目标字节模式：ASCII 的 "ad_common"（11 字节）
    var MARK = [0x22,0x61,0x64,0x5f,0x63,0x6f,0x6d,0x6d,0x6f,0x6e,0x22];

    function findMarker(frm) {
      for (var i = frm; i + MARK.length <= n; i++) {
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

    // 从对象内部位置 pos 向前（下标减小）找「最内层包围它」的对象起始 '{'（不计字符串内括号）
    function objectStart(pos) {
      var depth = 0, i = pos;
      while (i >= 0) {
        var c = b[i];
        if (c === 0x7d) depth++;               // }
        else if (c === 0x7b) { if (depth === 0) return i; depth--; }  // {
        i--;
      }
      return -1;
    }

    // 从对象起始 start 向后（字符串感知）做括号配平，返回对象结束 '}'
    function objectEnd(start) {
      var depth = 0, inStr = false, esc = false;
      for (var k = start; k < n; k++) {
        var c = b[k];
        if (inStr) {
          if (esc) esc = false;
          else if (c === 0x5c) esc = true;          // \
          else if (c === 0x22) inStr = false;       // "
        } else {
          if (c === 0x22) inStr = true;
          else if (c === 0x7b) depth++;
          else if (c === 0x7d) { depth--; if (depth === 0) return k; }
        }
      }
      return -1;
    }

    // 关键校验：s 处的 JSON 是否是一个「带长度前缀的独立内嵌文档」。
    // 长度 varint 紧跟在 '{'(s) 之前、结束于 s-1。读出该 varint，必须 == 内容长度 (e-s+1)。
    function lengthPrefixMatches(s, contentLen) {
      if (s < 1) return false;
      var i = s - 1;
      while (i > 0 && (b[i - 1] & 0x80)) i--;   // 回溯到长度 varint 的首字节
      var val = 0, shift = 0;
      for (var k = i; k < s; k++) {
        val += (b[k] & 0x7f) * Math.pow(2, shift);
        shift += 7;
      }
      return val === contentLen;
    }

    // 收集所有广告 item 的 [start,end]，并从后往前把内部填成空格（同长度）
    var ranges = [], p = 0, changed = 0;
    while (true) {
      var m = findMarker(p);
      if (m < 0) break;
      var s = objectStart(m);
      if (s >= 0) {
        var e = objectEnd(s);
        var contentLen = (e > s) ? (e - s + 1) : 0;
        var safe = (b[s] === 0x7b) && (b[e] === 0x7d) &&
                   (contentLen > 0 && contentLen < 300000) &&
                   lengthPrefixMatches(s, contentLen);   // 唯一决定性判据
        if (safe) { ranges.push([s, e]); p = e + 1; }
        else { p = m + MARK.length; }
      } else { p = m + MARK.length; }
    }

    if (ranges.length === 0) { $done({}); return; }

    for (var r = ranges.length - 1; r >= 0; r--) {
      var a = ranges[r][0], z = ranges[r][1];
      for (var k = a + 1; k < z; k++) { b[k] = 0x20; }  // 内部全变空格 → {   ...   } 空对象
      changed++;
    }

    console.log('[tieba-frs] 去除广告 item 数: ' + changed + ' / 命中 ' + ranges.length);
    $done({ body: b });   // 长度不变，仅改内容
  } catch (e) {
    console.log('[tieba-frs] 出错，保持原响应: ' + e);
    $done({});
  }
})();