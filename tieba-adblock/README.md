# 贴吧去广告 · Loon 插件（.lpx + 独立 JS）

针对 **百度贴吧 iOS App**（`tieba` UA）的去广告 Loon 插件，基于真实抓包逆向。

## 覆盖
- **信息流 native 广告卡**（推荐 tab 的"天天有保"、热门 tab 的"京东"、最新 tab 的"快手极速版"等）
  — 对 `excellent/personalized`、`frs/page`、`pb/page`、`pb/firstPage` 的 protobuf 做手术，整卡删除，正常帖子保留。
  仅改响应 body，**非 protobuf 或出错时原样放行，绝不弄坏 App**。
- **广告素材 / 贴纸 / 开屏图 / 三方广告 SDK / 统计埋点** — `[Rule]` REJECT 纯广告域名（抓包确认 App 不依赖）。

## 文件
| 文件 | 作用 |
|---|---|
| `tieba-adblock.lpx` | 主插件：`[Rule]` 拦广告域名 + `[Script]` 引用本地 JS |
| `tieba_feed_ad.js` | 独立 JS（信息流广告卡 protobuf 手术），被 `[Script]` 按文件名引用 |

## 安装（两步，顺序无所谓）
1. **把 `tieba_feed_ad.js` 导入 Loon**：下载该 .js → 分享 → **用 Loon 打开**（Loon 会存为本地脚本）。
2. **导入 `tieba-adblock.lpx`**：Loon → 设置 → 自定义 → 本地配置/插件 → 粘贴或分享导入。
   raw 地址：`https://github.com/harmonizr/okInterface/raw/master/tieba-adblock/tieba-adblock.lpx`

需 Loon **≥ 3.5.1(978)**；`$utils.ungzip` 需 **≥ 988**。

## 说明
- 本地加载 JS 不依赖网络，国内最稳。若 Loon 没加载成功（Loon 脚本任务里看不到"贴吧信息流去广告"执行），
  把 `.lpx` 里 `[Script]` 那行 `script("tieba_feed_ad.js")` 换成
  `script("https://cdn.jsdelivr.net/gh/harmonizr/okInterface@master/tieba-adblock/tieba_feed_ad.js")` 再试。
- 本版**不改 App 正常请求**：不 reject `getFeedAd` 等广告 API、不改 `material/home` JSON
  （那两种会导致"推荐"刷新报"网络错误"，已移除）。

## 维护
百度改接口/字段时，最多影响对应那一条规则；按抓包重新定位即可。
