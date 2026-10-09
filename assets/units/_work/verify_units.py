# -*- coding: utf-8 -*-
"""Programmatic acceptance check for the 30 unit PNGs.
Checks: file exists, PNG signature, dimensions, IHDR color type (6=RGBA, 4=GA -> true alpha),
non-trivial file size. Reports a per-unit table."""
import json, io, os, struct

UNITS_DIR = r"E:\Box\important\The-development-of-war\assets\units"
HELPER = r"E:\Box\important\The-development-of-war\assets\units\_work\unit_generation_instructions.json"

def png_info(path):
    with open(path, "rb") as f:
        head = f.read(33)
    if len(head) < 33 or head[:8] != b"\x89PNG\r\n\x1a\n":
        return None, None, None, "not-png"
    w, h = struct.unpack(">II", head[16:24])
    depth, ctype = head[24], head[25]
    return w, h, ctype, "ok"

def main():
    with io.open(HELPER, encoding="utf-8") as f:
        helper = json.load(f)
    rows = []
    for e in helper:
        pid = e["unit_id"]
        path = os.path.join(UNITS_DIR, pid + ".png")
        if not os.path.isfile(path):
            rows.append((pid, "MISSING", "-", "-", "-", "missing"))
            continue
        w, h, ctype, status = png_info(path)
        size = os.path.getsize(path)
        alpha = ctype in (4, 6)
        rows.append((pid, "%dx%d" % (w, h), ctype, "Y" if alpha else "N", size, status))
    print("%-14s %-12s %-6s %-6s %-9s %s" % ("unit_id", "dims", "ctype", "alpha", "bytes", "state"))
    for r in rows:
        print("%-14s %-12s %-6s %-6s %-9s %s" % (r[0], r[1], r[2], r[3], r[4], r[5]))
    miss = [r[0] for r in rows if r[5] == "missing"]
    bad = [r[0] for r in rows if r[5] != "missing" and r[3] == "N"]
    print("TOTAL=%d MISSING=%d NO_ALPHA=%d" % (len(rows), len(miss), len(bad)))
    if miss: print("MISSING:", ", ".join(miss))
    if bad: print("NO_ALPHA:", ", ".join(bad))

if __name__ == "__main__":
    main()
