# 战斗场景 UI 设计稿

更新：2026-10-09。本目录存放《战争进化史》战斗场景 UI 设计稿概念图（早期 Flash 手绘风，米色 / 深绿 / 金色配色），共 8 张，命名统一为 `battle-ui-<界面>.png`（横版 16:9，2730×1536）。

## 文件清单

| 文件名 | 界面 | 对应代码 | 关键元素 |
|---|---|---|---|
| `battle-ui-main.png` | 战斗主界面 | `src/renderer.js` `battle()` / `controls()` | 顶部状态栏（我方/敌方基地卡、金币、人口、计时、经验、暂停）、中部战场（基地/兵种/技能预警）、底部控制台（队列、A/B 兵种卡×3、防御塔、技能盘、进化） |
| `battle-ui-pause.png` | 暂停界面 | `src/renderer.js` `overlay()`（pause） | 调暗遮罩 + 米色面板：继续战斗 / 操作说明 / 投降 / 保存并返回首页 |
| `battle-ui-defense.png` | 基地防御 | `defense()` | 三个塔位卡（升级 / 出售 / 空槽建造） |
| `battle-ui-result-win.png` | 胜利结算 | `result()`（win） | 击杀 / 用时 / 金币 / 经验 + 下一关 / 返回首页 |
| `battle-ui-result-lose.png` | 失败结算 | `result()`（lose） | 存活单位 / 用时 + 再战一次 / 返回首页 |
| `battle-ui-unit-detail.png` | 兵种详情 | `unitDetail()` | 立绘 + 属性两列（生命/攻击/射程/攻速/移速/人口）+ 生产 / 关闭 |
| `battle-ui-skill.png` | 技能施放选点 | `battle()`（skillMode） | 金色虚线落点框 + 提示横幅“点击战场选择落点；拖动只移动视野”+ 取消施放 + 技能键高亮 |
| `battle-ui-help.png` | 操作说明 | `help()` | 短按生产 / 长按详情 / A·B 六兵 / 防御塔 |

## 设计依据与约束

- 布局、控件形态与交互状态依据 `src/renderer.js`、`src/ui/theme.js`（配色 `#efe6d2` / `#356f5c` / `#c59a45` 体系）、`src/ui/primitives.js`（round/cut/flag 形状、图标）与 `src/ui/feedback.js`（按压缩放 0.97、释放涟漪、成功闪光、禁用态灰化）。
- 画风与角色素材一致：粗粝早期 Flash 手绘（厚黑抖动描边、平涂旧化色块、无渐变柔光），时代战场配色沿用 `ERA_COLORS`。
- 图为概念设计稿：界面文字为手绘示意，个别标注可能与代码文案略有出入；正式渲染以代码为准，图片不参与运行时绘制。

## 后续

- 如需将设计稿细化到指定状态（如按钮禁用原因、进化达成态、投降二次确认），按界面名新增 `battle-ui-<界面>-<状态>.png`。
- 场景 / 建筑 / 特效素材图（base_*、tower_*、skill_*、hit_*）尚未生成，见 `introduction/art.md` §5–6 提示词。
