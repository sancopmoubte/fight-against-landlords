# 斗地主（纯静态版）

这是一个无需后端的本地斗地主项目。直接用浏览器打开 `index.html`，即可加载页面、图像、音频与游戏脚本；也可以将仓库根目录发布到 GitHub Pages。

## 上游归属与授权记录

本仓库复制自 [qq418938472/FightAgainstLandlords](https://github.com/qq418938472/FightAgainstLandlords)。上游作者账号为 `qq418938472`。当前仓库的复制与再发布由本任务的用户确认已获得原作者授权；保留此文件用于追溯上游来源。

| 项目项 | 内容 |
| --- | --- |
| 上游仓库 | `https://github.com/qq418938472/FightAgainstLandlords` |
| 上游分支 | `master` |
| 上游提交 | `73801dc618786025e81ffe1434078709a7ef4991` |
| 技术栈 | HTML、CSS、JavaScript、jQuery |
| 服务端依赖 | 无 |

## 本地运行

最简单的方式是双击 `index.html`。若浏览器限制本地媒体播放或需要更接近线上环境的资源加载方式，可在仓库根目录运行任意静态文件服务器后访问该目录。

## GitHub Pages

将 GitHub Pages 的发布源设置为此仓库的默认分支根目录即可。`index.html` 已位于仓库根目录，无需构建步骤。

> 游戏逻辑和静态素材保留在上游原有目录中：`js/`、`css/`、`images/`、`Sound/` 与 `video/`。



## 高清开源视觉资源归属

本版本使用的牌桌背景来自 [OpenGameArt Felt Backgrounds](https://opengameart.org/content/felt-backgrounds)，作者 `jbp4444`，采用 **CC0 1.0**，本地文件为 `images/open-source-table/felt-green-2048.jpg`，原始尺寸 2048×2048。

54 张牌面和标准牌背来自 [hayeah/playing-cards-assets](https://github.com/hayeah/playing-cards-assets)，仓库采用 MIT 许可证，牌面素材来源说明为 public domain；对应的许可证与来源说明保存在 `images/open-source-cards/LICENSE-MIT.txt`。本项目仅替换视觉资源，斗地主发牌、叫地主、出牌判断、欢乐豆结算、离线转账和固定横屏逻辑保持原有实现。
