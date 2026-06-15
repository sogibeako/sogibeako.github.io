import re

with open('terrain06.htm', 'r', encoding='utf-8') as f:
    text = f.read()

script_start = text.find("<script>")
script_end = text.rfind("</script>") + 9

html_header = text[:script_start]
html_footer = text[script_end:]

scripts = """  <script src="js/engine-utils.js"></script>
  <script src="js/data-biomes.js"></script>
  <script src="js/data-world.js"></script>
  <script src="js/data-architecture.js"></script>
  <script src="js/data-events.js"></script>
  <script src="js/engine-battle.js"></script>
  <script src="js/engine-save.js"></script>
  <script src="js/engine-dungeon.js"></script>
  <script src="js/main.js"></script>
"""

with open('terrain06.htm', 'w', encoding='utf-8') as f:
    f.write(html_header + scripts + html_footer)

print("Thin HTML generated")
