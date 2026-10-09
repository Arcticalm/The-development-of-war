# 兵种立绘与动作制作说明

更新：2026-10-09；风格版本：`aow1-reference-v1`。

30 张透明静态立绘已生成并验收；30 兵已接入图鉴卡片、兵种详情、出兵卡片、生产队列及取消生产弹窗。战场实体继续显示文字、阵营、数量、血量与状态。**动作帧全部待生成**，静态接入不代表动画完成。

完整风格、基地、防御塔、背景与特效提示词见[美术规范](../../introduction/art.md)。[generation-plan.json](generation-plan.json) 保留实际立绘生成记录及全部绘图、负面和动作提示词，不绑定后续制作工具。

## 目录与静态资源

原始立绘实际目录为 `age1/`～`age5/`，每时代六张，以单位 ID 命名。原图保持原样，供造型参考与后续制作；`_work/` 保存工作资料和原件备份。

运行 `python scripts/build-unit-portraits.py`（仓库根目录，需要 Pillow）仅裁掉外围透明留白，等比缩小至最长边不超过 360 像素，再增加四周各 12 像素透明边距，导出 RGBA PNG。展示图与按 ID 查找的路径、宽高索引分别为 `assets/unit-portraits/` 和 `src/config/unit-portraits.js`。

图片按需加载、重复复用，LRU 最多缓存 12 张；加载中或失败时回退图标与文字。图像等比完整居中，保留武器、脚部、坐骑与机械。原图、提示词、工作资料及未引用参考图不进入游戏包；展示图进入游戏包，验收预算为 3.5 MiB。浏览器预览沿用同一图片服务。

## 动作帧要求

以对应已验收立绘作为造型参考，保持装备、比例、颜色、轮廓和朝右方向一致。骑手与坐骑、炮手与器械作为一个组合单位。

默认源帧画布为 **512×512 透明 RGBA PNG**。同一单位所有动作、所有帧保持统一比例与脚底锚点；机器以接地位置为锚点。完整容纳长武器、坐骑和机械，禁止逐帧自动裁切或重新居中。建议在制作首帧时确认锚点，再固定到整个版本。宽幅单位仍完整容纳于同一画布。

| 动作 | 帧数 | 循环 |
|---|---:|---|
| `idle` 待机 | 6 | 是 |
| `move` 移动 | 8 | 是 |
| `attack` 攻击／支援主动动作 | 8 | 否 |
| `hurt` 受击 | 4 | 否 |
| `death` 死亡 | 6 | 否 |
| `reload`、`charge`、`guard`、`deploy`、`shield_activate` 等附加动作 | 每项 8 | 否 |

攻击包括预备、发力、命中／释放与收势；火器的后坐、装填顺序与机械联动要清楚。移动体现四肢迈步、轮履转动、武器与装备的相对运动，不能只平移整张立绘。待机有轻微呼吸或机械待机；受击有方向反应；死亡表现失衡与落地。医疗、鼓舞、维修有明确施作与收势，沿用既有战斗职责，不新增伤害行为。

支援兵使用 `encourage`、`heal` 或 `repair` 作为主动动作。提示词中的 `attack` 是该支援动作的别名，共用同一组 8 帧，**不另建 attack 目录**：
`age1_support: attack → encourage`；
`age2_support: attack → heal`；
`age3_support: attack → encourage`；
`age4_support: attack → heal`；
`age5_support: attack → repair`。

现有 **177 条动作提示词**去除这 5 条重复别名后，对应 **172 组独立动画、1136 张帧图**，全部待生成。其中 30 兵五项基础／主动动作共 150 组、960 帧，额外动作共 22 组、176 帧。下表每兵均需 `idle`、`move`、主动动作、`hurt`、`death`，再加列出的附加动作。

