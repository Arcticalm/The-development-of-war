# 战争进化史 · 微信小游戏

横屏 Canvas 小游戏，入口是 `game.js`，运行无需 npm 安装。配置版本保持 `text-prototype-0.2`；30 兵静态立绘已接入图鉴、详情、出兵卡片、队列及取消生产弹窗，战场实体继续使用文字，动作帧待制作。

## 当前可玩内容

- 经典 PvE：简单、普通、困难三档 AI，五时代、每时代六兵，共 30 个兵种。
- 战役：五章 15 关，关卡目标、时代上限、敌军策略、公开加成、顺序解锁、最佳生命比例和通关时间记录。
- 战斗：自动移动与索敌、攻击前摇、飞行弹丸、范围爆破、磁轨穿透、护甲克制、首击、护盾、治疗、维修和光环。
- 指挥：五项生产队列、30 人口（包含预留）、取消确认与退款、时代进化、塔位开放、建塔、升级、出售、技能落点及预警。
- 页面：30 兵图鉴、详细属性及搭配说明、音效开关与音量、背景简化、操作说明、暂停、投降确认、完整结算、重试和下一关。
- 视角：默认全景；局部视图可拖动，一键回到基地。战场使用唯一短名、阵营文字和数量标记，卡片与详情保留全名。
- 场景美术：共享战场背景、五时代基地、十种防御塔、五种技能三帧特效及四种命中特效已接入。建筑按原图朝向分别镜像，基地与背景共用地面线，特效跟随战斗时钟暂停；角色战斗表现仍为文字。
- 续局：每五秒及进入后台时保存；暂停可保存并返回首页；恢复后保持暂停。战役成绩与设置独立保存。
- PvP：首页可进入在线大厅，保留真人匹配、创建好友房、加入好友房入口，明确显示“尚未开放”；服务与对局会话边界已预留。
- 指挥台 UI：米色、深绿、金色；旗帜页签、地图关卡路线、圆形徽章、切角按钮、兵种定位和生产进度、技能冷却仪表，以及统一弹窗与三种结算。
- 点击反馈：按下缩至 97%，释放回弹和局部波纹；成功高亮队列／资源，拒绝显示原因。确认与拒绝使用本地短音效，受声音开关和音量控制；暂停时 UI 动画继续，后台停止。

在线匹配、房间服务、服务端权威模拟和重连留待后续实现。当前大厅不会创建真实房间或启动本地 AI 对战。

## 导入与操作

1. 在微信开发者工具中导入仓库根目录。`project.config.json` 已配置小游戏类型和当前项目 AppID；使用有该项目权限的账号登录。
2. 编译运行，模拟器选择横屏设备。首页选择经典难度，点击“开始对战”，或进入战役查看“目标与敌情”后开始挑战。
3. 短按兵种卡片或“生产”出兵；长按卡片主体查看详情，A／B 切换每时代六兵。“防御塔”管理塔位；技能冷却完成后点击战场选落点；经验达标后进化。
4. “暂停”可继续、查看说明、确认投降或保存返回首页。新局覆盖未完成对局前会提示；首页“继续上次对战”恢复存档。
5. 设置中可以关闭基础音效、调整音量或简化背景。切后台暂停模拟和音频；返回前台需手动继续。

快照使用 `war.pve.snapshot.v2`，仅支持当前配置版本。早期 `prototype-0.1` 的对局不能直接恢复，首页会提示重新挑战；快照恢复不执行文件清理。存储失败时本次游戏和内存进度仍可继续，但重启后可能无法保留。

## 代码框架

| 模块 | 职责 |
|---|---|
| `src/data.js`、`src/config/modes.js` | 时代、兵种、模式、关卡及版本配置 |
| `src/battle.js`、`src/core/ai.js` | 纯战斗模拟、合法指令、AI 策略、唯一结算、快照校验 |
| `src/sessions/local.js` | 固定步长、指令去重、暂停、事件、只读视图、左右镜像 |
| `src/app.js` | 场景切换、触控与手势、生命周期、会话和服务协调 |
| `src/renderer.js`、`src/ui/` | Canvas 页面、弹层、文字角色布局；不计算伤害 |
| `src/ui/theme.js`、`primitives.js`、`components.js`、`feedback.js` | 主题、原生形状与图标、稳定控件描述、独立 UI 反馈时钟 |
| `src/services/` | 微信存储、音频、独立有界的立绘／建筑／特效／背景图片缓存和待接入的 PvP 服务 |

