# 贴吧去广告 · Loon 插件（.lpx）

针对 **百度贴吧 iOS App**（`tieba` UA）的去广告 Loon 插件。基于真实抓包逆向，覆盖：

- **推荐流 native 广告**（"天天有保"等整卡广告）— 对 `excellent/personalized` 的 protobuf 做手术，整卡删除，正常帖子保留
- **信息流 / 竞价 / 曝光日志**（`getFeedAd` / `adBid` / `adLog`）— 直接拦路径
- **评论区广告**（`material/home` 的 `comment_area_ads`、`is_tiebaplus_ad`）— 改写 JSON 归零
- **广告素材 / 贴纸 / 开屏图**（`gamedelivery` 等 host）— 域名 REJECT
- **三方广告 SDK + 统计埋点**（网易 union、weirwood DMP、黑茶、gsp0、sofire、ztbox、ada/nsclick/mlog）— 域名 REJECT

## 文件
| 文件 | 作用 |
|---|---|
| `tieba-adblock.lpx` | **主插件**，`[Script]` 引用同目录独立 JS（raw URL），导入 Loon 即自动拉取 |
| `tieba_feed_ad.js` | 独立 JS（推荐流 protobuf 手术），主插件 `[Script]` 通过 raw URL 引用 |

## 安装
1. 把 `tieba-adblock.lpx` 通过「分享」导入 Loon，或在 **Loon → 设置 → 自定义 → 本地配置** 新建并粘贴内容。
2. 启用该配置 / 插件。
3. 需要 Loon **≥ 3.5.1 (978)**；`$utils.ungzip` 需 **≥ 988**。
4. `material/home` 那行改写需要 **Loon MitM 证书已安装并信任**。

## 可选
- **想保留百度游戏**：删掉 `[Rule]` 里的 `REJECT,DOMAIN-SUFFIX,gamedelivery.cdn.bcebos.com`。
- **推荐流广告没消失**：确认 `tieba_feed_ad.js` 可访问（同一 raw URL 能打开）；Loon 会缓存，可手动刷新脚本缓存。

## 原理与安全
- 只用 `[Rule]` REJECT 纯广告/统计 host + `[Rewrite]` 拦广告接口 + `[Script]` 手术推荐流响应；**不会**误伤 `gss0`(头像CDN)、`tieba-ares`(混 UI 图标) 等内容 host。
- protobuf 手术**出错即原样放行**，绝不弄坏推荐流；已在抓包真实数据上验证（广告标记清零、正常帖子完整保留）。

## 维护
百度若改接口/字段名，最多影响对应那一条规则，不影响主拦截；按抓包重新定位即可。
