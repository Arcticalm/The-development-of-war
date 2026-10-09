# -*- coding: utf-8 -*-
"""Build per-unit generation instructions for the 30-unit portrait task.
Reads generation-plan.json, assembles the locked style + unit section + locked
composition + combined negatives into one img2img prompt per unit, and writes
unit_generation_instructions.json consumed by all slice subagents."""
import json, io, sys

SRC = r"E:\Box\important\The-development-of-war\assets\units\generation-plan.json"
OUT = r"E:\Box\important\The-development-of-war\assets\units\_work\unit_generation_instructions.json"

LOCKED_STYLE = ("very crude early-Flash web-game sprite style, as if hand-drawn with a chunky "
"brush: thick irregular wobbly black outlines, blocky simplified body shapes, stiff simple "
"standing pose, flat muted aged local colors, NO gradients, NO soft shading, at most one flat "
"hard-edged shadow patch, very sparse detail, plain dot eyes, slightly clumsy proportions and "
"imperfect line joins; deliberately unpolished and imperfect; absolutely avoid smooth AI "
"rendering, clean vector polish, perfect anatomy, glossy finish")

COMPOSITION = ("Draw ONE complete unit in full-body side view facing RIGHT, in a natural ready "
"pose. Show every foot, weapon tip, mount, wheel, and machine completely, with clear margins. "
"A rider and mount or one operator and artillery count as ONE composite unit. Plain flat "
"uniform white background (will be made transparent later), no ground shadow, no scenery, "
"no text, no UI, no frame, no extra independent character. One static pose, not a "
"multi-pose sheet.")

EXTRA_NEG = ("chibi, oversized head/hands, bodybuilder, anime portrait, photorealism, 3D render, "
"gradient, soft shading, glossy, polished AI look, front-facing, cropped, extra limbs, "
"extra soldiers, text, UI, border, checkerboard background")

ERA_EN = {
    "age1": "Primitive era: pale earth-tone skin, brown hide skirt, stone and bone weapons, crude rope and fur.",
    "age2": "Classical era: earthy brown cloth and leather, iron-gray steel, shield, sword, bow, spear and helmet.",
    "age3": "Gunpowder era: brown-gray military uniform, musket with bayonet, artillery on a wooden carriage, tricorn or shako hat.",
    "age4": "Modern era: olive-green khaki uniform, steel helmet, rifle, machine gun, rocket launcher, tracked vehicle.",
    "age5": "Future era: dark gray armor plating, small accents of red and cyan energy glow, sci-fi weapons.",
}
ERA_ZH = {
    "age1": "原始：浅土色皮肤/褐皮裙/石器骨矛",
    "age2": "古典：土褐布/铁灰/盾弓枪盔",
    "age3": "火药：褐灰军衣/火枪刺刀/炮架",
    "age4": "现代：橄榄绿卡其/钢盔/步枪机枪坦克",
    "age5": "未来：深灰装甲/少量红青能量色",
}
WIDE = {"age1_heavy", "age2_ballista", "age2_chariot", "age3_heavy", "age4_vehicle", "age5_siege"}

def main():
    with io.open(SRC, encoding="utf-8") as f:
        plan = json.load(f)
    out = []
    for e in plan:
        pid = e["unit_id"]
        prompt = e["prompt"]
        # extract the "Unit: ..." paragraph (unit content section)
        paras = [p.strip() for p in prompt.split("\n\n") if p.strip()]
        unit_sec = None
        for p in paras:
            if p.startswith("Unit:"):
                unit_sec = p
                break
        if unit_sec is None:
            # fallback: text after the style paragraph
            unit_sec = paras[1] if len(paras) > 1 else prompt
        age = e["age"]
        final_prompt = (
            "[img0] is the style anchor: preserve its exact very crude early-Flash web-game "
            "sprite style. Style requirements: %s\n\n"
            "Draw a brand-new unit in the same rough hand-drawn sprite style as [img0]:\n"
            "%s\nEra palette hints: %s\n\n"
            "%s\n\n"
            "Negative prompt: %s" % (LOCKED_STYLE, unit_sec, ERA_EN.get(age, ""), COMPOSITION,
                                     e["negative_prompt"] + ", " + EXTRA_NEG)
        )
        out.append({
            "unit_id": pid,
            "name": e["name"],
            "age": age,
            "age_zh": ERA_ZH.get(age, ""),
            "role": e["role"],
            "is_wide": pid in WIDE,
            "size": [2048, 2048] if pid in WIDE else [2048, 1536],  # [h, w]
            "unit_section": unit_sec,
            "prompt": final_prompt,
            "negative": e["negative_prompt"] + ", " + EXTRA_NEG,
            "description_zh": e.get("description_zh", ""),
        })
    with io.open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print("wrote %d units -> %s" % (len(out), OUT))
    # anchor dims check
    try:
        from PIL import Image
        im = Image.open(r"E:\Box\important\The-development-of-war\assets\units\_work\trial1a.jpg")
        print("anchor size:", im.size, "mode:", im.mode)
    except Exception as ex:
        print("PIL anchor check failed:", ex)

if __name__ == "__main__":
    main()
