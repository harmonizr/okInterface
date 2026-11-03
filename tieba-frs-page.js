// tieba-frs-page.js — Loon 脚本：贴吧帖子流/推荐流去广告 + 删直播卡（v5）
// [A] 广告文档同长度清空：ad_common / creative_id / is_hide_ad_tag 内嵌 JSON 文档
//     原地改成同长度空对象（长度不变），长度前缀精确匹配才动手。
// [B] 直播引流卡整段删除：直播 item（含 bdtiebalive:// scheme）是二进制 feed 里的
//     长度前缀子消息。删掉后自底向上重编外层长度前缀。带 sanity 校验 + 3s 墙钟预算，
//     任何异常都回退到「只做了 [A]」的安全结果。
// 运行要求：requires_body=true, binary_body_mode=true

(function () {
  try {
    var body = $response.body;
    if (!body || body.length === 0) { $done({}); return; }
    var b = body, n = b.length;
    if (n < 64) { $done({}); return; }

    var T0 = Date.now();
    function over() { return (Date.now() - T0) > 3000; }

    // ---------- varint ----------
    function encVarint(v) {
      var out = [];
      while (v >= 0x80) { out.push((v & 0x7f) | 0x80); v >>>= 7; }
      out.push(v & 0x7f);
      return out;
    }
    function encTag(no, wire) { return encVarint((no << 3) | wire); }

    // 在 src[oStart,oEnd) 内找 pat（from 起），返回下标或 -1
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

    // 解析一层 protobuf 字段；src 支持 Uint8Array/Array；返回记录数组或 null（失败）
    function parseInto(src, oStart, oEnd) {
      var out = [], i = oStart;
      while (i < oEnd) {
        var s0 = i, r = 0, s = 0;
        if (i >= oEnd) return null;
        while (i < oEnd && (src[i] & 0x80)) { r += (src[i] & 0x7f) * Math.pow(2, s); s += 7; i++; }
        if (i >= oEnd) return null;
        r += src[i] * Math.pow(2, s); i++;
        var tag = r, fno = tag >> 3, wire = tag & 7;
        var rec = { no: fno, wire: wire, start: s0, end: i, cs: null, cl: 0 };
        if (wire === 0) {
          r = 0; s = 0;
          if (i >= oEnd) return null;
          while (i < oEnd && (src[i] & 0x80)) { r += (src[i] & 0x7f) * Math.pow(2, s); s += 7; i++; }
          if (i >= oEnd) return null;
          r += src[i] * Math.pow(2, s); i++;
          rec.end = i;
        } else if (wire === 2) {
          r = 0; s = 0;
          if (i >= oEnd) return null;
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

    // ---------- [A] 广告文档同长度清空 ----------
    var AD = [
      { c2: 0x61, rest: [0x64,0x5f,0x63,0x6f,0x6d,0x6d,0x6f,0x6e,0x22] },
      { c2: 0x63, rest: [0x72,0x65,0x61,0x74,0x69,0x76,0x65,0x5f,0x69,0x64,0x22] },
      { c2: 0x69, rest: [0x73,0x5f,0x68,0x69,0x64,0x65,0x5f,0x61,0x64,0x5f,0x74,0x61,0x67,0x22] }
    ];
    var adPos = [], CAP = (n >> 1) + n * 2 + 400000, steps = 0;
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
    function objectStart(pos) {
      var depth = 0, i = pos;
      while (i >= 0) {
        var c = b[i];
        if (c === 0x7d) depth++;
        else if (c === 0x7b) { if (depth === 0) return i; depth--; }
        i--;
      }
      return -1;
    }
    function objectEnd(start) {
      var depth = 0, inStr = false, esc = false;
      for (var k = start; k < n; k++) {
        var c = b[k];
        if (inStr) {
          if (esc) esc = false;
          else if (c === 0x5c) esc = true;
          else if (c === 0x22) inStr = false;
        } else {
          if (c === 0x22) inStr = true;
          else if (c === 0x7b) depth++;
          else if (c === 0x7d) { depth--; if (depth === 0) return k; }
        }
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
      var m = adPos[q];
      var s = objectStart(m);
      if (s < 0) continue;
      var e = objectEnd(s);
      var cl = (e > s) ? (e - s + 1) : 0;
      if (b[s] === 0x7b && b[e] === 0x7d && cl > 0 && cl < 300000 && lengthPrefixMatches(s, cl)) {
        ranges.push([s, e]);
      }
    }
    ranges.sort(function (x, y) { return x[0] - y[0]; });
    var merged = [];
    for (var r = 0; r < ranges.length; r++) {
      var cur = ranges[r];
      if (merged.length && cur[0] <= merged[merged.length - 1][1]) {
        if (cur[1] > merged[merged.length - 1][1]) merged[merged.length - 1][1] = cur[1];
      } else merged.push([cur[0], cur[1]]);
    }
    var adBlanked = 0;
    for (var r2 = merged.length - 1; r2 >= 0; r2--) {
      var a0 = merged[r2][0], z0 = merged[r2][1];
      for (var k = a0 + 1; k < z0; k++) b[k] = 0x20;
      adBlanked++;
    }

    // ---------- [B] 直播卡整段删除（重建 + sanity + 3s 预算） ----------
    var LIVE = [0x62,0x64,0x74,0x69,0x65,0x62,0x61,0x6c,0x69,0x76,0x65,0x3a,0x2f,0x2f]; // bdtiebalive://
    var liveDeleted = 0, rebuilt = false;
    try {
      var top = parseInto(b, 0, n);
      if (top && !over()) {
        var f2 = null;
        for (var t = 0; t < top.length; t++) { if (top[t].no === 2 && top[t].wire === 2) { f2 = top[t]; break; } }
        if (f2 && f2.cs !== null) {
          var subs = parseInto(b, f2.cs, f2.cs + f2.cl);
          if (subs && !over()) {
            // 每个 field2 子字段：若其 item 里有直播 item → 重建；否则原样
            var newF2Parts = [];   // 每项: 要么 {bytes:[...]}（重建/头），要么 {copy:[off,len]}（原样）
            var liveTotal = 0;
            for (var si = 0; si < subs.length; si++) {
              var sub = subs[si];
              // 每个子字段各自快速搜直播标记（线性扫描，代价可忽略；保证多子字段含直播也不漏）
              var hasMarkerHere = (sub.wire === 2 && findIn(b, sub.cs, sub.cs + sub.cl, LIVE) >= 0);
              if (sub.wire === 2 && sub.cl > 200 && hasMarkerHere && !over()) {
                var items = parseInto(b, sub.cs, sub.cs + sub.cl);
                if (items) {
                  var kept = [];
                  for (var ii = 0; ii < items.length; ii++) {
                    var it = items[ii];
                    if (it.wire === 2 && it.cl > 0 && findIn(b, it.cs, it.cs + it.cl, LIVE) >= 0) {
                      liveTotal++;            // 直播 item，丢弃
                    } else {
                      kept.push(it);
                    }
                  }
                  if (liveTotal > 0) {
                    newF2Parts.push({ bytes: encTag(sub.no, 2) });
                    var newSubLen = 0;
                    for (var kk = 0; kk < kept.length; kk++) newSubLen += (kept[kk].end - kept[kk].start);
                    newF2Parts.push({ bytes: encVarint(newSubLen) });
                    for (var kk2 = 0; kk2 < kept.length; kk2++) {
                      newF2Parts.push({ copy: [kept[kk2].start, kept[kk2].end - kept[kk2].start] });
                    }
                  } else {
                    newF2Parts.push({ copy: [sub.start, sub.end - sub.start] });
                  }
                } else {
                  newF2Parts.push({ copy: [sub.start, sub.end - sub.start] });
                }
              } else {
                newF2Parts.push({ copy: [sub.start, sub.end - sub.start] });
              }
            }
            if (liveTotal > 0) {
              // 计算 newF2Content 长度
              var newF2Len = 0;
              for (var p = 0; p < newF2Parts.length; p++) {
                newF2Len += (newF2Parts[p].bytes ? newF2Parts[p].bytes.length : newF2Parts[p].copy[1]);
              }
              // 组装完整新 body： [0,f2.start) + F2头 + newF2Content + (f2.end,n)
              var headBytes = encTag(2, 2).concat(encVarint(newF2Len));
              var total = f2.start + headBytes.length + newF2Len + (n - f2.end);
              var out = new Uint8Array(total);
              var pos = 0;
              // 1) f2 之前
              if (f2.start > 0) { out.set(b.subarray(0, f2.start), 0); pos = f2.start; }
              // 2) F2 头
              for (var h = 0; h < headBytes.length; h++) out[pos++] = headBytes[h];
              // 3) newF2Content
              for (var p2 = 0; p2 < newF2Parts.length; p2++) {
                var part = newF2Parts[p2];
                if (part.bytes) {
                  for (var hb = 0; hb < part.bytes.length; hb++) out[pos++] = part.bytes[hb];
                } else {
                  var c0 = part.copy[0], cL = part.copy[1];
                  if (cL > 0) { out.set(b.subarray(c0, c0 + cL), pos); pos += cL; }
                }
              }
              // 4) f2 之后
              if (f2.end < n) { out.set(b.subarray(f2.end, n), pos); pos = total; }

              // ---- sanity ----
              var okS = (total < n) && (findIn(out, 0, total, LIVE) < 0);
              if (okS) {
                var reparsed = parseInto(out, 0, total);
                okS = (reparsed !== null);
              }
              if (okS) { b = out; n = out.length; rebuilt = true; liveDeleted = liveTotal; }
            }
          }
        }
      }
    } catch (eB) {
      // 回退：保留 [A] 结果
      liveDeleted = 0; rebuilt = false;
    }

    if (adBlanked === 0 && liveDeleted === 0) { $done({}); return; }
    console.log('[tieba-frs] 广告文档:' + adBlanked + ' 直播删除:' + liveDeleted + (rebuilt ? '' : '(未重建)'));
    $done({ body: b });
  } catch (e) {
    console.log('[tieba-frs] 出错，保持原响应: ' + e);
    $done({});
  }
})();
