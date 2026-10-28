# 贴吧去广告 · Loon 插件（.lpx）

针对 **百度贴吧 iOS App**（`tieba` UA）的去广告 Loon 插件，基于真实抓包逆向。

## 覆盖
- **信息流 native 广告卡**（推荐 tab"天天有保"、热门 tab"京东"、最新 tab"快手极速版"等）
  — 对 `excellent/personalized`、`frs/page`、`pb/page`、`pb/firstPage` 的 protobuf 做手术，整卡删除，正常帖子保留。
  仅改响应 body；**非 protobuf 或出错时原样放行，绝不弄坏 App**。
- **广告素材 / 贴纸 / 开屏图 / 三方广告 SDK / 统计埋点** — `[Rule]` REJECT 纯广告域名（抓包确认 App 不依赖）。

## 安装（只导入这一个 .lpx）
JS 已托管在本仓库同目录，`[Script]` 通过 GitHub 地址自动拉取并缓存，**无需本地导入任何 JS**：
```
https://github.com/harmonizr/okInterface/raw/master/tieba-adblock/tieba-adblock.lpx
```
Loon → 设置 → 自定义 → 本地配置/插件 → 粘贴上面地址（或分享导入）。
需 Loon **≥ 3.5.1(978)**；`$utils.ungzip` 需 **≥ 988**。

## 文件（都在本目录）
| 文件 | 作用 |
|---|---|
| `tieba-adblock.lpx` | 主插件（`[Rule]` + `[Script]`） |
| `tieba_feed_ad.js` | 信息流广告卡 protobuf 手术 JS（被 `.lpx` 的 `[Script]` 引用） |

## 若"广告还在 / 脚本没执行"
通常是 Loon 拉不到 GitHub 上的 JS（国内网络不稳）。把 `.lpx` 里 `[Script]` 那行的
`https://github.com/.../tieba_feed_ad.js` 换成 jsDelivr 镜像再试：
`https://cdn.jsdelivr.net/gh/harmonizr/okInterface@master/tieba-adblock/tieba_feed_ad.js`
换完记得在 Loon 里刷新脚本缓存。

## 维护
本版**不改 App 正常请求**（不 reject `getFeedAd`、不改 `material/home`，避免"推荐"刷新报网络错误）。
百度改接口/字段时最多影响对应那一条规则，按抓包重新定位即可。
