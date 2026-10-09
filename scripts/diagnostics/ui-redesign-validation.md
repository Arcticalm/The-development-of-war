# 指挥台 UI 改版验证

日期：2026-10-08。配置版本仍为 `text-prototype-0.2`，战斗规则、存档键与格式、PvP 服务未修改。正式入口 `game.js` 已恢复，与改版前一致，临时运行时测试钩子已清理。

## 已实现

- 全页面采用米色、深绿、金色主题；首页旗帜／切角／圆角入口、分段难度，战役三节点路线与详情，六兵图鉴，设置开关与分段音量，三个带锁的 PvP 入口。
- 战场包含盾形基地 HUD、资源图标、时代建筑、阵营文字标签、角色定位、卡片和队列生产进度、圆形技能冷却及金色进化按钮。
- 统一详情、防御、暂停、确认、退款和说明弹窗；胜利、失败、平局使用不同徽章与配色。
- 控件使用场景／弹层／语义 ID；按下变亮并缩至 97%，释放回弹约 120 ms，波纹约 300 ms，成功／拒绝短暂强调；最多保留 12 项。
- 移出、拖动、取消、弹层切换、切后台取消按压；释放重新核对当前控件；长按详情不生产。反馈时钟在暂停时继续，后台停止。
- `confirm.wav` 与 `reject.wav` 为本地短音效，沿用声音开关、音量和节流；没有加入震动。

## 自动化结果

使用微信开发者工具内置 Electron 的 Node 22.16.0 模式：

```powershell
./scripts/test.ps1 -NodePath 'D:\微信web开发者工具\微信开发者工具.exe'
```

最终 **71 / 71 项通过**，无失败、跳过或取消。原 56 项回归通过，新增 15 项覆盖稳定 ID 与重复释放、移出后返回、拖动、取消／弹层／后台、释放时金币变化、兵组变化、队列移位和出场、禁用状态长按、不可用原因、成功退款、静音／零音量、暂停／后台反馈、效果上限、形状命中与安全区。

旧测试的生产／详情坐标已更新，文字标签碰撞测试改用 `unitLabel` 接口。混合兵种的标签仍通过不重叠验证，绘图不修改战斗状态。

独立运行 `scripts/check-campaign.js`：**15 / 15 关通过**，只提交合法指令，固定种子 42，同时验证金币、人口与快照恢复约束。

| 章节 | 第一关 | 第二关 | 第三关 |
|---|---:|---:|---:|
| 1 | 162 秒 | 312 秒 | 214 秒 |
| 2 | 218 秒 | 156 秒 | 211 秒 |
| 3 | 242 秒 | 177 秒 | 129 秒 |
| 4 | 177 秒 | 119 秒 | 119 秒 |
| 5 | 169 秒 | 137 秒 | 255 秒 |

全部为摧毁敌方基地获胜；这些固定策略结果用于回归，不表示最终平衡已经确定。

## Canvas 画面检查

通过微信模拟器真实 Canvas 2D 渲染导出 22 个场景。设备窗口 844 × 390，DPR 3，导出 2532 × 1170；安全区 left 47、right 797、bottom 369，并避让系统胶囊。所有图片先写入系统临时目录，读取核对后归档。

[九图总览](ui-overview.jpg)

| 检查范围 | 画面 |
|---|---|
| 首页与导航 | [首页](ui-canvas-home.png)、[战役路线](ui-canvas-route.png)、[图鉴](ui-canvas-codex.png)、[设置](ui-canvas-settings.png)、[PvP](ui-canvas-pvp.png) |
| 战场与文字布局 | [战场](ui-canvas-battle.png)、[密集战场](ui-canvas-crowd.png)、[未来时代](ui-canvas-future.png) |
| 详情与操作 | [关卡详情](ui-canvas-level.png)、[兵种详情](ui-canvas-unit.png)、[防御塔](ui-canvas-defense.png)、[暂停](ui-canvas-pause.png)、[说明](ui-canvas-help.png) |
| 确认与退款 | [覆盖](ui-canvas-overwrite.png)、[投降](ui-canvas-surrender.png)、[取消生产](ui-canvas-refund.png) |
| 结算 | [胜利](ui-canvas-win.png)、[失败](ui-canvas-loss.png)、[平局](ui-canvas-draw.png) |
| 反馈 | [按下](ui-canvas-pressed.png)、[拒绝](ui-canvas-reject.png)、[队列成功与生产 45%](ui-canvas-queued.png) |

检查修正了战役副标题与第一节点编号重叠。卡片进度、定位、金币与按钮分层清晰；成功／拒绝提示位于战场下缘或弹窗底部，不挡主要操作。密集画面是人为构造的 60 个混合单位压力场景，包含超过正常人口的状态，专门检查标签布局；正常人口限制由模型测试与合法通关脚本验证。结算画面通过临时测试状态触发，并非实际自然对局录像。

## 模拟器交互证据与接口限制

`automation_game_action` 发送实际 touchstart／touchend 到生产按钮，运行时观测为：

- 按下：`pressed = battle:main:train:age1_melee`，队列 0。
- 释放：`pressed = null`，队列 1，提示“石棒战士已加入队列”。

战场拖动中观察到镜头 x 从 0 变为 31.40，技能仍处于选点状态，技能预警数量为 0；该 swipe 调用最终返回 `timeout waiting for automator response`，不能据此认定整段自动化拖动完成。长按和暂停动画以可控帧时间测试验证；当前模拟器自动化的自然持续帧反馈尚不能完整确认。

截图统一尝试 `simulator_screenshot`，小游戏不传 Page／selector 等待参数。接口能保存 PNG，但切换场景后连续返回旧的第五章路线画面：route、level、codex 三份截图的 SHA-256 完全相同（`0E8BCB88DB3B5ADA1F380C0AF22D22A7C0CECD32C8CDA23626ED3A8115668E1D`），与运行时报告的场景不一致。因此上述归档采用当前 Canvas 的 `toDataURL()` 导出，属于绘图检查证据，不等同于原生模拟器窗口截图。

期间 AppID 校验偶发 `Client network socket disconnected before secure TLS connection was established`，成功恢复后继续；未修改 AppID 或账户。最终正式入口刷新返回成功，`get_simulator_console --command 'grep -i error'` 无匹配行；刷新成功本身不被当成编译通过证据。

桌面预览工具连接返回 `Computer Use native pipe is unavailable`，浏览器界面未验证。保留 `scripts/ui-preview.py` 和 `ui-preview.html` 供本机浏览器检查，使用独立测试存储且不进入小游戏包。真机音频体验、持续帧动画、性能与多设备兼容性仍需实测。
