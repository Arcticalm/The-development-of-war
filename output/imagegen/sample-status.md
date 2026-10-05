# 图腾鼓手 CLI 样图

2026-10-03，按用户要求先生成一张样图。

- CLI：imagegen 技能自带的 `image_gen.py generate`。
- 模型：`gpt-image-2`；1024×1024；medium；PNG；仅发送角色文字描述。
- 实际提示词：[age1_support-cli-sample.prompt.txt](./age1_support-cli-sample.prompt.txt)。
- API 返回：HTTP 429，`insufficient_quota` / `credit_balance_exhausted`。本次没有生成图片，未更新素材清单或接入新兵种。
- 批量绘制尚未进行；按用户要求等待这一张样图的效果确认。
- 本地参考图上传请求被自动审批拒绝，后续改为文字生成；实际请求没有上传项目图片。
- API 凭据仅传入请求进程，未写入项目文件。

用户随后选择 Canva，已成功生成一张图腾鼓手样图。来源、实际尺寸和提示词见 [canva-sample-source.md](./canva-sample-source.md)。新图暂未接入游戏，等待画风确认；其他兵种没有批量生成。

动作表现改进已接入 `src/animation.js` 和 `src/renderer.js`：行走分腿、近战倾身、远程后坐、受击、治疗/节奏支援、倒下与淡出，以及分层战场和轻微镜头反馈。表现状态不进入战斗模型或存档；24 项测试通过。当前仍采用已有单姿势素材的程序动画，完整逐帧角色动画素材尚未生成。
