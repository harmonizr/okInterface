// ============================================================
// 贴吧「推荐」信息流 native 广告移除（excellent/personalized protobuf 手术）
// 用法：[Script] 响应脚本，requires_body=true, binary_body_mode=true
// 原理：响应是 protobuf，广告卡是主消息里的一个重复项(整卡含 "ad_common"/"ad_id"/"ad_title")。
//       解析 protobuf，删掉含广告标记的 depth-1 项，再重编码。正常 feed 项原样保留。
//       出错时 $done({}) 原样放行，绝不弄坏 feed。
// ============================================================
(function () {
  var MARKERS = ['"ad_common"', '"ad_id"', '"ad_title"'];
  function bytesToStr(b) { var s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i] & 0xff); return s; }
  function hasMarker(b) { if (!b) return false; var s = bytesToStr(b); for (var i = 0; i < MARKERS.length; i++) if (s.indexOf(MARKERS[i]) !== -1) return true; return false; }
  function encVarint(n) { var out = []; while (true) { var b = n & 0x7f; n >>>= 7; if (n) out.push(b | 0x80); else { out.push(b); break; } } return out; }
  function decVarint(buf, i) { var r = 0, s = 0, x; for (;;) { x = buf[i]; i++; r |= (x & 0x7f) << s; if (!(x & 0x80)) return [r, i]; s += 7; } }
  function parseItems(buf) {
    var items = [], i = 0, n = buf.length;
    while (i < n) {
      var st = i, tag2;
      try { tag2 = decVarint(buf, i); } catch (e) { break; }
      i = tag2[1]; var fn = tag2[0] >> 3, wt = tag2[0] & 7;
      if (wt === 2) { var ln2 = decVarint(buf, i); i = ln2[1]; var ln = ln2[0]; if (i + ln > n) break;
        items.push({ fn: fn, content: buf.subarray(i, i + ln), full: buf.subarray(st, i + ln) }); i += ln; }
      else if (wt === 0) { var v = decVarint(buf, i); i = v[1]; items.push({ fn: fn, content: null, full: buf.subarray(st, i) }); }
      else if (wt === 5) { i += 4; items.push({ fn: fn, content: null, full: buf.subarray(st, i) }); }
      else if (wt === 1) { i += 8; items.push({ fn: fn, content: null, full: buf.subarray(st, i) }); }
      else break;
    }
    return items;
  }
  function concat(arr) { var total = 0; for (var k = 0; k < arr.length; k++) total += arr[k].length; var o = new Uint8Array(total), p = 0;
    for (var k2 = 0; k2 < arr.length; k2++) { o.set(arr[k2], p); p += arr[k2].length; } return o; }
  function stripAds(buf) {
    var top = parseItems(buf); if (top.length === 0) return buf;
    var out = [];
    for (var i = 0; i < top.length; i++) { var t = top[i];
      if (t.content && hasMarker(t.content)) {
        var sub = parseItems(t.content), kept = [];
        for (var j = 0; j < sub.length; j++) { var s = sub[j]; if (s.content && hasMarker(s.content)) continue; kept.push(s.full); }
        var nb = concat(kept), tag = encVarint((t.fn << 3) | 2);
        out.push(concat([new Uint8Array(tag), new Uint8Array(encVarint(nb.length)), nb]));
      } else out.push(t.full);
    }
    return out.length ? concat(out) : buf;
  }

  try {
    var resp = $response;
    var bytes = (resp.body instanceof Uint8Array) ? resp.body : null;
    if (!bytes) { $done({}); return; }
    var headers = Object.assign({}, resp.headers || {});
    // 无论是否检测到 gzip，只要改 body 就清掉 content-encoding / content-length，
    // 避免把“未压缩的 protobuf”配上一个 gzip 头导致客户端解压失败
    if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b && typeof $utils !== 'undefined' && $utils.ungzip) {
      bytes = $utils.ungzip(bytes);
    }
    for (var hk in headers) { var lk = hk.toLowerCase(); if (lk === 'content-encoding' || lk === 'content-length') delete headers[hk]; }
    var out = stripAds(bytes);
    if (out.length === 0) { $done({}); return; }
    console.log('tieba ad strip: ' + bytes.length + ' -> ' + out.length);
    $done({ status: resp.status, headers: headers, body: out });
  } catch (e) { $done({}); }
})();
