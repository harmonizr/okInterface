// var body = $response.body;//声明一个变量body并以响应消息体赋值
// var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理

// obj.datas.vipFlagInfo.type = 1;
// obj.datas.freeCount = 1;

// body = JSON.stringify(obj);//重新打包回json字符串
// $done({body});//结束修改


// 懒人英语阅读 VIP 解锁脚本
const env = new Env("英语音标");
const body = $response.body;
const url = $request.url || "";

// 仅处理 QueryVipUser 接口
if (!url.includes("wordIds")) {
  env.done();
  return;
}

(async () => {
  try {
    // 加载 CryptoJS 工具库
    const utils = await loadUtils();
    if (!utils || typeof utils.createCryptoJS!== "function") {
      throw new ReferenceError("Utils 或 createCryptoJS 方法未正确加载");
    }
    const crypto = utils.createCryptoJS();
    const jsonBody = JSON.parse(body);

    // 仅处理包含 datast 加密字段的响应
    if (jsonBody.datast) {
      // DES 密钥/IV：均为 QueryVipUser Base64 解码
      const key = crypto.enc.Base64.parse("wordIds");
      const iv = crypto.enc.Base64.parse("wordIds");
      // 解密 datast 字段
      const decryptStr = DES_Decrypt(jsonBody.datast, key, iv, crypto);
      const decryptJson = JSON.parse(decryptStr);
      console.log(decryptJson)
      
      // 篡改 VIP 信息：永久有效期 + 解锁VIP
      decryptJson.datas.freeCount = 1;
      
      // 重新加密并替换原字段
      jsonBody.datast = DES_Encrypt(JSON.stringify(decryptJson), key, iv, crypto);
    }

    // 返回篡改后的响应
    env.done({ body: JSON.stringify(jsonBody) });
  } catch (error) {
    env.logErr("脚本运行异常：", error);
    env.done({ body }); // 异常时返回原响应
  }
})();

// DES-CBC 解密
function DES_Decrypt(ciphertext, key, iv, crypto) {
  const decrypt = crypto.DES.decrypt(
    { ciphertext: crypto.enc.Base64.parse(ciphertext) },
    key,
    { iv: iv, mode: crypto.mode.CBC, padding: crypto.pad.Pkcs7 }
  );
  return decrypt.toString(crypto.enc.Utf8);
}

// DES-CBC 加密
function DES_Encrypt(plaintext, key, iv, crypto) {
  const encrypt = crypto.DES.encrypt(
    crypto.enc.Utf8.parse(plaintext),
    key,
    { iv: iv, mode: crypto.mode.CBC, padding: crypto.pad.Pkcs7 }
  );
  return encrypt.ciphertext.toString(crypto.enc.Base64);
}

// 动态加载 CryptoJS 工具库
async function loadUtils() {
  const localScript = env.getdata("Utils_Code") || "";
  if (localScript && localScript.length) {
    eval(localScript);
    return creatUtils();
  }
  // 远程加载地址
  const utilsUrl = "https://cdn.jsdelivr.net/gh/zxxn777/Surge@main/Utils/Utils.js";
  return new Promise((resolve, reject) => {
    env.get({ url: utilsUrl }, (err, resp, data) => {
      if (err) {
        env.logErr(err);
        reject(err);
        return;
      }
      env.setdata(data, "Utils_Code"); // 缓存到本地
      eval(data);
      resolve(creatUtils());
    });
  });
}

// 防篡改校验（可忽略）
(function () {
  const encode = 'jsjiami.com';
  const alertFn = (msg) => {
    if (typeof alert!== "undefined") alert(msg);
    if (typeof console!== "undefined") console.log(msg);
  };
  const combine = (a, b) => a + b;
  const tipMsg = combine("删除", combine(combine("版本号，js会定", "期弹窗，"), "还请支持我们的工作"));
  try {
    if (!(typeof encode!== "undefined" && encode === combine("jsjia", "mi.com"))) {
      alertFn(tipMsg);
    }
  } catch (e) {
    alertFn(tipMsg);
  }
})();

