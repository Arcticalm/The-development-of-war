# 共享战场背景

`battlefield_shared.png` 为已生成的原始背景：2730×1536、RGB，五时代共用。蓝天、树木、灌丛和土色地面沿用已验收画风，原图保持不变。

已接入小游戏战场。`python scripts/build-world-art.py` 生成等比最长边 960 像素的 RGB JPEG（质量 78）至 `assets/world-art/battlefield_shared.jpg`，不裁源图、不拉伸。运行时按比例放大，并将原图地面线（源 y=1280，索引 `ground_y` 记录缩放值）对齐世界坐标 y=456；战场窗口裁切多余天空和下方地面，随局部视角移动缩放。基地、炮塔、技能及文字角色独立叠加。

开启“简化背景”时不请求背景图片，使用原有 Canvas 简化场景。图片加载中或失败时也回退该场景。背景缓存独立、最多 1 张；五时代复用，不重复请求。游戏包仅包含派生 JPEG，原图目录不打包。

原图制作记录与风格要求保留在 [建筑说明](../buildings/README.md) 和 [美术规范](../../introduction/art.md)；资源与包体检查运行 `python scripts/check-world-art.py`（需要 Pillow）。
