# 贴吧去广告 · Loon 插件（.lpx）

针对 **百度贴吧 iOS App**（`tieba` UA）的去广告 Loon 插件，基于真实抓包逆向。

## 覆盖
- **推荐流 native 广告卡**（"天天有保"等）— 对 `excellent/personalized` 的 protobuf 做手术，整卡删除，正常帖子保留（仅改响应 body，出错原样放行，不破坏 App）
- **广告素材 / 贴纸 / 开屏图 / 三方广告 SDK / 统计埋点** — `[Rule]` REJECT 纯广告域名（抓包确认这些 host 只承载广告，不承载 App 内容）

## 文件
| 文件 | 作用 |
|---|---|
| `tieba-adblock.lpx` | 主插件，导入 Loon 即用 |
| `tieba_feed_ad.js` | 独立 JS（推荐流 protobuf 手术），`[Script]` 通过 jsDelivr raw URL 引用 |

## 安装
1. 导入 `tieba-adblock.lpx`（Loon → 设置 → 自定义 → 本地配置/插件 → 粘贴或分享导入）。
   raw 地址：`https://github.com/harmonizr/okInterface/raw/master/tieba-adblock/tieba-adblock.lpx`
2. 需 Loon **≥ 3.5.1(978)**；`$utils.ungzip` 需 **≥ 988**。
3. `[Script]` 会自动拉取并缓存 `tieba_feed_ad.js`（jsDelivr；若失效可改回 GitHub raw，见 .lpx 注释）。

## 注意（重要）
- 本版**不改动 App 正常请求**：没有对 `getFeedAd` 等广告 API 做 reject、不改 `material/home` JSON（那两种改写会导致"推荐"刷新报"网络错误"）。
- 因此 getFeedAd 位的小广告（如"同程旅行"）可能仍会出现；如需去掉可在确认不报网络错误后再单独加回。

## 维护
百度改接口/字段时，最多影响对应那一条规则；按抓包重新定位即可。
