// tieba-frs-page.js — Loon 脚本：贴吧帖子流/推荐流 去广告+删直播卡（v6.1：带逐项删除日志）
// 删除目标（整 item 删除 + protobuf 重建，不留空壳）：
//   1) 广告文档 item：ad_common / creative_id / is_hide_ad_tag（论坛流广告、推荐流商业卡）
//   2) 直播卡 item：  bdtiebalive:// / liveChannelInfo（论坛流/推荐流直播引流卡）
// 日志：[tieba-frs] 删除:N 广告(快手极速版) 广告(度小满) 直播(房间名) … 让你知道"删了哪个"
//       本次无广告时：[tieba-frs] 无广告/直播
// 安全：sanity(总长变短/标记清零/重解析通过) + 3s 预算；异常回退 v5 同长度清空（绝不改坏、绝不挂起）。
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
      for (var i = (from === undefined ? oStart : from); i + pat.length <= oEnd; i++) {
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

    var BDTIEBA = [0x62,0x64,0x74,0x69,0x65,0x62,0x61,0x6c,0x69,0x76,0x65,0x3a,0x2f,0x2f];
    var LIVECH = [0x6c,0x69,0x76,0x65,0x43,0x68,0x61,0x6e,0x6e,0x65,0x6c,0x49,0x6e,0x66,0x6f];
    var ADKEYS = [
      [0x22,0x61,0x64,0x5f,0x63,0x6f,0x6d,0x6d,0x6f,0x6e,0x22],
      [0x22,0x63,0x72,0x65,0x61,0x74,0x69,0x76,0x65,0x5f,0x69,0x64,0x22],
      [0x22,0x69,0x73,0x5f,0x68,0x69,0x64,0x65,0x5f,0x61,0x64,0x5f,0x74,0x61,0x67,0x22]
    ];
    var ALLMARKS = [BDTIEBA, LIVECH, ADKEYS[0], ADKEYS[1], ADKEYS[2]];

    function scanMarks(src, oStart, oEnd) {
      var pos = [];
      for (var i = oStart; i + 4 <= oEnd; i++) {
        var c = src[i];
        if (c !== 0x62 && c !== 0x6c && c !== 0x22) continue;
        for (var m = 0; m < ALLMARKS.length; m++) {
          var pat = ALLMARKS[m];
          if (pat[0] !== c) continue;
          var ok = true;
          for (var j = 1; j < pat.length; j++) { if (src[i + j] !== pat[j]) { ok = false; break; } }
          if (ok) { pos.push(i); break; }
        }
      }
      return pos;
    }
    function anyIn(pos, lo, hi) {
      for (var p = 0; p < pos.length; p++) if (pos[p] >= lo && pos[p] < hi) return true;
      return false;
    }
    function collect(src, oStart, oEnd, pat) {
      var out = [], i = oStart;
      while (true) {
        i = findIn(src, i, oEnd, pat, i);
        if (i < 0) break;
        out.push(i);
        i += pat.length;
      }
      return out;
    }
// ---------- 标签提取（UTF-8 解码，用于日志展示"删了哪个广告"）----------
    function utf8Slice(src, from, to, maxChars) {
      var s = '';
      for (var i = from; i < to && s.length < maxChars; i++) {
        var c = src[i];
        if (c < 0x80) s += String.fromCharCode(c);
        else if (c < 0xe0) { s += String.fromCharCode(((c & 0x1f) << 6) | (src[i + 1] & 0x3f)); i++; }
        else if (c < 0xf0) { s += String.fromCharCode(((c & 0x0f) << 12) | ((src[i + 1] & 0x3f) << 6) | (src[i + 2] & 0x3f)); i += 2; }
        else { i += 3; }
      }
      return s;
    }
    function keyValue(src, from, lim, keyBytes, maxChars) {
      // 找 "key":"value" 的 value（from 起、lim 止）；值读到闭合引号/反斜杠为止
      var q = findIn(src, from, lim, keyBytes);
      if (q < 0) return '';
      var i = q + keyBytes.length;
      if (i < lim && src[i] === 0x3a) i++;
      while (i < lim && src[i] === 0x20) i++;
      if (i >= lim || src[i] !== 0x22) return '';
      i++;
      var end = i;
      while (end < lim && end - i < 48 && src[end] !== 0x22 && src[end] !== 0x5c) end++;
      return utf8Slice(src, i, end, maxChars);
    }
    var K_USER_NAME = [0x22,0x75,0x73,0x65,0x72,0x5f,0x6e,0x61,0x6d,0x65,0x22];
    var K_THREAD_TITLE = [0x22,0x74,0x68,0x72,0x65,0x61,0x64,0x5f,0x74,0x69,0x74,0x6c,0x65,0x22];
    var K_TITLE = [0x22,0x74,0x69,0x74,0x6c,0x65,0x22];
    var K_DESC = [0x22,0x64,0x65,0x73,0x63,0x22];
    var K_FEED_TITLE = [0x22,0x66,0x65,0x65,0x64,0x5f,0x74,0x69,0x74,0x6c,0x65,0x22];
    function adLabel(docPos) {
      var lim = docPos + 4096; if (lim > n) lim = n;
      var v = keyValue(b, docPos, lim, K_USER_NAME, 12);
      if (v) return v;
      v = keyValue(b, docPos, lim, K_THREAD_TITLE, 12);
      if (v) return v;
      v = keyValue(b, docPos, lim, K_TITLE, 12);
      if (v) return v;
      v = keyValue(b, docPos, lim, K_DESC, 12);
      if (v) return v;
      return '-';
    }
    var K_ROOMTAG = [0x22,0x72,0x6f,0x6f,0x6d,0x54,0x61,0x67,0x22]; // "roomTag"
    var K_NAME = [0x22,0x6e,0x61,0x6d,0x65,0x22];                     // "name"
    function roomTagLabel(from, to) {
      var q = findIn(b, from, to, K_ROOMTAG);
      if (q < 0) return '';
      var lim = Math.min(q + 150, to);
      var q2 = findIn(b, q, lim, K_NAME);
      if (q2 < 0) return '';
      return keyValue(b, q2, Math.min(q2 + 60, to), K_NAME, 12);
    }
    function liveLabel(from, to) {
      var v = keyValue(b, from, to, K_FEED_TITLE, 12);
      if (v) return v;
      v = keyValue(b, from, to, K_TITLE, 12);
      if (v) return v;
      v = roomTagLabel(from, to);
      return v || '-';
    }
    // ============ v6.2 删除重建（含逐项日志） ============
    var removed = 0, labels = [];
    try {
      var top = parseInto(b, 0, n);
      if (top && !over()) {
        var f2 = null;
        for (var t = 0; t < top.length; t++) if (top[t].no === 2 && top[t].wire === 2) { f2 = top[t]; break; }
        if (f2 && f2.cs !== null) {
          var subs = parseInto(b, f2.cs, f2.cs + f2.cl);
          if (subs && !over()) {
            var newF2Parts = [];
            for (var si = 0; si < subs.length; si++) {
              var sub = subs[si];
              if (sub.wire !== 2 || sub.cl === 0) { newF2Parts.push({ c: [sub.start, sub.end - sub.start] }); continue; }
              var pos = scanMarks(b, sub.cs, sub.cs + sub.cl);
              if (pos.length === 0) { newF2Parts.push({ c: [sub.start, sub.end - sub.start] }); continue; }
              var items = parseInto(b, sub.cs, sub.cs + sub.cl);
              if (!items) {
                if (sub.cl > 5000) { removed++; labels.push('块级广告/直播'); }
                else newF2Parts.push({ c: [sub.start, sub.end - sub.start] });
                continue;
              }
              var kept = [];
              for (var ii = 0; ii < items.length; ii++) {
                var it = items[ii];
                if (!(it.wire === 2 && it.cl > 0) || !anyIn(pos, it.cs, it.cs + it.cl)) { kept.push(it); continue; }
                removed++;
                var docs = collect(b, it.cs, it.cs + it.cl, ADKEYS[0])
                  .concat(collect(b, it.cs, it.cs + it.cl, ADKEYS[1]))
                  .concat(collect(b, it.cs, it.cs + it.cl, ADKEYS[2]));
                if (docs.length) {
                  var pushed = 0;
                  for (var d = 0; d < docs.length; d++) {
                    if (labels.length >= 12) break;
                    labels.push('广告(' + adLabel(docs[d]) + ')');
                    pushed++;
                  }
                  if (docs.length > pushed) labels.push('广告余' + (docs.length - pushed) + '项');
                } else {
                  labels.push('直播(' + liveLabel(it.cs, it.cs + it.cl) + ')');
                }
              }
              if (kept.length === items.length) { newF2Parts.push({ c: [sub.start, sub.end - sub.start] }); continue; }
              var nl = 0;
              for (var k1 = 0; k1 < kept.length; k1++) nl += kept[k1].end - kept[k1].start;
              newF2Parts.push({ b: encTag(sub.no, 2) });
              newF2Parts.push({ b: encVarint(nl) });
              for (var k2 = 0; k2 < kept.length; k2++) newF2Parts.push({ c: [kept[k2].start, kept[k2].end - kept[k2].start] });
            }
            if (removed > 0 && !over()) {
              var newF2Len = 0;
              for (var p = 0; p < newF2Parts.length; p++) newF2Len += newF2Parts[p].b ? newF2Parts[p].b.length : newF2Parts[p].c[1];
              var headBytes = encTag(2, 2).concat(encVarint(newF2Len));
              var total = f2.start + headBytes.length + newF2Len + (n - f2.end);
              var out = new Uint8Array(total);
              var posw = 0;
              if (f2.start > 0) { out.set(b.subarray(0, f2.start), 0); posw = f2.start; }
              for (var h = 0; h < headBytes.length; h++) out[posw++] = headBytes[h];
              for (var p2 = 0; p2 < newF2Parts.length; p2++) {
                var part = newF2Parts[p2];
                if (part.b) { for (var hb = 0; hb < part.b.length; hb++) out[posw++] = part.b[hb]; }
                else { var c0 = part.c[0], cL = part.c[1]; if (cL > 0) { out.set(b.subarray(c0, c0 + cL), posw); posw += cL; } }
              }
              if (f2.end < n) out.set(b.subarray(f2.end, n), posw);
              // sanity：总长变短 + 所有标记清零 + 重解析通过
              var okS = (total < n) && (scanMarks(out, 0, total).length === 0) && (parseInto(out, 0, total) !== null);
              if (okS) { b = out; n = out.length; }
              else { removed = 0; labels = []; }
            }
          }
        }
      }
    } catch (eB) { removed = 0; labels = []; }

    if (removed > 0) {
      var msg = labels.join(' ');
      if (msg.length > 160) msg = msg.substring(0, 160) + '…';
      console.log('[tieba-frs] 删除:' + removed + ' ' + msg);
      $done({ body: b });
      return;
    }
    // ===== 回退：同长度清空（v5 行为，只清广告文档；重建不适用时兜底） =====
    var CAP = (n >> 1) + n * 2 + 400000, steps = 0, adPos = [];
    for (var i = 0; i + 16 <= n; i++) {
      if ((++steps & 4095) === 0 && steps > CAP) break;
      if (b[i] !== 0x22) continue;
      var hit = false;
      for (var a = 0; a < ADKEYS.length; a++) {
        var A = ADKEYS[a];
        if (b[i + 1] !== A[1]) continue;
        hit = true;
        for (var j = 2; j < A.length; j++) { if (b[i + j] !== A[j]) { hit = false; break; } }
        if (hit) break;
      }
      if (hit) adPos.push(i);
    }
    function objectStart(p) {
      var depth = 0, i = p;
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
    if (merged.length === 0) {
      console.log('[tieba-frs] 无广告/直播');
      $done({});
      return;
    }
    for (var r2 = merged.length - 1; r2 >= 0; r2--) {
      var a0 = merged[r2][0], z0 = merged[r2][1];
      for (var k3 = a0 + 1; k3 < z0; k3++) b[k3] = 0x20;
    }
    console.log('[tieba-frs] 广告文档清空:' + merged.length + ' (回退模式)');
    $done({ body: b });
  } catch (e) {
    console.log('[tieba-frs] 出错，保持原响应: ' + e);
    $done({});
  }
})();