// Env 环境类（Surge/Quantumult X/Loon 通用，无需修改）
function Env(t, e) {
  class s {
    constructor(t) {
      this.env = t;
    }
    send(t, e = "GET") {
      t = "string" == typeof t? { url: t } : t;
      let s = this.get;
      return "POST" === e && (s = this.post), new Promise((e, a) => {
        s.call(this, t, (t, s, r) => {
          t? a(t) : e(s);
        });
      });
    }
    get(t) {
      return this.send.call(this.env, t);
    }
    post(t) {
      return this.send.call(this.env, t, "POST");
    }
  }
  return new class {
    constructor(t, e) {
      this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute =!1, this.isNeedRewrite =!1, this.logSeparator = "\n", this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`);
    }
    getEnv() {
      return "undefined"!= typeof $environment && $environment["surge-version"]? "Surge" : "undefined"!= typeof $environment && $environment["stash-version"]? "Stash" : "undefined"!= typeof module && module.exports? "Node.js" : "undefined"!= typeof $task? "Quantumult X" : "undefined"!= typeof $loon? "Loon" : "undefined"!= typeof $rocket? "Shadowrocket" : void 0;
    }
    isNode() {
      return "Node.js" === this.getEnv();
    }
    isQuanX() {
      return "Quantumult X" === this.getEnv();
    }
    isSurge() {
      return "Surge" === this.getEnv();
    }
    isLoon() {
      return "Loon" === this.getEnv();
    }
    isShadowrocket() {
      return "Shadowrocket" === this.getEnv();
    }
    isStash() {
      return "Stash" === this.getEnv();
    }
    toObj(t, e = null) {
      try {
        return JSON.parse(t);
      } catch {
        return e;
      }
    }
    toStr(t, e = null) {
      try {
        return JSON.stringify(t);
      } catch {
        return e;
      }
    }
    getjson(t, e) {
      let s = e;
      const a = this.getdata(t);
      if (a) try {
        s = JSON.parse(this.getdata(t));
      } catch { }
      return s;
    }
    setjson(t, e) {
      try {
        return this.setdata(JSON.stringify(t), e);
      } catch {
        return!1;
      }
    }
    getScript(t) {
      return new Promise(e => {
        this.get({ url: t }, (t, s, a) => e(a));
      });
    }
    runScript(t, e) {
      return new Promise(s => {
        let a = this.getdata("@chavy_boxjs_userCfgs.httpapi");
        a = a? a.replace(/\n/g, "").trim() : a;
        let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
        r = r? 1 * r : 20, r = e && e.timeout? e.timeout : r;
        const [i, o] = a.split("@"), n = {
          url: `http://${o}/v1/scripting/evaluate`,
          body: { script_text: t, mock_type: "cron", timeout: r },
          headers: { "X-Key": i, Accept: "*/*" },
          timeout: r
        };
        this.post(n, (t, e, a) => s(a))
      }).catch(t => this.logErr(t));
    }
    loaddata() {
      if (!this.isNode()) return {};
      {
        this.fs = this.fs? this.fs : require("fs"), this.path = this.path? this.path : require("path");
        const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a =!s && this.fs.existsSync(e);
        if (!s &&!a) return {};
        {
          const a = s? t : e;
          try {
            return JSON.parse(this.fs.readFileSync(a));
          } catch (t) {
            return {};
          }
        }
      }
    }
    writedata() {
      if (this.isNode()) {
        this.fs = this.fs? this.fs : require("fs"), this.path = this.path? this.path : require("path");
        const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), a =!s && this.fs.existsSync(e), r = JSON.stringify(this.data);
        s? this.fs.writeFileSync(t, r) : a? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r);
      }
    }
    lodash_get(t, e, s) {
      const a = e.replace(/\[(\d+)\]/g, ".$1").split(".");
      let r = t;
      for (const t of a) if (r = Object(r)[t], void 0 === r) return s;
      return r;
    }
    lodash_set(t, e, s) {
      return Object(t)!== t? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, a) => Object(t[s]) === t[s]? t[s] : t[s] = Math.abs(e[a + 1]) >> 0 == +e[a + 1]? [] : {}, t)[e[e.length - 1]] = s, t);
    }
    getdata(t) {
      let e = this.getval(t);
      if (/^@/.test(t)) {
        const [, s, a] = /^@(.*?)\.(.*?)$/.exec(t), r = s? this.getval(s) : "";
        if (r) try {
          const t = JSON.parse(r);
          e = t? this.lodash_get(t, a, "") : e;
        } catch (t) {
          e = "";
        }
      }
      return e;
    }
    setdata(t, e) {
      let s =!1;
      if (/^@/.test(e)) {
        const [, a, r] = /^@(.*?)\.(.*?)$/.exec(e), i = this.getval(a), o = a? "null" === i? null : i || "{}" : "{}";
        try {
          const e = JSON.parse(o);
          this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), a);
        } catch (e) {
          const i = {};
          this.lodash_set(i, r, t), s = this.setval(JSON.stringify(i), a);
        }
      } else s = this.setval(t, e);
      return s;
    }
    getval(t) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
          return $persistentStore.read(t);
        case "Quantumult X":
          return $prefs.valueForKey(t);
        case "Node.js":
          return this.data = this.loaddata(), this.data[t];
        default:
          return this.data && this.data[t] || null;
      }
    }
    setval(t, e) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
          return $persistentStore.write(t, e);
        case "Quantumult X":
          return $prefs.setValueForKey(t, e);
        case "Node.js":
          return this.data = this.loaddata(), this.data[e] = t, this.writedata(),!0;
        default:
          return this.data && this.data[e] || null;
      }
    }
    initGotEnv(t) {
      this.got = this.got? this.got : require("got"), this.cktough = this.cktough? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar));
    }
    get(t, e = (() => { })) {
      switch (t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"], delete t.headers["content-type"], delete t.headers["content-length"]), t.params && (t.url += "?" + this.queryStr(t.params)), this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        default:
          this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting":!1 })), $httpClient.get(t, (t, s, a) => {
           !t && s && (s.body = a, s.statusCode = s.status? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a);
          });
          break;
        case "Quantumult X":
          this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints:!1 })), $task.fetch(t).then(t => {
            const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t;
            e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o);
          }, t => e(t && t.error || "UndefinedError"));
          break;
        case "Node.js":
          let s = require("iconv-lite");
          this.initGotEnv(t), this.got(t).on("redirect", (t, e) => {
            try {
              if (t.headers["set-cookie"]) {
                const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();
                s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar;
              }
            } catch (t) {
              this.logErr(t);
            }
          }).then(t => {
            const { statusCode: a, statusCode: r, headers: i, rawBody: o } = t, n = s.decode(o, this.encoding);
            e(null, { status: a, statusCode: r, headers: i, rawBody: o, body: n }, n);
          }, t => {
            const { message: a, response: r } = t;
            e(a, r, r && s.decode(r.rawBody, this.encoding));
          });
      }
    }
    post(t, e = (() => { })) {
      const s = t.method? t.method.toLocaleLowerCase() : "post";
      switch (t.body && t.headers &&!t.headers["Content-Type"] &&!t.headers["content-type"] && (t.headers["content-type"] = "application/x-www-form-urlencoded"), t.headers && (delete t.headers["Content-Length"], delete t.headers["content-length"]), this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        default:
          this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting":!1 })), $httpClient[s](t, (t, s, a) => {
           !t && s && (s.body = a, s.statusCode = s.status? s.status : s.statusCode, s.status = s.statusCode), e(t, s, a);
          });
          break;
        case "Quantumult X":
          t.method = s, this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints:!1 })), $task.fetch(t).then(t => {
            const { statusCode: s, statusCode: a, headers: r, body: i, bodyBytes: o } = t;
            e(null, { status: s, statusCode: a, headers: r, body: i, bodyBytes: o }, i, o);
          }, t => e(t && t.error || "UndefinedError"));
          break;
        case "Node.js":
          let a = require("iconv-lite");
          this.initGotEnv(t);
          const { url: r,...i } = t;
          this.got[s](r, i).then(t => {
            const { statusCode: s, statusCode: r, headers: i, rawBody: o } = t, n = a.decode(o, this.encoding);
            e(null, { status: s, statusCode: r, headers: i, rawBody: o, body: n }, n);
          }, t => {
            const { message: s, response: r } = t;
            e(s, r, r && a.decode(r.rawBody, this.encoding));
          });
      }
    }
    time(t, e = null) {
      const s = e? new Date(e) : new Date;
      let a = {
        "M+": s.getMonth() + 1,
        "d+": s.getDate(),
        "H+": s.getHours(),
        "m+": s.getMinutes(),
        "s+": s.getSeconds(),
        "q+": Math.floor((s.getMonth() + 3) / 3),
        S: s.getMilliseconds()
      };
      /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length)));
      for (let e in a) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length? a[e] : ("00" + a[e]).substr(("" + a[e]).length)));
      return t;
    }
    queryStr(t) {
      let e = "";
      for (const s in t) {
        let a = t[s];
        null!= a && ""!== a && ("object" == typeof a && (a = JSON.stringify(a)), e += `${s}=${a}&`);
      }
      return e = e.substring(0, e.length - 1), e;
    }
    msg(e = t, s = "", a = "", r) {
      const i = t => {
        switch (typeof t) {
          case void 0:
            return t;
          case "string":
            switch (this.getEnv()) {
              case "Surge":
              case "Stash":
              default:
                return { url: t };
              case "Loon":
              case "Shadowrocket":
                return t;
              case "Quantumult X":
                return { "open-url": t };
              case "Node.js":
                return;
            }
          case "object":
            switch (this.getEnv()) {
              case "Surge":
              case "Stash":
              case "Shadowrocket":
              default: {
                let e = t.url || t.openUrl || t["open-url"];
                return { url: e };
              }
              case "Loon": {
                let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"];
                return { openUrl: e, mediaUrl: s };
              }
              case "Quantumult X": {
                let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl, a = t["update-pasteboard"] || t.updatePasteboard;
                return { "open-url": e, "media-url": s, "update-pasteboard": a };
              }
              case "Node.js":
                return;
            }
          default:
            return;
        }
      };
      if (!this.isMute) switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        default:
          $notification.post(e, s, a, i(r));
          break;
        case "Quantumult X":
          $notify(e, s, a, i(r));
          break;
        case "Node.js":
          break;
      }
      if (!this.isMuteLog) {
        let t = ["", "==============📣系统通知📣=============="];
        t.push(e), s && t.push(s), a && t.push(a), console.log(t.join("\n")), this.logs = this.logs.concat(t);
      }
    }
    log(...t) {
      t.length > 0 && (this.logs = [...this.logs,...t]), console.log(t.join(this.logSeparator));
    }
    logErr(t, e) {
      switch (this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        case "Quantumult X":
        default:
          this.log("", `❗️${this.name}, 错误!`, t);
          break;
        case "Node.js":
          this.log("", `❗️${this.name}, 错误!`, t.stack);
      }
    }
    wait(t) {
      return new Promise(e => setTimeout(e, t));
    }
    done(t = {}) {
      const e = (new Date).getTime(), s = (e - this.startTime) / 1e3;
      switch (this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), this.getEnv()) {
        case "Surge":
        case "Loon":
        case "Stash":
        case "Shadowrocket":
        case "Quantumult X":
        default:
          $done(t);
          break;
        case "Node.js":
          process.exit(1);
      }
    }
  }(t, e);
}