import json
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

ROOT = Path(__file__).resolve().parents[1]
FONT = ROOT / "assets/fonts/NotoSansTamil.ttf"
OUT = ROOT / "assets/tracing/glyphs.json"

uyir = list("அஆஇஈஉஊஎஏஐஒஓஔ")
mei_bases = list("கசடதபறஙஞணநமனயரலவழள")
meis = [f"{base}்" for base in mei_bases]
vowel_signs = ["", "ா", "ி", "ீ", "ு", "ூ", "ெ", "ே", "ை", "ொ", "ோ", "ௌ"]
uyirmei = [base + sign for base in mei_bases for sign in vowel_signs]
letters = uyir + meis + uyirmei

font = TTFont(FONT)
glyph_set = font.getGlyphSet()
cmap = font.getBestCmap()
face = hb.Face(str(FONT).encode())
font_hb = hb.Font(face)

def shape(text):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font_hb, buf)
    return buf.glyph_infos, buf.glyph_positions

records = []
for text in letters:
    infos, positions = shape(text)
    pen = SVGPathPen(glyph_set)
    x = 0
    y = 0
    for info, pos in zip(infos, positions):
        glyph_name = font.getGlyphOrder()[info.codepoint]
        transform = TransformPen(pen, (1, 0, 0, -1, x / 64, y / 64))
        glyph_set[glyph_name].draw(transform)
        x += pos.x_advance
        y += pos.y_advance
    d = pen.getCommands().replace("M ", "M").replace(" L", "L").replace(" Z", "Z")
    records.append({"id": text, "ch": text, "d": d})

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(records, ensure_ascii=False), encoding="utf-8")
print(f"Wrote {len(records)} glyphs")
