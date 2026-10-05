# 微信小游戏截图接口排查

排查日期：2026-10-03。开发者工具版本：2.02.2608070；wechatide-skill：0.3.9。

## 结论

`simulator_screenshot` 在小游戏项目中携带 `wait` 参数时，错误地执行小程序页面就绪检查。即使 `--wait 0`，也会调用 `App.getCurrentPage`；小游戏没有小程序页面栈，检查超时，截图操作尚未开始。

省略 `wait` 和 `wait-for-selector` 参数即可正常截图。图片优化并非原因，默认 JPEG 和 `--optimize false` 的 PNG 均已成功。

## 验证结果

| 调用 | 结果 |
|---|---|
| 不传 wait，optimize=false | 成功，PNG 1227×568 |
| 不传 wait，默认 optimize | 成功，JPEG 1227×568 |
| wait=0，optimize=false | 失败：waitForAutomatorReady timeout: timeout waiting for automator response |
| 再次不传 wait，保存到 screenshot-home.jpg | 成功，首页正常显示 |

成功截图：[screenshot-home.jpg](./screenshot-home.jpg)。

## 本机实现证据

只读检查 `D:\微信web开发者工具\resources\app.asar`，未修改开发者工具安装内容：

- `js/d6d539cfa0c891e0ed30e883810ce030.js`：截图处理器先调用 `awaitOptionalWait(project, {wait, waitForSelector})`，之后才调用 `saveSimulatorScreenshot`。
- `js/ebfd3866fd9e9dd811c891b5c690f726.js`：`awaitOptionalWait` 只有在 wait 未提供且没有 waitForSelector 时直接返回；提供 wait 后即使值为 0，也会检查 `App.getCurrentPage` 与 pageId，最多等待约 5 秒。
- `js/4d41de9788326cee3060bc535f3c75b5.js`：真正截图调用 `captureSimulatorScreen`，后续才进行 JPEG/PNG 处理。
- `js/257b1bb62992666dda5c22bd010ff68a.js`：小游戏 evaluate 使用 `Tool.invokeGameMethod`，因此运行时查询可以成功，不依赖上述页面检查。

## 正常调用

```powershell
& 'D:\微信web开发者工具\wechatide.cmd' -c Codex simulator_screenshot --project 'E:\Box\important\The-development-of-war'
```

如果确实需要等待，先在调用端等待，再执行不带 wait 参数的截图命令。开发者工具实现应在小游戏分支只执行时间等待，不调用小程序页面就绪检查；waitForSelector 应明确拒绝或限定为小程序。

本次仅诊断并保存截图，未修改游戏代码或开发者工具安装文件。
