// tieba-frs-page.js — Loon 脚本：贴吧帖子流/推荐流去广告 + 删直播卡（v6）
// 目标（一次 protobuf 重建，全删干净、不留空壳）：
//   1) 广告文档 item：ad_common / creative_id / is_hide_ad_tag（v5 是「改空留壳」，v6 直接删）
//   2) 直播卡 item：  bdtiebalive://（论坛流）/ liveChannelInfo（推荐流&新变体）
// 原理：这些 item 都是 field2 下各子字段里的「长度前缀子消息」，删掉后重编
//      外层两层长度前缀即可。带三重 sanity（总长变短 / 标记清零 / 重解析通过）+ 3s 墙钟，
//      任何异常回退到 v5 的「同长度清空」安全模式。
// 运行要求：requires_body=true, binary_body_mode=true

(function () {
  try {
    var body = $response.body;
    if (!body || body.length === 0) { $done({}); return; }
    var b = body, n = b.length;
    if (n < 64) { $done({}); return; }
    var T0 = Date.now();
    function over() { return (Date.now() - T0) > 3000; }

    function encVarint(v) {
      var out = [];
      while (v >= 0x80) { out.push((v & 0x7f) | 0x80); v >>>= 7; }
      out.push(v & 0x7f);
      return out;
    }
    function encTag(no, wire) { return encVarint((no << 3) | wire); }
    function findIn(src, oStart, oEnd, pat, from) {
      if (from === undefined) from = oStart;
      for (var i = from; i + pat.length <= oEnd; i++) {
        if (src[i] !== pat[0]) continue;
        var ok = true;
        for (var j = 1; j < pat.length; j++) { if (src[i + j] !== pat[j]) { ok = false; break; } }
        if (ok) return i;
      }
      return -1;
    }
    function parseInto(src, oStart, oEnd) {
      var out = [], i = oStart;
      while (i < oEnd) {
        var s0 = i, r = 0, s = 0;
        while (i < oEnd && (src[i] & 0x80)) { r += (src[i] & 0x7f) * Math.pow(2, s); s += 7; i++; }
        if (i >= oEnd) return null;
        r += src[i] * Math.pow(2, s); i++;
        var tag = r, fno = tag >> 3, wire = tag & 7;
        var rec = { no: fno, wire: wire, start: s0, end: i, cs: null, cl: 0 };
        if (wire === 0) {
          r = 0; s = 0;
          while (i < oEnd && (src[i] & 0x80)) { r += (src[i] & 0x7f) * Math.pow(2, s); s += 7; i++; }
          if (i >= oEnd) return null;
          r += src[i] * Math.pow(2, s); i++; rec.end = i;
        } else if (wire === 2) {
          r = 0; s = 0;
          while (i < oEnd && (src[i] & 0x80)) { r += (src[i] & 0x7f) * Math.pow(2, s); s += 7; i++; }
          if (i >= oEnd) return null;
          r += src[i] * Math.pow(2, s); i++;
          var ln = r;
          if (i + ln > oEnd) return null;
          rec.cs = i; rec.cl = ln; i += ln; rec.end = i;
        } else if (wire === 1) { if (i + 8 > oEnd) return null; i += 8; rec.end = i; }
        else if (wire === 5) { if (i + 4 > oEnd) return null; i += 4; rec.end = i; }
        else return null;
        out.push(rec);
      }
      return out;
    }

    // 删除标记（任一命中即删该 item）
    var MARKS = [
      [0x62,0x64,0x74,0x69,0x65,0x62,0x61,0x6c,0x69,0x76,0x65,0x3a,0x2f,0x2f], // bdtiebalive://
      [0x6c,0x69,0x76,0x65,0x43,0x68,0x61,0x6e,0x6e,0x65,0x6c,0x49,0x6e,0x66,0x6f], // liveChannelInfo
      [0x22,0x61,0x64,0x5f,0x63,0x6f,0x6d,0x6d,0x6f,0x6e,0x22], // "ad_common"
      [0x22,0x63,0x72,0x65,0x61,0x74,0x69,0x76,0x65,0x5f,0x69,0x64,0x22], // "creative_id"
      [0x22,0x69,0x73,0x5f,0x68,0x69,0x64,0x65,0x5f,0x61,0x64,0x5f,0x74,0x61,0x67,0x22] // "is_hide_ad_tag"
    ];
    // 在 [oStart,oEnd) 内扫描任一标记的所有位置
    function scanMarks(oStart, oEnd) {
      var pos = [];
      for (var i = oStart; i + 4 <= oEnd; i++) {
        var c = b[i];
        if (c !== 0x62 && c !== 0x6c && c !== 0x22) continue;
        for (var m = 0; m < MARKS.length; m++) {
          var pat = MARKS[m];
          if (pat[0] !== c) continue;
          var ok = true;
          for (var j = 1; j < pat.length; j++) { if (b[i + j] !== pat[j]) { ok = false; break; } }
          if (ok) { pos.push(i); break; }
        }
      }
      return pos;
    }
    function anyIn(pos, lo, hi) {
      for (var p = 0; p < pos.length; p++) if (pos[p] >= lo && pos[p] < hi) return true;
      return false;
    }

    // ============ v6 删除重建 ============
    var removed = 0;
    try {
      var top = parseInto(b, 0, n);
      if (top && !over()) {
        var f2 = null;
        for (var t = 0; t < top.length; t++) { if (top[t].no === 2 && top[t].wire === 2) { f2 = top[t]; break; } }
        if (f2 && f2.cs !== null) {
          var subs = parseInto(b, f2.cs, f2.cs + f2.cl);
          if (subs && !over()) {
            var newF2Parts = [];
            for (var si = 0; si < subs.length; si++) {
              var sub = subs[si];
              if (sub.wire !== 2 || sub.cl === 0) {
                newF2Parts.push({ copy: [sub.start, sub.end - sub.start] });
                continue;
              }
              var pos = scanMarks(sub.cs, sub.cs + sub.cl);
              if (pos.length === 0) { newF2Parts.push({ copy: [sub.start, sub.end - sub.start] }); continue; }
              var items = parseInto(b, sub.cs, sub.cs + sub.cl);
              if (items) {
                var kept = [];
                for (var ii = 0; ii < items.length; ii++) {
                  var it = items[ii];
                  if (it.wire === 2 && it.cl > 0 && anyIn(pos, it.cs, it.cs + it.cl)) { removed++; continue; }
                  kept.push(it);
                }
                if (kept.length === items.length) {
                  newF2Parts.push({ copy: [sub.start, sub.end - sub.start] });
                } else {
                  var nl = 0;
                  for (var k1 = 0; k1 < kept.length; k1++) nl += kept[k1].end - kept[k1].start;
                  newF2Parts.push({ bytes: encTag(sub.no, 2) });
                  newF2Parts.push({ bytes: encVarint(nl) });
                  for (var k2 = 0; k2 < kept.length; k2++) newF2Parts.push({ copy: [kept[k2].start, kept[k2].end - kept[k2].start] });
                }
              } else {
                // 不可解析的容器：只有「大容器 + 直播标记」才整删（直播卡容器），否则原样
                if (sub.cl > 5000) { removed++; }
                else newF2Parts.push({ copy: [sub.start, sub.end - sub.start] });
              }
            }
            if (removed > 0 && !over()) {
              var newF2Len = 0;
              for (var p = 0; p < newF2Parts.length; p++) {
                newF2Len += newF2Parts[p].bytes ? newF2Parts[p].bytes.length : newF2Parts[p].copy[1];
              }
              var headBytes = encTag(2, 2).concat(encVarint(newF2Len));
              var total = f2.start + headBytes.length + newF2Len + (n - f2.end);
              var out = new Uint8Array(total);
              var posw = 0;
              if (f2.start > 0) { out.set(b.subarray(0, f2.start), 0); posw = f2.start; }
              for (var h = 0; h < headBytes.length; h++) out[posw++] = headBytes[h];
              for (var p2 = 0; p2 < newF2Parts.length; p2++) {
                var part = newF2Parts[p2];
                if (part.bytes) { for (var hb = 0; hb < part.bytes.length; hb++) out[posw++] = part.bytes[hb]; }
                else { var c0 = part.copy[0], cL = part.copy[1]; if (cL > 0) { out.set(b.subarray(c0, c0 + cL), posw); posw += cL; } }
              }
              if (f2.end < n) { out.set(b.subarray(f2.end, n), posw); posw = total; }
              // sanity：总长变短 + 所有标记清零 + 重解析通过
              var okS = (total < n) && (scanMarksInto(out, 0, total).length === 0) && (parseInto(out, 0, total) !== null);
              if (okS) { b = out; n = out.length; }
              else { removed = 0; }
            }
          }
        }
      }
    } catch (eB) { removed = 0; }

    if (removed > 0) {
      console.log('[tieba-frs] 删除:' + removed + ' (v6重建)');
      $done({ body: b });
      return;
    }

    // ============ 回退：v5 同长度清空（只清广告文档，直播不动） ============
    var adPos = [];
    var AD = [
      { c2: 0x61, rest: [0x64,0x5f,0x63,0x6f,0x6d,0x6d,0x6f,0x6e,0x22] },
      { c2: 0x63, rest: [0x72,0x65,0x61,0x74,0x69,0x76,0x65,0x5f,0x69,0x64,0x22] },
      { c2: 0x69, rest: [0x73,0x5f,0x68,0x69,0x64,0x65,0x5f,0x61,0x64,0x5f,0x74,0x61,0x67,0x22] }
    ];
    var CAP = (n >> 1) + n * 2 + 400000, steps = 0;
    for (var i = 0; i + 16 <= n; i++) {
      if ((++steps & 4095) === 0 && steps > CAP) break;
      if (b[i] !== 0x22) continue;
      var c2 = b[i + 1];
      for (var a = 0; a < AD.length; a++) {
        if (AD[a].c2 !== c2) continue;
        var ok = true;
        for (var j = 0; j < AD[a].rest.length; j++) { if (b[i + 2 + j] !== AD[a].rest[j]) { ok = false; break; } }
        if (ok) { adPos.push(i); break; }
      }
    }
    if (adPos.length === 0) { $done({}); return; }
    function objectStart(p) {
      var depth = 0, i = p;
      while (i >= 0) { var c = b[i]; if (c === 0x7d) depth++; else if (c === 0x7b) { if (depth === 0) return i; depth--; } i--; }
      return -1;
    }
    function objectEnd(start) {
      var depth = 0, inStr = false, esc = false;
      for (var k = start; k < n; k++) {
        var c = b[k];
        if (inStr) { if (esc) esc = false; else if (c === 0x5c) esc = true; else if (c === 0x22) inStr = false; }
        else { if (c === 0x22) inStr = true; else if (c === 0x7b) depth++; else if (c === 0x7d) { depth--; if (depth === 0) return k; } }
      }
      return -1;
    }
    function lengthPrefixMatches(s, contentLen) {
      if (s < 1) return false;
      var i = s - 1;
      while (i > 0 && (b[i - 1] & 0x80)) i--;
      var val = 0, shift = 0;
      for (var k = i; k < s; k++) { val += (b[k] & 0x7f) * Math.pow(2, shift); shift += 7; }
      return val === contentLen;
    }
    var ranges = [];
    for (var q = 0; q < adPos.length; q++) {
      var m2 = adPos[q];
      var s = objectStart(m2);
      if (s < 0) continue;
      var e = objectEnd(s);
      var cl = (e > s) ? (e - s + 1) : 0;
      if (b[s] === 0x7b && b[e] === 0x7d && cl > 0 && cl < 300000 && lengthPrefixMatches(s, cl)) ranges.push([s, e]);
    }
    ranges.sort(function (x, y) { return x[0] - y[0]; });
    var merged = [];
    for (var r = 0; r < ranges.length; r++) {
      var cur = ranges[r];
      if (merged.length && cur[0] <= merged[merged.length - 1][1]) { if (cur[1] > merged[merged.length - 1][1]) merged[merged.length - 1][1] = cur[1]; }
      else merged.push([cur[0], cur[1]]);
    }
    if (merged.length === 0) { $done({}); return; }
    var adBlanked = 0;
    for (var r2 = merged.length - 1; r2 >= 0; r2--) {
      var a0 = merged[r2][0], z0 = merged[r2][1];
      for (var k = a0 + 1; k < z0; k++) b[k] = 0x20;
      adBlanked++;
    }
    console.log('[tieba-frs] 广告文档清空:' + adBlanked + ' (v5回退)');
    $done({ body: b });
  } catch (e) {
    console.log('[tieba-frs] 出错，保持原响应: ' + e);
    $done({});
  }
})();

