import os
import re

src_file = "terrain06.htm"
with open(src_file, "r", encoding="utf-8") as f:
    text = f.read()

script_start = text.find("<script>") + 8
script_end = text.rfind("</script>")
if script_start < 8 or script_end == -1:
    print("Could not find script block")
    exit(1)

js_source = text[script_start:script_end]
html_header = text[:script_start]
html_footer = text[script_end:]

os.makedirs("js", exist_ok=True)

def extract_region(source, start_marker, end_marker=None):
    start = source.find(start_marker)
    if start == -1:
        return ""
    if end_marker:
        end = source.find(end_marker, start)
        if end == -1:
            end = len(source)
    else:
        end = len(source)
    return source[start:end].strip()

# 1. engine-utils.js
utils = extract_region(js_source, "// ─── UTILITY ───", "const DIFFICULTY_PRESETS")
helpers = extract_region(js_source, "// ─── HELPERS ───", "// ─── DIFFICULTY SELECTOR ───")
se = extract_region(js_source, "// --- SE ---", "function clearRestIfFinished")
weighted_utils = extract_region(js_source, "// ─── WEIGHTED PICK UTILS ───", "// ─── TOPOLOGY EVENT WEIGHTS ───")
with open("js/engine-utils.js", "w", encoding="utf-8") as f:
    f.write(f"{utils}\n\n{helpers}\n\n{se}\n\n{weighted_utils}")

# 2. data-biomes.js
diff_presets = extract_region(js_source, "const DIFFICULTY_PRESETS", "// ─── DATA: BASE BIOMES ───")
base_biomes = extract_region(js_source, "// ─── DATA: BASE BIOMES ───", "// ─── DATA: LANDSCAPE ───")
with open("js/data-biomes.js", "w", encoding="utf-8") as f:
    f.write(f"{diff_presets}\n\n{base_biomes}")

# 3. data-world.js
world_data = extract_region(js_source, "// ─── DATA: LANDSCAPE ───", "// ─── DATA: SISTER ACTIONS ───")
with open("js/data-world.js", "w", encoding="utf-8") as f:
    f.write(world_data)

# 4. data-architecture.js
arch_data = extract_region(js_source, "// ─── DATA: SISTER ACTIONS ───", "// ─── DATA: SPECIAL EVENTS ───")
with open("js/data-architecture.js", "w", encoding="utf-8") as f:
    f.write(arch_data)

# 5. data-events.js
events_data = extract_region(js_source, "// ─── DATA: SPECIAL EVENTS ───", "// ─── DATA: CHAOS ───")
chaos_data = extract_region(js_source, "// ─── DATA: CHAOS ───", "// ─── GENERATOR ───")
topo_weights = extract_region(js_source, "// ─── TOPOLOGY EVENT WEIGHTS ───", "// ─── RENDER MAP ───")
with open("js/data-events.js", "w", encoding="utf-8") as f:
    f.write(f"{events_data}\n\n{chaos_data}\n\n{topo_weights}")

# 6. engine-battle.js
state_and_battle = extract_region(js_source, "// ─── STATE ───", "function formatUnitStatus")
with open("js/engine-battle.js", "w", encoding="utf-8") as f:
    f.write(state_and_battle)

# 7. engine-save.js
save_funcs_1 = extract_region(js_source, "function formatUnitStatus", "function updateGamePanel")
save_funcs_2 = extract_region(js_source, "function restNow", "// ─── HELPERS ───")
save_funcs_3 = extract_region(js_source, "function clearRestIfFinished", "// ─── INIT（初期化）───")
with open("js/engine-save.js", "w", encoding="utf-8") as f:
    f.write(f"{save_funcs_1}\n\n{save_funcs_2}\n\n{save_funcs_3}")

# 8. engine-dungeon.js
generator = extract_region(js_source, "// ─── GENERATOR ───", "// ─── STATE ───")
generator_preview = extract_region(js_source, "// --- 次の地形の先読み", "// ─── MAIN EVENT PICKER ───")
event_picker = extract_region(js_source, "// ─── MAIN EVENT PICKER ───", "// ─── WEIGHTED PICK UTILS ───")
with open("js/engine-dungeon.js", "w", encoding="utf-8") as f:
    f.write(f"{generator}\n\n{generator_preview}\n\n{event_picker}")

# 9. main.js
main_1 = extract_region(js_source, "function updateGamePanel", "function restNow")
main_2 = extract_region(js_source, "// ─── DIFFICULTY SELECTOR ───", "// --- 次の地形の先読み")
# Wait, "function generate" starts at "// ─── GENERATE ───" inside main_2.
# Let's adjust main_2 to stop at "function generatePreview"
main_3 = extract_region(js_source, "// ─── RENDER MAP ───", "// --- SE ---")
main_init = extract_region(js_source, "// ─── INIT（初期化）───")
with open("js/main.js", "w", encoding="utf-8") as f:
    f.write(f"{main_1}\n\n{main_2}\n\n{main_3}\n\n{main_init}")

print("Splitting complete!")
