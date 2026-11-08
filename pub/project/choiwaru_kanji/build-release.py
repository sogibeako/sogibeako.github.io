"""Rebuild the static distribution. Run from any working directory."""
from pathlib import Path
from shutil import copyfile
from zipfile import ZipFile, ZIP_DEFLATED

SOURCE = Path(__file__).resolve().parent
PUBLIC = SOURCE.parent.parent / "jssproject" / "0039"
FILES = (
    "index.html", "editor.html", "editor.js", "editor.css",
    "kanji-core.js", "kanji-renderer.js", "kanji-renderer.css",
    "dictionary.json", "demo.html", "demo.js", "downloads.html", "README.md",
    "ttf-writer.js", "kanji-font.js", "font-export.js",
)

def main():
    files = (*FILES, *(str(p.relative_to(SOURCE)) for p in sorted((SOURCE / "font-assets").glob("*")) if p.is_file()))
    for name in files:
        if not (SOURCE / name).is_file():
            raise FileNotFoundError(name)
    archive = SOURCE / "choiwaru-kanji.zip"
    with ZipFile(archive, "w", ZIP_DEFLATED) as package:
        for name in files:
            package.write(SOURCE / name, f"choiwaru-kanji/{Path(name).as_posix()}")
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for name in (*files, archive.name):
        (PUBLIC / name).parent.mkdir(parents=True, exist_ok=True)
        copyfile(SOURCE / name, PUBLIC / name)
    print(f"Packaged {len(files)} files; published copy: {PUBLIC}")

if __name__ == "__main__":
    main()
