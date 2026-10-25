# 哈啰净化 · Loon 版插件说明

把 QX 的 `helloobike.snippet`（TG@ZenMoFiShi）移植成 Loon 可用的 Snippet。
上游脚本保持自动更新：运行时从 `raw.githubusercontent.com/ZenmoFeiShi/Qx/main/easybike-ad.js` 拉取，本地缓存 6 小时。

## 安装

1. 打开 `helloobike-loon.snippet`，全选复制。
2. Loon → 设置 → 模块 → 片段 → 右上角 **+** → 粘贴 → 保存。
3. 确认 **Loon → 设置 → 常规/代理 → MITM** 已开启并安装了 CA 证书（HTTPS 改包必需）。
4. 确保哈啰出行 App 的流量走 Loon（全局代理，或把哈啰加进"代理 App 列表"）。

## 工作原理（QX → Loon 映射）

| QX 原片 | Loon 版 |
|---|---|
| `url reject-200`（4 条广告 SDK 拦截） | 原样保留，放入 `[Rule]` |
| `url script-echo-response`（钱包金融模板回显） | `url script-response`（整包替换 status/headers/body） |
| `url script-request-body`（/api 请求侧上下文捕获） | 同名 + `requires-body=1` |
| `url script-response-body`（secretkey 抓密钥 + /api 响应净化） | 同名 + `requires-body=1` |
| `$prefs`（QX 持久键值） | 桥接层实现：优先 `localStorage`，没有则退化为进程内内存（动态密钥持久化失效但不崩） |
| `$notify(title, body, url)` | 桥接层转发到 Loon `notify()` |
| `$done(response)` | 桥接层转发到 Loon `done()`，并把 `"HTTP/1.1 200 OK"` 形式的 status 归一化为数字 |
| `hostname = …` | Loon 无对应项；流量走代理 + MITM 即可 |

4 条 `[Script]` 规则用的是**内联桥接脚本**（3KB 单行、无换行无双引号，保证 Loon 片段解析安全）：
它在 Loon 环境中补齐 QX 专有 API → 拉取上游 `easybike-ad.js`（带 6h localStorage 缓存，缓存过期且拉取失败时用旧缓存兜底）→ 执行上游逻辑。

## 验证

- Loon 日志里过滤 tag：`HelloBikeCapital` / `HelloBikeKey` / `HelloBikeReq` / `HelloBikeResp`，能看到每次命中与脚本输出。
- 首次进入哈啰 App：`secretkey` 响应会被桥接捕获动态密钥 → 收到通知「哈啰净化：已捕获本机动态密钥」→ 按提示重新进入首页和我的页。
- 效果：首页弹窗/广告流/借钱入口/会员领券横条消失；我的页推广宫格、推荐、奖励金、接单券提醒、钱包金融整排被隐藏。

## 注意

- 若 GitHub raw 在你的网络/规则里被拦：请放行 `raw.githubusercontent.com`（走代理即可），否则 6h 后缓存失效且无旧缓存时，脚本会静默失效（原响应原样放行，App 不受影响，只是失去净化）。
- 想强制刷新上游脚本：Loon 设置里清除缓存（localStorage），或等待 6 小时自然过期。
- 如果超长内联导致粘贴异常（极少数旧版 Loon）：把 `hbe-bridge.js` 上传到任意可访问地址（自己的 Gist/静态服务器），把 4 条规则里 `url script-* "…内联…" ` 的内联内容替换为该 URL 即可，规则其余部分不变。
- 桥接用的 localStorage key（`HelloBikeQXKeyCacheV1` 等）与 QX 版各自独立，不冲突。

## 本目录文件

| 文件 | 说明 |
|---|---|
| `helloobike-loon.snippet` | **主交付物**，直接粘贴进 Loon 片段 |
| `hbe-bridge.js` | 桥接脚本（可读版，用于自托管/排查） |
| `hbe-bridge-oneline.js` | 同上，单行版（即内联进 snippet 的内容） |
| `hbe-test.js` | 全链路模拟测试（Node，7 场景全 PASS） |
| `build-snippet.js` / `verify-snippet.js` | 构建与校验工具 |
