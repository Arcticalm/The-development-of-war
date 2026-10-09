# 《战争进化史》美术规范与绘图提示词

> 更新：2026-10-09；美术规范版本：`aow1-reference-v1`。当前交付为**提示词已准备，图片未生成**。游戏继续使用文字角色，本轮保留现有指挥台 UI、音效、点击反馈和全部玩法。

## 1. 参考与改动原则

主要参考为用户指定的[初代《战争进化史》中文无敌版](https://www.4399.com/flash/86686_2.htm)，[游戏信息页](https://www.4399.com/flash/86686.htm)可用于确认版本。辅助核对[2007 年实机画面](https://gigazine.net/gsc_news/en/20071112_age_of_war/)中的原始、现代与未来阶段：[原始战场](https://i.gzn.jp/img/2007/11/12/age_of_war/aow004.png)、[现代战场](https://i.gzn.jp/img/2007/11/12/age_of_war/aow007.png)、[未来战场](https://i.gzn.jp/img/2007/11/12/age_of_war/aow009.png)。查阅日期：2026-10-09。

尽量保留初代的比例、线条、色块、剪影、低视点和场景观感，按现有兵种的装备与职责做必要适配。这里描述的是对已查看画面的视觉归纳，不是原作者提供的制作参数。30 个兵种属于本项目配置，不宣称它们都出现在参考游戏中。

角色名称、ID、时代及职责以 [src/data.js](../src/data.js) 为准。猛犸骑手仍骑猛犸，投石猎手仍使用投石武器；古典文明的名称保留，画面接近初代冷兵器阶段。新增支援兵、机械兵与装甲兵使用同一造型语言，不另开一套画风。

## 2. 统一视觉要求

| 项目 | 要求 |
|---|---|
| 视角 | 二维横向战场；角色全身侧视朝右，脚底共用水平基线；敌军后续通过表现层镜像 |
| 比例 | 普通人形偏瘦长，头部与手掌克制，四肢简化，关节清晰；以参考画面的轮廓为锚，不规定夸张的固定头身比 |
| 重型单位 | 靠装备、坐骑或机械体块增加宽度和重量；里面的人物仍沿用同一基础比例 |
| 线条 | 清楚的黑色外轮廓和少量内部线，接近早期 Flash 手绘质感；轮廓不压过细长手脚 |
| 着色 | 大块平涂本色，必要时增加一块阴影；只保留辨认材料与动作所需的细节 |
| 表情 | 简单眼、鼻或头盔开口，侧脸方向明确；不依靠复杂表情和面部刻画识别兵种 |
| 装备 | 一眼辨认武器类别与时代；布、木、石、金属用简单色块区分 |
| 阵营 | 本色为主；小块布条、盾面或装甲标记可预留玩家深绿／敌军红褐区域，服装不整体染色；不强制每兵佩戴同款臂带 |
| 交付构图 | 静态角色每图一个完整单位，透明背景；脚、长武器、坐骑和器械全部可见，四周留空；骑手与坐骑、炮手与器械算一个组合单位 |

不采用三头身大头、粗壮大手、精致海报立绘、现代手游装饰密度、写实材质、三维光照和大面积辉光。角色图不包含 UI、名字、边框、场景、第二个独立单位或多动作拼图。黑白棋盘格不是透明背景。

### 时代配色与轮廓

| 时代 | 本色与材料 | 识别轮廓 |
|---|---|---|
| 原始时代 | 浅土色皮肤、褐色毛皮与木柄、灰石、骨白 | 简单裸露四肢、皮裙、石器与骨矛；猛犸为低细节褐色大体块 |
| 古典文明时代 | 土褐布料、木色、铁灰、少量暗红或深绿 | 简单盾牌、弓、枪、头盔和锁甲块面；避免华丽宫廷与繁复纹样 |
| 火药时代 | 褐灰布料、暗色帽靴、木托、黑灰炮管 | 直立火枪轮廓、刺刀、木轮炮架、军旗和小鼓 |
| 现代战争时代 | 橄榄绿、卡其、暗灰钢铁 | 小钢盔、枪托、背包、机枪与低矮履带车辆 |
| 未来科技时代 | 深灰装甲、浅灰白建筑、少量红／青能量色 | 简单分块装甲、明确炮口与关节、克制的灯条；避免复杂机甲装饰 |

## 3. 可直接使用的角色提示词

完整 30 兵清单在 [generation-plan.json](../assets/units/generation-plan.json)。每个 `prompt` 可单独复制使用，已包含统一风格、具体装备、身份和构图；`negative_prompt` 单独作为负面约束。不要再叠加其他旧风格模板。

### 中文模板

```text
为二维横向战争游戏绘制一个完整单位：[单位名称、时代、职责、装备]。
美术紧贴参考图中的初代《战争进化史》：早期 Flash 手绘质感，清楚的黑色线条，简化而偏瘦长的人物比例，细长四肢，克制的头与手，平涂本色和少量硬边阴影，武器与动作剪影清楚。
只为本单位的装备与职责做必要调整，保持参考的轮廓、线条、配色和细节密度。重型装备或坐骑增加体块，人物比例仍与其他兵种一致。
全身侧视朝右，处于自然待机姿势；完整展示武器、脚部、坐骑或器械。骑手与坐骑、炮手与器械视为一个组合单位。每图仅一个单位，透明背景，四周留空，无场景、无文字、无 UI、无边框。
```

### English template

```text
Draw ONE complete unit for a 2D side-view war game: [unit, era, role, equipment].
Stay very close to the supplied screenshots of the FIRST Age of War Flash game: simple early-Flash hand-drawn art, clear black contours, slim simplified human proportions, restrained heads and hands, narrow articulated limbs, flat local-color fills, and only a few hard-edged shadow patches. Keep the reference silhouettes, line weight, palette, and sparse detail; make only the changes required by this unit's equipment and role. Bulky armor, mounts, and machines may add mass without changing the underlying human proportions.
Full body in a clean side view facing RIGHT, in a natural ready pose. Keep every foot, weapon tip, mount, wheel, and machine inside the image with clear margins. A rider with a mount or an operator with artillery is ONE composite unit. Transparent background. No scenery, text, UI, frame, or additional independent unit. Generate one static pose, not a pose sheet.
```

### 负面模板

```text
chibi, three-head-tall proportions, oversized head or hands, bodybuilder anatomy, polished mobile-game splash art, ornate costume redesign, anime portrait, photorealism, 3D render, complex texture, dramatic lighting, excessive glow, isometric view, front-facing portrait, cropped feet or weapons, extra limbs, extra independent soldiers, static-pose collage, text, UI, logo, watermark, border, scenery, opaque or checkerboard background
```

使用支持参考图片的绘图工具时，附上同一套初代实机画面；网址与文字描述不能代替工具实际读取图片。静态图先检查画风、比例与小尺寸剪影，再进入动作制作。本轮不调用绘图服务，工具选择不绑定供应商。

## 4. 动作提示词与后续制作

清单的 `animation_prompts` 按动作提供中文说明、英文完整提示词、帧数和是否循环。它们是后续制作要求，尚无对应帧图。动作图与单姿势立绘分别生成；每张动作条只表现一种动作，不混入其他角色或不同动作。

| 动作 | 默认帧数 | 节奏与要求 |
|---|---|---|
| `idle` 待机 | 6，循环 | 小幅呼吸、重心变化和装备轻动；最后一帧接回首帧，不整人缩放 |
| `move` 移动 | 8，循环 | 接地、承重、蹬地、摆腿；持械手保持合理，坐骑与骑手、轮履与炮架分别运动 |
| `attack` 攻击／主动支援 | 8，不循环 | 预备 → 发力／施放 → 收势 → 待机；鼓手、医师和维修机兵使用支援动作，不虚构直接伤害 |
| `hurt` 受击 | 4，不循环 | 局部后仰或装备震动，然后恢复重心；不更换装备、不向画面外移动 |
| `death` 死亡 | 6，不循环 | 人物失衡倒地，坐骑伏倒，机械停转塌落；不突然消失，结束姿势稳定 |
| 附加动作 | 每项 8，不循环 | 火器装填、长弓搭箭、投石取石、鼓舞、治疗、维修、车辆炮击等，按单位职责描述 |

动作条使用同样大小的格子、同一镜头和一致比例，格子无可见边框；脚底或机械落地线固定，保留合理的动作空间。躯干、四肢和武器应有相对运动，不能只平移、旋转或缩放整张立绘。输出投射物、尘土和命中特效时另做独立素材，角色动作条内不加入敌方目标。

攻击帧的视觉释放点后续对齐战斗事件；动作长度和播放速度不决定伤害、治疗或攻速。真正接入时由角色表现模块只读对局状态，暂停遵守会话逻辑，保持文字回退。当前通用动作逻辑仍保留，未在本轮接入新图片。

## 5. 基地与防御塔提示词

每行是可独立使用的英文提示词。所有建筑沿用角色的黑线、平涂、稀疏细节和时代本色。基地面向右侧战场，最多保留参考画面那种轻微侧面体积；防御塔单独出图，不把整座基地带进塔图。

### 五时代基地

| 时代／资源键 | 完整提示词 |
|---|---|
| 原始 `base_age1` | Draw one prehistoric base very close to the FIRST Age of War Flash game's rocky cave silhouette: a broad irregular gray rock shelter, dark cave entrance opening toward the RIGHT, and a small rough wooden platform for a tower above it. Early-Flash hand-drawn 2D side-view game art, clear black contours, flat gray and earthy brown fills, only a few hard-edged shadows, sparse cracks. Whole base visible on a horizontal ground line, transparent background, clear margins, no attached weapon, units, scenery, text, UI, or ornate redesign. |
| 古典 `base_age2` | Draw one cold-weapon-era base close to the FIRST Age of War Flash game's simple stone castle silhouette: a compact gray stone gate, squat battlements, a dark opening toward the RIGHT, and plain flat tower platforms. Keep the reference's simple massing, slight side depth, clear black contours, flat stone colors and sparse hard-edged shadows. Full 2D building visible on a horizontal ground line, transparent background, clear margins, no attached weapons, troops, grand palace ornament, scenery, text, or UI. |
| 火药 `base_age3` | Draw one gunpowder-era fort base using the FIRST Age of War Flash game's simple fortress scale and silhouette: squat pale-gray masonry, a dark gate opening toward the RIGHT, modest parapet and plain gun platforms, minimal wooden reinforcement. Early-Flash hand-drawn 2D art, black contours, flat gray and brown colors, sparse hard-edged shadows, very little surface detail. Whole building visible on a horizontal ground line, transparent background, no mounted gun, soldiers, flags with lettering, scenery, UI, or elaborate new architecture. |
| 现代 `base_age4` | Draw one modern base close to the FIRST Age of War Flash game's low olive-green military shelter: a dark RIGHT-facing entrance, simple sloping bunker plates with a few gray support ribs, and a plain raised rectangular tower platform. Keep its modest geometry and slight side depth. Early-Flash hand-drawn 2D art, black contours, flat olive and steel-gray fills, sparse hard-edged shadows. Full building visible on a ground line, transparent background, no attached guns, troops, photoreal textures, scenery, text, or UI. |
| 未来 `base_age5` | Draw one futuristic base close to the FIRST Age of War Flash game's off-white curved technological shelter: a low curved segmented shell, dark RIGHT-facing entry, and one slim simple upper mounting structure. Keep the reference massing and sparse panel seams; small dark-gray fittings and restrained red or cyan indicators only. Early-Flash hand-drawn 2D art, clean black contours, flat ivory and gray fills, a few hard-edged shadows. Whole base visible on a ground line, transparent background, no mounted weapon, characters, excessive glow, sci-fi city, text, or UI. |

### 十种防御塔

| 时代／名称／资源键 | 完整提示词 |
|---|---|
| 原始／骨矛塔／`tower_age1_0` | Draw one primitive bone-spear turret facing RIGHT, a compact wooden pivot cradle holding a long bone-tipped spear launcher, visible simple rope lashings. Match the FIRST Age of War Flash art: hand-drawn 2D side view, clear black contours, flat wood-brown, bone-white and stone-gray colors, minimal hard-edged shading and sparse detail. Transparent background, full turret and mounting foot visible, clear margins, no base building, operator, text, UI, or ornate redesign. |
| 原始／投石塔／`tower_age1_1` | Draw one primitive stone-throwing turret facing RIGHT, a short wooden throwing arm, small rope sling and stone held ready above a compact pivot stand. Match the FIRST Age of War Flash art: simple hand-drawn 2D side view, clear black contours, flat brown and gray fills, sparse hard-edged shadows. Transparent background, entire arm, sling and stand visible with margins, no cave, operator, flying barrage, scenery, text, or UI. |
| 古典／重弩塔／`tower_age2_0` | Draw one heavy crossbow turret facing RIGHT on a plain compact swivel mount, readable bow arms and loaded wooden bolt, restrained iron fittings. Stay close to the FIRST Age of War Flash game's plain cold-weapon machinery, clear black contours, flat brown wood and iron-gray fills, sparse shadow patches. Complete 2D side-view turret on transparent background, clear margins, no castle, extra soldiers, elaborate carving, text, or UI. |
| 古典／火油塔／`tower_age2_1` | Draw one fire-oil turret facing RIGHT, a simple dark iron oil pot with a short pouring spout on a compact wooden pivot stand, a small contained orange flame only. FIRST Age of War early-Flash hand-drawn 2D side-view style, clear black contours, flat brown and dark gray colors, few hard-edged shadows. Whole turret on transparent background, clear margins, no castle, operator, giant fire plume, text, or UI. |
| 火药／连发枪塔／`tower_age3_0` | Draw one gunpowder repeating-gun turret facing RIGHT, a small cluster of straight dark barrels on a plain wood-and-iron swivel cradle; keep the silhouette simple and compact. FIRST Age of War early-Flash 2D side-view art, black contours, flat wood brown and gunmetal gray, sparse hard-edged shading. Transparent background, full barrels and mount inside margins, no fort, operator, modern electronics, scenery, text, or UI. |
| 火药／榴弹塔／`tower_age3_1` | Draw one gunpowder grenade turret facing RIGHT, a short thick iron mortar barrel angled slightly upward on a simple wood-and-iron mount. FIRST Age of War early-Flash hand-drawn 2D art, clear black contours, flat gray and brown colors, sparse hard-edged shadows, no elaborate texture. Transparent background, whole turret and pivot stand visible with margins, no fort, soldiers, explosion, lettering, or UI. |
| 现代／反装甲导弹塔／`tower_age4_0` | Draw one modern anti-armor missile turret facing RIGHT, two simple olive-green launcher tubes on a compact dark-gray rotating stand. Keep the FIRST Age of War Flash game's restrained military shapes and detail, clear black contours, flat olive and gray colors, minimal hard-edged shadows. Full 2D side-view turret, transparent background, clear margins, no bunker, soldiers, targeting screen, smoke, text, or UI. |
| 现代／机枪阵列／`tower_age4_1` | Draw one modern machine-gun array facing RIGHT, two readable dark barrels and a plain olive box on a small steel swivel stand. Stay very close to the FIRST Age of War Flash game's simple military sprite art: 2D side view, clear black contours, flat olive and gunmetal colors, few shadow patches. Transparent background, entire gun and mounting foot visible, clear margins, no bunker, operator, ammunition barrage, text, or UI. |
| 未来／磁轨塔／`tower_age5_0` | Draw one futuristic railgun turret facing RIGHT, two straight parallel dark-gray rails, a plain light-gray swivel housing, and one small cyan indicator. Keep the FIRST Age of War Flash game's simple future machinery, black contours, flat local colors and sparse hard-edged shadows. Full 2D side-view turret on transparent background, clear margins, no future base, characters, elaborate circuitry, glowing aura, text, or UI. |
| 未来／等离子塔／`tower_age5_1` | Draw one futuristic plasma turret facing RIGHT, a short round dark-gray barrel in a simple off-white mounting shell, one small red-orange emitter visible at the muzzle. Match the FIRST Age of War Flash game's restrained future shapes: 2D side view, black contours, flat ivory, gray and small energy-color fills, sparse shadows. Transparent background, whole turret visible with margins, no base, troops, massive beam, ornate panels, text, or UI. |

## 6. 共享战场与特效提示词

### 共享背景 `battlefield_shared`

```text
Draw a wide horizontal battlefield background staying very close to the FIRST Age of War Flash game's outdoor battlefield. Use a large open bright-blue sky, low layered green bushes, a few simple broadleaf trees and pointed conifers, and a flat earthy-brown ground strip with sparse small stones and grass tufts. Early-Flash hand-drawn 2D art, clear black tree and ground contours, flat color masses, minimal hard-edged shadows and only a subtle sky color shift. Keep the fighting ground straight and clear, the horizon low, and ample uncluttered sky for the existing interface. Use the same plain outdoor environment across all five eras. No characters, bases, weapons, mountains dominating the view, cinematic lighting, text, UI, frames, or isometric perspective. Opaque background artwork.
```

角色、建筑和技能另层绘制，背景不烘焙血条、按钮、角色、基地或时代变化。后续简化背景仍受现有设置控制。

### 五种时代技能

| 技能／资源键 | 完整提示词 |
|---|---|
| 落石冲击／`skill_age1` | Draw a compact sequence of falling stone impacts for a 2D side-view war game, close to the FIRST Age of War Flash effect language: a few irregular gray stones descend, followed by small tan dust puffs and scattered stone chips at a horizontal ground line. Clear black contours, flat colors, minimal hard-edged shading, no cinematic particles. One effect sequence on transparent background, consistent ground anchor, no units, sky, buildings, text, UI, or screen-filling cloud. |
| 箭雨覆盖／`skill_age2` | Draw a compact side-view arrow-rain effect sequence matching the FIRST Age of War early-Flash art: a small group of plain brown arrows with gray tips drops diagonally toward a horizontal ground line, followed by brief small dust ticks. Clear black contours, flat colors, sparse detail. Transparent background, consistent ground anchor, no archers, castle, battlefield, text, UI, ornate arrows, or huge magical glow. |
| 炮火轰击／`skill_age3` | Draw a compact cannon bombardment effect sequence in FIRST Age of War early-Flash 2D side-view style: a few dark round shells arrive, a short flat orange impact burst appears, then small gray smoke and tan dust shapes dissipate. Clear black contours and sparse flat color masses, consistent ground anchor, transparent background. No cannon crew, buildings, scenery, text, UI, photoreal fire, or screen-filling explosion. |
| 定点空袭／`skill_age4` | Draw a compact modern airstrike impact sequence in FIRST Age of War early-Flash 2D side-view style: a few simple dark olive bombs descend, brief orange-yellow impact shapes flare at a horizontal ground line, then restrained gray smoke dissipates. Clear black contours, flat colors and little shading, transparent background, consistent anchor. No aircraft or troops as independent characters, buildings, scenery, text, UI, cinematic light rays, or giant fireball. |
| 电磁震荡／`skill_age5` | Draw a compact futuristic electromagnetic pulse effect sequence close to the FIRST Age of War Flash game's restrained energy graphics: a short cyan-white pulse band expands near a horizontal ground line, two or three angular blue sparks appear, then the shapes fade. Simple black contours where readable, flat color shapes and minimal glow, transparent background, consistent anchor. No characters, future base, scenery, text, UI, dense particles, lens flare, or screen-filling aura. |

### 基础命中特效

| 类型／资源键 | 完整提示词 |
|---|---|
| 石土命中／`hit_dust` | Draw one small stone-and-dirt impact sequence for the FIRST Age of War early-Flash 2D side-view art style: a brief tan dust puff, two or three gray stone chips, then disappearance. Black contour accents, flat colors, sparse simple shapes. Transparent background, fixed impact anchor, no character, weapon, scenery, text, UI, or cinematic cloud. |
| 金属命中／`hit_metal` | Draw one small metal-hit sequence matching FIRST Age of War early-Flash 2D sprite effects: three short yellow-orange sparks flick out from one point and quickly disappear, with simple black contour accents and flat color shapes. Transparent background, fixed impact anchor, no armor wearer, weapon, scenery, text, UI, realistic debris, or large glow. |
| 火药命中／`hit_explosion` | Draw one small projectile-explosion sequence matching FIRST Age of War early-Flash 2D art: a compact orange-yellow burst, a small gray smoke puff, then fade-out. Flat color masses with clear black contour accents and minimal shading. Transparent background, fixed impact anchor, no soldier, shell launcher, scenery, text, UI, cinematic lighting, or giant fireball. |
| 能量命中／`hit_energy` | Draw one small energy-hit sequence close to FIRST Age of War early-Flash future sprite art: a short cyan or red angular flash at one point, a few simple shards, then disappearance. Flat color shapes, restrained brightness, transparent background, fixed impact anchor. No character, scenery, text, UI, complex electrical web, lens flare, or screen-filling aura. |

## 7. 清单、状态与接入边界

`assets/units/` 当前只保留 [素材说明](../assets/units/README.md) 和 [30 兵提示词清单](../assets/units/generation-plan.json)。旧角色图片、来源记录、预览页、任务记录和旧绘图样本已清理。新清单不包含历史媒体链接、任务编号或已生成文件路径。

清单保持 JSON 数组结构，每项包含 `unit_id`、`name`、`age`、`role`、`style_version`、`reference_urls`、`description_zh`、`prompt`、`negative_prompt`、`animation_prompts` 和 `status`。`animation_prompts` 中每个动作包含 `description_zh`、`frames`、`loop`、`prompt`；英文动作提示词包含单位装备与风格，可单独复制使用。五个基础动作键为 `idle`、`move`、`attack`、`hurt`、`death`，附加动作按需要补充。

当前全部状态为 `提示词已准备，图片未生成`。提示词完成、静态图片生成、透明图验收、动作帧验收和运行时接入是不同阶段，不能相互代替。后续生成后再记录实际工具、日期、尺寸、文件路径、版本和透明度，只有落盘并审核通过的图片才计入素材完成数量。

正式图片及动画接入点仍为角色表现模块；资源按单位 ID 查找，不写入战斗数值、快照或 PvP 协议。打包忽略设置本轮保持原样，待正式资源接入时再调整。现有指挥台 UI 的米色、深绿与金色是界面规范，本次角色与场景风格替换不修改这些控件。