| 单位名称 | ID | 主动动作 | 附加动作 | 制作状态 |
|---|---|---|---|---|
| 石棒战士 | `age1_melee` | `attack` | — | 全部待生成 |
| 投石猎手 | `age1_range` | `attack` | `reload` | 全部待生成 |
| 猛犸骑手 | `age1_heavy` | `attack` | `charge` | 全部待生成 |
| 骨矛猎手 | `age1_spear` | `attack` | — | 全部待生成 |
| 火罐投手 | `age1_fire` | `attack` | `reload` | 全部待生成 |
| 图腾鼓手 | `age1_support` | `encourage`（`attack` 别名） | — | 全部待生成 |
| 剑盾士兵 | `age2_melee` | `attack` | `guard` | 全部待生成 |
| 长弓手 | `age2_range` | `attack` | `reload` | 全部待生成 |
| 重甲枪兵 | `age2_heavy` | `attack` | — | 全部待生成 |
| 弩车手 | `age2_ballista` | `attack` | `reload` | 全部待生成 |
| 战车突袭兵 | `age2_chariot` | `attack` | `charge` | 全部待生成 |
| 战地医师 | `age2_support` | `heal`（`attack` 别名） | — | 全部待生成 |
| 刺刀步兵 | `age3_melee` | `attack` | — | 全部待生成 |
| 火枪手 | `age3_range` | `attack` | `reload` | 全部待生成 |
| 重炮兵 | `age3_heavy` | `attack` | `reload` | 全部待生成 |
| 掷弹兵 | `age3_grenade` | `attack` | `reload` | 全部待生成 |
| 穿甲枪手 | `age3_antiarmor` | `attack` | `reload` | 全部待生成 |
| 军旗鼓手 | `age3_support` | `encourage`（`attack` 别名） | — | 全部待生成 |
| 突击兵 | `age4_melee` | `attack` | `reload` | 全部待生成 |
| 精确射手 | `age4_range` | `attack` | `reload` | 全部待生成 |
| 重装机枪兵 | `age4_heavy` | `attack` | `reload` | 全部待生成 |
| 火箭筒兵 | `age4_rocket` | `attack` | `reload` | 全部待生成 |
| 履带突击车 | `age4_vehicle` | `attack` | `reload` | 全部待生成 |
| 战地医疗兵 | `age4_support` | `heal`（`attack` 别名） | — | 全部待生成 |
| 能量剑士 | `age5_melee` | `attack` | `charge` | 全部待生成 |
| 等离子射手 | `age5_range` | `attack` | `reload` | 全部待生成 |
| 动力装甲兵 | `age5_heavy` | `attack` | `shield_activate` | 全部待生成 |
| 磁轨炮手 | `age5_rail` | `attack` | `reload` | 全部待生成 |
| 攻城机甲 | `age5_siege` | `attack` | `deploy`、`reload` | 全部待生成 |
| 维修机兵 | `age5_support` | `repair`（`attack` 别名） | — | 全部待生成 |

## 保存路径与版本

目录使用上述英文动作键；帧编号从 `0001` 开始，四位补零。首版 `v01`，修订递增为 `v02`、`v03`，不覆盖已验收版本。

```text
原始立绘：
assets/units/age1/age1_melee.png

静态展示图：
assets/unit-portraits/age1_melee.png

后续已整理动作帧：
assets/units/animations/age1/age1_melee/v01/idle/0001.png

后续单位动作清单：
assets/units/animations/age1/age1_melee/v01/manifest.json

动作生成原件与中间文件：
assets/units/_work/animations/age1/age1_melee/v01/idle/
```

以下是未来清单的格式示例；帧路径相对于所在 `manifest.json`。每个动作完整列出实际帧路径，帧数必须与列表长度一致。锚点用源画布像素坐标表示；示例值仅作说明，制作时按单位脚底确认。验收状态使用 `pending`（待验收）、`accepted`（通过）、`rejected`（退回），不能把未生成帧登记为通过。

```json
{
  "unit_id": "age1_melee",
  "version": "v01",
  "canvas": {"width": 512, "height": 512},
  "anchor": {"x": 256, "y": 460},
  "acceptance": "pending",
  "aliases": {},
  "actions": {
    "idle": {
      "frame_count": 6,
      "loop": true,
      "frames": ["idle/0001.png", "idle/0002.png", "idle/0003.png", "idle/0004.png", "idle/0005.png", "idle/0006.png"],
      "acceptance": "pending"
    }
  }
}
```

支援兵的 `aliases` 例如 `{"attack":"encourage"}`；`actions` 只登记实际独立动作。后续按表补齐全部动作，检查帧数、透明度、方向、统一比例与锚点、武器完整性、动作节奏和别名，再登记验收。未来运行时图集另行构建，制作源帧不直接打包。

本轮只接入静态展示图与写入动作规范，不生成动作帧、不建立占位素材或空动画清单。

## 生成记录（2026-10-09）

- 工具：`image_edit`（seedream_5.0_flash），以已确认风格锚点 `_work/trial1a.jpg`（A 粗粝块面版）为唯一主锚做图生图延展；白底输出后经 `mediakit-cli image remove-image-background`（scene=general）抠图为透明 PNG。
- 文件：`assets/units/ageN/<unit_id>.png`（按时代归档，文件名不变），24 张常规 1536×2048（3:4）+ 6 张宽幅组合单位 2048×2048（1:1）；全部 IHDR colorType=6（真 RGBA Alpha）并逐张通过风格、比例、装备、透明度与缩小剪影验收。
- 重试记录（3 次，均一次修复）：age1_range、age2_melee、age3_antiarmor 首版被通用构图句误导幻觉出多余火炮，收紧提示词后通过。
- 原始分辨率备份在 `assets/units/_work/pre_resize/`（1773×2364），如需更高分辨率可还原。
- 说明：age5_siege 攻城机甲含一个与机身一体的后置大轮（提示词为双足平台），属机甲整体部件，剪影辨识无误，已接受。
- `generation-plan.json` 中 30 项 `status` 与 `generated` 字段已同步更新。