// 辅助：在外部 Uint8Array 里扫标记（sanity 用；主扫描用的是闭包里的 b）
function scanMarksInto(src, oStart, oEnd) {
  // 内联实现（避免依赖外层闭包变量）
  var PAT = [
    [0x62,0x64,0x74,0x69,0x65,0x62,0x61,0x6c,0x69,0x76,0x65,0x3a,0x2f,0x2f],
    [0x6c,0x69,0x76,0x65,0x43,0x68,0x61,0x6e,0x6e,0x65,0x6c,0x49,0x6e,0x66,0x6f],
    [0x22,0x61,0x64,0x5f,0x63,0x6f,0x6d,0x6d,0x6f,0x6e,0x22],
    [0x22,0x63,0x72,0x65,0x61,0x74,0x69,0x76,0x65,0x5f,0x69,0x64,0x22],
    [0x22,0x69,0x73,0x5f,0x68,0x69,0x64,0x65,0x5f,0x61,0x64,0x5f,0x74,0x61,0x67,0x22]
  ];
  var pos = [];
  for (var i = oStart; i + 4 <= oEnd; i++) {
    var c = src[i];
    if (c !== 0x62 && c !== 0x6c && c !== 0x22) continue;
    for (var m = 0; m < PAT.length; m++) {
      var pat = PAT[m];
      if (pat[0] !== c) continue;
      var ok = true;
      for (var j = 1; j < pat.length; j++) { if (src[i + j] !== pat[j]) { ok = false; break; } }
      if (ok) { pos.push(i); break; }
    }
  }
  return pos;
}
