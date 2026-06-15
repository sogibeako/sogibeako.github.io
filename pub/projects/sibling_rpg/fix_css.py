import re

with open('terrain06.htm', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove the raw CSS block I accidentally injected
start_css = '    /* FFA BATTLE STYLE */'
idx1 = text.find(start_css)

if idx1 != -1:
    end_str = "font-family:'MS PMincho', serif; }"
    idx2 = text.find(end_str, idx1)
    if idx2 != -1:
        ext_end = idx2 + len(end_str)
        text = text[:idx1] + text[ext_end:]

# Now inject it back SAFELY inside the existing <style> tag
idx_style = text.find('</style>')
if idx_style != -1:
    proper_css = """
    /* FFA BATTLE STYLE */
    .ffa-b1 { background: #9ac; border: 1px solid #ccf; border-color: #ccf #669 #669 #ccf; color: #fff; font-size:11pt; padding:4px;}
    .ffa-b2 { background: #669; border: 1px solid #99c; border-color: #99c #336 #336 #99c; color: #fff; text-align: center; font-size:11pt; font-weight:bold; padding:4px;}
    .ffa-dmg { color: #FF0000; font-size: 18pt; font-weight:bold; }
    .ffa-heal { color: #00FF00; font-size: 18pt; font-weight:bold; }
    .ffa-crit { color: #0000FF; font-size: 18pt; font-weight:bold; }
    .ffa-table { border-collapse: collapse; width: 100%; border: 1px solid #333; }
    .ffa-table td { font-size: 11pt; color: #333333; background: #ffffff; padding: 4px; border: 1px solid #333; }
    
    .ffa-hp-bar { display: inline-block; height: 5px; background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAFCAMAAACwQz+XAAAAA1BMVEUAAACnej3aAAAAFElEQVQImWNgYGIAEwxYBBhgYAAAAwgAATV1m2AAAAAASUVORK5CYII=') repeat-x; }
    .ffa-hp-empty { display: inline-block; height: 5px; background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAMAAAC6s1CPAAAAA1BMVEWAgICAX0AAAAAEQVR42mNgAAAAQwABR0f6cwAAAABJRU5ErkJggg==') repeat-x; }

    #battleLogTerminal { display:flex; flex-direction:column; gap:12px; background: #FFFFFF; color:#333; border:2px solid #555; padding:16px; min-height:400px; height:auto; overflow-y:visible; border-radius:4px; font-family:'MS PMincho', serif; }
"""
    text = text[:idx_style] + proper_css + text[idx_style:]

with open('terrain06.htm', 'w', encoding='utf-8') as f:
    f.write(text)

print("CSS Fixed cleanly.")