详细接口和后续接入方式见 [架构说明](introduction/architecture.md)。完整首版目标保留在 `introduction/gameplay.md`、`design-process.md` 和 `art.md`，其中真人 PvP 与角色战斗动作仍属于后续阶段。

## 美术规范与提示词

角色与场景参考初代《战争进化史》的比例、黑色线条、平涂色块及简单场景观感，尽量少改动；详细参考来源、五时代基地、十种防御塔、战场与特效提示词见 [美术规范](introduction/art.md)。[30 兵提示词清单](assets/units/generation-plan.json) 保留绘图、负面、动作提示词及实际立绘生成记录。30 张立绘已验收并完成静态接入，动作帧尚未生成。

原图位于 `assets/units/age1/`～`age5/`，本轮保持原样。运行 `python scripts/build-unit-portraits.py`（需要 Pillow）生成 `assets/unit-portraits/` 展示图与 `src/config/unit-portraits.js` 索引：透明裁边、最长边 360 像素、四边各 12 像素透明边距。图片服务按需加载并复用，最多缓存 12 张，加载中或失败时回退图标和文字；所有静态展示等比完整居中。

游戏包只引用展示图，忽略 `assets/units/` 原图与工作资料、`assets/ui/`、`assets/reference-screenshots/` 和 `output/`，预算 3.5 MiB。战场文字表现、UI、点击反馈和音效保持兼容。后续 172 组独立动画、1136 张帧图及统一保存路径见 [兵种素材说明](assets/units/README.md)；制作源帧不直接打包。基础音效是 `assets/audio/` 中的本地 WAV，可用 `python scripts/build-audio.py` 重新生成。

场景原图在 `assets/buildings/`、`assets/effects/`、`assets/battlefield/`，运行 `python scripts/build-world-art.py` 生成 `assets/world-art/` 派生图与索引。基地／塔透明裁边等比缩小，特效按三帧共同裁边和锚点构建，背景等比导出 JPEG；原图与 `assets/_work/` 不打包。使用与朝向说明见 [建筑](assets/buildings/README.md)、[特效](assets/effects/README.md)、[背景](assets/battlefield/README.md)。

## 验证

Node.js 18+ 环境下运行：

```sh
node --test tests/*.test.js
node scripts/check-campaign.js
```

Windows PowerShell 可使用测试脚本（自动寻找 `node`）：

```powershell
./scripts/test.ps1
# 没有独立 Node 时，可以指定支持 Node 模式的 Electron：
./scripts/test.ps1 -NodePath 'D:\微信web开发者工具\微信开发者工具.exe'
```

测试覆盖经济、人口、指令去重、前摇与弹道、支援、快照确定性、战役目标与进度，以及模拟微信 API 的页面和手势。关卡脚本通过合法出兵、技能和建塔指令验证 15 关存在通关路径，使用固定种子 42；这不代表最终平衡已定稿。

微信模拟器证据与最终检查结果见 [验证记录](scripts/diagnostics/text-prototype-validation.md)。真机的音频体验、性能与设备兼容性仍需后续实测。

本次 UI 改版的 **71 项测试、15 关合法指令通关验证**、Canvas 检查画面和模拟器接口限制见 [UI 验证记录](scripts/diagnostics/ui-redesign-validation.md)。

美术提示词重写、旧素材清理及兼容验证见 [美术整理验证记录](scripts/diagnostics/art-rewrite-validation.md)。

静态立绘接入的 **83 项测试、15 关通关验证**、包体审计与 49 个模拟器 Canvas 场景见 [立绘验收记录](scripts/diagnostics/portrait-integration-validation.md)。资源检查可运行 `python scripts/check-unit-portraits.py`（需要 Pillow）。

基地、背景和特效接入的 **99 项测试、15 关通关验证**、48 个模拟器 Canvas 场景及约 3.49 MiB 包体审计见 [场景美术验收记录](scripts/diagnostics/world-art-integration-validation.md)。资源检查：`python scripts/check-world-art.py`。

可用本地预览工具逐页检查布局：运行 `python scripts/ui-preview.py`，打开 `http://127.0.0.1:8123/scripts/ui-preview.html`。预览复用实际游戏模块，提供页面、弹窗、结算、密集战场和手机安全区场景，使用独立测试存储；`scripts/` 不进入小游戏包。
