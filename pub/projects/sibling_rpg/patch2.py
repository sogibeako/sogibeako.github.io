import re
import os

with open('js/engine-dungeon.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure we find `function generateFloorContent`
pattern = r'function generateFloorContent\(difficulty, floor\)\s*\{[\s\S]*?return\s*\{\s*mapData,\s*sceneryText:[^\n]*,\s*eventData\s*\}\s*;\s*\}'

replacement = """function generateFloorContent(difficulty, floor, context = null) {
      // 深度と階層に基いてマップレベルを算出
      const spreadMod = Math.min(20, floor * 1.5);
      const center = difficulty.center + Math.floor(floor * 0.8);
      const spread = difficulty.spread + spreadMod;

      const mapData = generateMap(center, spread, context);
      
      const sceneryFlavors = [
        "どこからか冷たい風が吹き込んでいる。",
        "足元には崩れかけた石畳が続いている。",
        "異界特有の、奇妙な色をした植物が群生している。",
        "天井から怪しい光が漏れている。",
        "壁には、誰かが刻んだような謎の模様がある。",
        "空気が重く、息苦しさを感じる。"
      ];
      const scenery = pick(sceneryFlavors);

      return {
        mapData,
        sceneryText: `${mapData.tierInfo.label}${mapData.biomeName} の領域。${scenery}`,
        events: mapData.events || []
      };
    }"""

new_text = re.sub(pattern, replacement, text)

if new_text == text:
    print("Match failed. text unchanged.")
else:
    with open('js/engine-dungeon.js', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("Script succeeded.")
