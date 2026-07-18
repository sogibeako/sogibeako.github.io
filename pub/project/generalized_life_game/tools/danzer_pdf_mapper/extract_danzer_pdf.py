import json
import math
import sys
from pathlib import Path

import pdfplumber


COLOR_NAMES = {
    (0.988235, 0.568627, 0.168627): "orange",
    (0.988235, 0.811765, 0.388235): "yellow",
    (0.078431, 0.039216, 0.388235): "navy",
}


def rounded_color(value):
    if isinstance(value, (int, float)):
        return (round(float(value), 6),)
    return tuple(round(float(v), 6) for v in value)


def point_key(point, scale=1000):
    return f"{round(point[0] * scale)},{round(point[1] * scale)}"


def color_to_hex(color):
    if len(color) < 3:
        return "#9ca3af"
    return "#" + "".join(f"{max(0, min(255, round(channel * 255))):02x}" for channel in color[:3])


def edge_length(a, b):
    return math.hypot(a[0] - b[0], a[1] - b[1])


def write_chunked_data(data, output_js, chunk_size=350):
    chunk_dir = output_js.parent / "chunks"
    chunk_dir.mkdir(parents=True, exist_ok=True)

    triangles = data.pop("triangles")
    meta_text = "window.DANZER_PDF_PATCH = "
    meta_text += json.dumps({**data, "triangles": []}, separators=(",", ":"), ensure_ascii=True)
    meta_text += ";\n"
    meta_text += f"window.DANZER_PATCH_CHUNK_COUNT = {math.ceil(len(triangles) / chunk_size)};\n"
    output_js.write_text(meta_text, encoding="utf-8")

    for index in range(0, len(triangles), chunk_size):
      chunk_index = index // chunk_size
      chunk = triangles[index:index + chunk_size]
      chunk_path = chunk_dir / f"danzer_patch_chunk_{chunk_index:03d}.js"
      chunk_text = "window.DANZER_PDF_PATCH.triangles.push(..."
      chunk_text += json.dumps(chunk, separators=(",", ":"), ensure_ascii=True)
      chunk_text += ");\n"
      chunk_path.write_text(chunk_text, encoding="utf-8")

    return len(triangles), math.ceil(len(triangles) / chunk_size)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python extract_danzer_pdf.py input.pdf output.js")

    input_pdf = Path(sys.argv[1])
    output_js = Path(sys.argv[2])
    output_js.parent.mkdir(parents=True, exist_ok=True)

    with pdfplumber.open(input_pdf) as pdf:
        page = pdf.pages[0]
        triangles = []
        vertices = {}
        length_values = []
        color_names = dict(COLOR_NAMES)
        color_values = {
            name: color_to_hex(color)
            for color, name in color_names.items()
        }

        for curve in page.curves:
            pts = curve.get("pts") or []
            if not curve.get("fill") or len(pts) != 3:
                continue

            color = rounded_color(curve.get("non_stroking_color"))
            if color not in color_names:
                color_names[color] = f"color{len(color_names) + 1}"
                color_values[color_names[color]] = color_to_hex(color)
            color_name = color_names[color]
            normalized = [[round(float(x), 3), round(float(y), 3)] for x, y in pts]

            for point in normalized:
                vertices[point_key(point)] = point
            for i in range(3):
                length_values.append(edge_length(normalized[i], normalized[(i + 1) % 3]))

            triangles.append({
                "id": len(triangles),
                "color": color_name,
                "points": normalized,
            })

    length_values.sort()
    clusters = []
    for value in length_values:
        if not clusters or abs(value - clusters[-1][-1]) > 0.8:
            clusters.append([value])
        else:
            clusters[-1].append(value)

    data = {
        "source": "https://tilings.math.uni-bielefeld.de/img/substitution/danzers-7-fold/patch.pdf",
        "page": {
            "width": round(float(page.width), 3),
            "height": round(float(page.height), 3),
        },
        "colors": color_values,
        "lengthClusters": [
            {
                "count": len(cluster),
                "mean": round(sum(cluster) / len(cluster), 3),
                "min": round(min(cluster), 3),
                "max": round(max(cluster), 3),
            }
            for cluster in clusters
        ],
        "vertexCount": len(vertices),
        "triangles": triangles,
    }

    triangle_count, chunk_count = write_chunked_data(data, output_js)

    print(json.dumps({
        "triangles": triangle_count,
        "vertices": len(vertices),
        "chunks": chunk_count,
        "lengthClusters": data["lengthClusters"],
        "output": str(output_js),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
