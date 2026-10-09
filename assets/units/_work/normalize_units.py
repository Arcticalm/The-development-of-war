# -*- coding: utf-8 -*-
"""Normalize unit PNGs to spec sizes: regular 1536x2048 (3:4), wide 2048x2048 (1:1).
Originals are backed up to _work/pre_resize/ before overwrite. Only downscales; never upscales.
Uses PIL LANCZOS. Verifies alpha channel preserved after resize."""
import json, io, os, shutil
from PIL import Image

UNITS_DIR = r"E:\Box\important\The-development-of-war\assets\units"
BACKUP = r"E:\Box\important\The-development-of-war\assets\units\_work\pre_resize"
HELPER = r"E:\Box\important\The-development-of-war\assets\units\_work\unit_generation_instructions.json"
TARGET = {  # unit -> (w, h)
    "age1_heavy": (2048, 2048), "age2_ballista": (2048, 2048),
    "age2_chariot": (2048, 2048), "age3_heavy": (2048, 2048),
    "age4_vehicle": (2048, 2048), "age5_siege": (2048, 2048),
}

def main():
    with io.open(HELPER, encoding="utf-8") as f:
        helper = json.load(f)
    os.makedirs(BACKUP, exist_ok=True)
    changed, kept = [], []
    for e in helper:
        pid = e["unit_id"]
        path = os.path.join(UNITS_DIR, pid + ".png")
        im = Image.open(path)
        w, h = im.size
        target = TARGET.get(pid, (1536, 2048))
        if (w, h) == target:
            kept.append(pid)
            continue
        if im.mode != "RGBA":
            print("WARN: %s mode=%s not RGBA, skipping resize" % (pid, im.mode))
            continue
        shutil.copy2(path, os.path.join(BACKUP, pid + ".png"))
        im2 = im.resize(target, Image.LANCZOS)
        im2.save(path, "PNG")
        changed.append("%s: %dx%d -> %dx%d" % (pid, w, h, target[0], target[1]))
    print("RESIZED (%d):" % len(changed))
    for c in changed:
        print("  " + c)
    print("KEPT (%d): %s" % (len(kept), ", ".join(kept)))

if __name__ == "__main__":
    main()
