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
                  if (it.wire === 2 && it.cl > 0 && anyIn(pos, it.cs, it.cs 