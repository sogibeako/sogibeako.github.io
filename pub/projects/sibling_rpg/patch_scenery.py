import re

# 1. Grab renderMap, tableRow, tableSection from terrain05.htm
with open('terrain05.htm', 'r', encoding='utf-8') as f:
    t5_lines = f.read().split('\n')

start_rm = -1
end_rm = -1
for i, l in enumerate(t5_lines):
    if 'function renderMap(m) {' in l:
        start_rm = i
    if 'function sec(title,' in l:
        end_rm = i + 3 # approx

render_map_code = '\n'.join(t5_lines[start_rm:end_rm])

# 2. Append them to main.js and update enterNextFloor
with open('js/main.js', 'r', encoding='utf-8') as f:
    main_js = f.read()

# Append helper functions to main.js if not already there
if 'function renderMap(m)' not in main_js:
    # also we need to add the missing nl2br
    if 'function nl2br(' not in main_js:
        nl2br_code = """
function nl2br(str) {
  if (!str) return '';
  return String(str).replace(/\\n/g, '<br>');
}
"""
        render_map_code = nl2br_code + "\n" + render_map_code

    main_js += "\n\n// --- Map Rendering Helpers ---\n" + render_map_code

# 3. Update enterNextFloor to use renderMap
main_js = main_js.replace(
    'sceneryEl.innerHTML = esc(floorData.sceneryText);',
    'sceneryEl.innerHTML = renderMap(floorData.mapData);'
)

# 4. Add setInterval for the game loop in onload
init_block = 'initGameState(); // defined in engine-save.js or engine-battle.js'
if 'setInterval(updateGamePanel, 1000);' not in main_js:
    main_js = main_js.replace(
        init_block,
        init_block + '\n  setInterval(updateGamePanel, 1000);'
    )

with open('js/main.js', 'w', encoding='utf-8') as f:
    f.write(main_js)

print("Scenery patch applied.")

