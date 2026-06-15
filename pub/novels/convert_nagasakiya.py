import os
import re

def convert():
    base_dir = r"c:/Users/ks_ar/OneDrive/デスクトップ/project/mizuhara_hp/novels"
    md_path = os.path.join(base_dir, "nagasakiya.md")
    out_path = os.path.join(base_dir, "nagasakiya.htm")
    
    with open(md_path, "r", encoding="utf-8") as f:
        md_text = f.read()

    # Extract title
    title = "長崎屋帯広店の兄妹"
    lines = md_text.splitlines()
    if lines and lines[0].startswith("# "):
        title = lines[0][2:].strip()
        lines = lines[1:]

    # Parse body
    html_body_lines = []
    in_code_block = False
    
    for line in lines:
        if line.startswith("```"):
            if not in_code_block:
                html_body_lines.append('<pre><code>')
                in_code_block = True
            else:
                html_body_lines.append('</code></pre>')
                in_code_block = False
            continue
            
        if in_code_block:
            # Escape HTML characters in ASCII art
            safe_line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            html_body_lines.append(safe_line)
            continue
            
        if not line.strip():
            html_body_lines.append('<br />')
            continue
            
        # Bold text
        line = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', line)
        
        # Add to body (using basic line breaks for novels, similar to existing sites)
        html_body_lines.append('<div class="p_left">' + line + '</div>')

    content_html = "\n".join(html_body_lines)
    
    # Structure
    html = f"""<!DOCTYPE html>
<html lang="ja">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{title} // Novels</title>
    <!-- MathJax for rendering math blocks -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-AMS_CHTML"></script>
    <style>
        body {{
            font-size: 1rem;
            background-color: #111822;
            margin: 0;
            padding: 0;
            text-align: center;
            line-height: 1.6;
        }}
        h1 {{
            background-color: #609aa0;
            color: black;
            padding: 0.5em;
        }}
        .p_left {{
            text-align: left;
        }}
        .wrapper {{
            max-width: 700px;
            width: 80%;
            margin: 50px auto;
            padding: 20px;
            border: 0px solid #111;
            background-color: #afd3e6;
            font-family: "Segoe UI", "Arial Unicode MS", "MS PGothic", "sans-serif";
        }}
        hr {{
            border-width: 2px 0 0 0;
            border-style: dashed;
            border-color: #609aa0
        }}
        .rain-window-btn {{
            position: relative;
            width: 200px;
            height: 64px;
            background: rgba(17, 24, 34, 0.85);
            border: 2px solid #609aa055;
            cursor: pointer;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            transition: border-color 0.4s, box-shadow 0.4s;
            margin: 0 auto;
        }}
        .rain-window-btn canvas {{
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }}
        .rain-window-btn .rw-label {{
            position: relative;
            z-index: 1;
            font-family: 'Zen Maru Gothic', sans-serif;
            font-weight: 700;
            font-size: 1rem;
            letter-spacing: 0.2em;
            color: #e3e8f1;
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
            transition: text-shadow 0.4s;
        }}
        .rain-window-btn:hover {{
            border-color: #9ec8d1;
            box-shadow: 0 0 24px rgba(158, 200, 209, 0.15);
        }}
        .rain-window-btn:hover .rw-label {{
            text-shadow: 0 0 10px rgba(158, 200, 209, 0.5), 0 1px 4px rgba(0, 0, 0, 0.6);
        }}
        pre {{
            text-align: left;
            background-color: #e3e8f1;
            padding: 10px;
            overflow-x: auto;
            border-radius: 4px;
            font-family: monospace;
            line-height: 1.2;
        }}
        @media screen and (max-width: 600px) {{
            body {{
                font-size: 0.7rem;
            }}
            h1 {{
                font-size: 1rem;
            }}
            .wrapper {{
                width: 95%;
                padding: 10px;
                word-wrap: break-word;
                box-sizing: border-box;
            }}
        }}
    </style>
</head>

<body>
    <div class="wrapper">
        <div class="p_left">現在位置 : <a href="../index.html"><b>ホーム</b></a> ＞ <a href="index.htm"><b>Novels</b></a> ＞ <b>{title}</b></div>
        <h1>{title}</h1>
        <br />
        {content_html}
        <br />
        <hr />
        <br />
        <div style="text-align: center;">
            <a href="index.htm" class="rain-window-btn">
                <canvas data-rainwindow="true"></canvas>
                <span class="rw-label">Back</span>
            </a>
        </div>
    </div>

    <script>
        document.querySelectorAll('canvas[data-rainwindow]').forEach(cv => {{
            const dpr = window.devicePixelRatio || 1;
            const parent = cv.parentElement;
            const rect = parent.getBoundingClientRect();
            cv.width = rect.width * dpr;
            cv.height = rect.height * dpr;
            const ctx = cv.getContext('2d');
            ctx.scale(dpr, dpr);
            const w = rect.width, h = rect.height;

            const drops = Array.from({{ length: 30 }}, () => ({{
                x: Math.random() * w,
                y: Math.random() * h,
                speed: 0.5 + Math.random() * 1.5,
                len: 4 + Math.random() * 10,
                opacity: 0.15 + Math.random() * 0.35,
                width: 0.5 + Math.random() * 0.8
            }}));

            const splashes = [];

            function draw() {{
                ctx.clearRect(0, 0, w, h);

                drops.forEach(d => {{
                    ctx.beginPath();
                    ctx.moveTo(d.x, d.y);
                    ctx.lineTo(d.x - 0.3, d.y + d.len);
                    ctx.strokeStyle = `rgba(158,200,209,${{d.opacity}})`;
                    ctx.lineWidth = d.width;
                    ctx.stroke();
                    d.y += d.speed;
                    if (d.y > h) {{
                        splashes.push({{ x: d.x, y: h - 2, r: 0, opacity: 0.4 }});
                        d.y = -d.len - Math.random() * 20;
                        d.x = Math.random() * w;
                    }}
                }});

                splashes.forEach(s => {{
                    s.r += 0.3;
                    s.opacity -= 0.015;
                    if (s.opacity <= 0) return;
                    ctx.beginPath();
                    ctx.ellipse(s.x, s.y, s.r * 1.5, s.r * 0.5, 0, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(158,200,209,${{s.opacity}})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }});

                while (splashes.length > 0 && splashes[0].opacity <= 0) splashes.shift();
                requestAnimationFrame(draw);
            }}
            draw();
        }});
    </script>
</body>
</html>
"""
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("Done")

if __name__ == "__main__":
    convert()
