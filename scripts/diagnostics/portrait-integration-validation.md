# 静态立绘接入验收

日期：2026-10-09。配置版本保持 `text-prototype-0.2`。30 张立绘已接入图鉴、详情、出兵卡片、队列和取消弹窗；战场继续使用文字。未生成动作帧。

## 自动化与资源检查

- **83 / 83 项测试通过**：原有 71 项回归，加 12 项立绘测试。覆盖真实 PNG 索引与尺寸、按需加载、成功／失败、缓存复用、12 项 LRU、淘汰后迟到回调、快速切页、等比完整展示、加载后稳定控件与一次购买、回退信息、混合时代队列、战场文字和动作规范。原有短按／长按、拖动、暂停、音效、存档及 PvP 边界测试继续通过。
- **15 / 15 关合法指令通关验证通过**，固定种子 42，通关时间与此前相同：162、312、214、218、156、211、242、177、129、177、119、119、169、137、255 秒。
- 30 张原图 SHA-256 与接入前一致；`game.js`、战斗模型、单位数值、文字表现、存储、PvP 服务及通用动作模块的基线哈希一致。
- `scripts/check-unit-portraits.py` 验证五时代各六项、真实原图路径、RGBA 与有效 alpha、透明裁边、等比缩小后的内容像素及四边 12 像素透明边距。30 张展示图合计 **2,849,553 字节（2.72 MiB）**。
- 按 `packOptions.ignore` 排除原图、工作资料、提示词、未引用 UI／参考图与开发资料后，保守未压缩文件总和 **3,118,773 字节（2.97 MiB）**，64 个文件，低于 **3,670,016 字节（3.5 MiB）**预算。该数值包含配置文件，是本地打包规则审计值；未执行上传或体验版发布。
- README 的 30 兵动作表与实际提示词一致：177 条提示词、5 条支援 `attack` 别名、172 组独立动画、1136 帧，全部待生成。未创建动画目录、空清单或占位帧。

复验命令：

```powershell
./scripts/test.ps1 -NodePath 'D:\微信web开发者工具\微信开发者工具.exe'
# Node.js 环境下：node scripts/check-campaign.js
python scripts/check-unit-portraits.py
# 修改原图后才需要重新构建展示图：
python scripts/build-unit-portraits.py
```

Python 检查与构建脚本需要 Pillow。游戏运行不依赖 Python，也无需重新构建已提交的展示图。

## 微信模拟器画面

复用实际 `GameApp`、`Renderer` 和微信 `createImage`／Canvas，使用隔离测试存储，临时入口不读取或覆盖正式进度。画面先导出到系统临时目录，逐页检查后归档；正式 `game.js` 已按字节恢复，刷新后运行时确认临时钩子不存在，console 的 `grep -i error` 无匹配行。

检查 **49 个独立 Canvas 场景**：五时代图鉴、30 个详情、五时代 A／B 组共 30 个出兵卡片、桌面图鉴／战场、混合时代队列及取消弹窗。全部加载成功，缓存始终不超过 12 张。

手机安全区模拟：844×390，DPR 3，safeArea left 47、right 797、bottom 369，并避让胶囊；Canvas 导出 2532×1170。另核对 1280×720 布局。长武器、猛犸、弩车、战车、火炮、履带车和攻城机甲均完整展示。修正了生产卡费用与排队状态的拥挤，将状态移至立绘下方。详情保持左图右文，属性与搭配信息可见。

| 范围 | 画面 |
|---|---|
| 五时代图鉴 | [原始](portraits/codex-age1-phone.jpg)、[古典](portraits/codex-age2-phone.jpg)、[火药](portraits/codex-age3-phone.jpg)、[现代](portraits/codex-age4-phone.jpg)、[未来](portraits/codex-age5-phone.jpg) |
| 全部 30 个详情 | [1～10](portraits/details-overview-1.jpg)、[11～20](portraits/details-overview-2.jpg)、[21～30](portraits/details-overview-3.jpg) |
| 全部出兵卡片 | [五时代 A／B 组总览](portraits/production-overview.jpg) |
| 宽幅详情 | [弩车手原尺寸](portraits/detail-age2_ballista-phone.png)、[履带突击车原尺寸](portraits/detail-age4_vehicle-phone.png) |
| 队列与战场 | [混合时代队列及文字战场](portraits/battle-mixed-phone.png)、[取消生产](portraits/cancel-mixed-phone.png)、[桌面战场](portraits/battle-age1-wide.jpg) |
| 桌面图鉴 | [1280×720](portraits/codex-age5-wide.jpg) |

完整场景清单、加载状态、缓存数量、源 PNG 哈希与归档路径见 [capture-index.json](portraits/capture-index.json)。除保留的代表性 PNG 外，单页归档为最长边 1600 像素 JPEG；总览用于快速检查，局部细节以单页为准。生产／密集战场使用人工构造的压力状态，可能超过正常人口，不用于数值平衡结论；正常人口由模型测试和合法通关验证覆盖。

## 浏览器与接口边界

本地预览使用原生 `Image`、项目根路径解析和加载后延迟重绘，避免加载事件早于服务状态更新造成最后一张图不显示。旧预览实例的完成回调不重绘新实例。使用隔离 Edge 无头浏览器检查，六张未来时代图均返回 HTTP 200 并显示：[浏览器画面](portraits/browser-codex.png)。可用 `?scenario=3&device=phone` 直接打开手机安全区图鉴预览。

微信工具期间间歇返回 `APPID_ERROR: Client network socket disconnected before secure TLS connection was established`；恢复后完成上述画面检查，未更换 AppID。新增真实 touchstart／touchend 尝试被该错误阻止，本轮不计作实机触摸通过；触摸行为由 83 项测试中的可控平台事件回归验证。原生截图接口仍出现滞后场景，因此归档以当前 Canvas 导出为准。

以上是微信模拟器和浏览器检查；手机安全区为模拟参数，未连接实体手机。真机触摸、音频体验与性能仍待设备实测。
