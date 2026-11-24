import os
import html

PREVIEW_DIR = r"public/cdr_previews_clean"
HTML_OUT = r"public/clean_textures_catalog.html"

def make_catalog():
    if not os.path.exists(PREVIEW_DIR):
        print("Folder preview belum ada")
        return

    files = sorted([f for f in os.listdir(PREVIEW_DIR) if f.endswith(".png")])
    cards = []
    for f in files:
        name = f.replace(".png", "")
        cards.append(f"""
        <div class="card">
            <div class="img-wrap"><img src="/cdr_previews_clean/{f}" loading="lazy"></div>
            <div class="title">{html.escape(name)}</div>
        </div>
        """)

    content = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Katalog Tekstur Bersih (Folder 001 - 100)</title>
    <style>
        body {{ background: #0f172a; color: white; font-family: -apple-system, sans-serif; padding: 24px; }}
        h1 {{ color: #38bdf8; margin-bottom: 8px; font-size: 22px; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; }}
        .card {{ background: #1e293b; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }}
        .img-wrap {{ width: 100%; aspect-ratio: 0.7; background: #020617; overflow: hidden; display: flex; align-items: center; justify-content: center; }}
        .img-wrap img {{ width: 100%; height: 100%; object-fit: contain; }}
        .title {{ padding: 10px; font-size: 13px; font-weight: 600; text-align: center; }}
    </style>
</head>
<body>
    <h1>Katalog Tekstur Bersih (Folder 001 - 100)</h1>
    <p style="color: #94a3b8;">Total: <b>{len(files)}</b> file CDR berhasil dibersihkan dari logo sponsor/apparel.</p>
    <div class="grid">
        {"".join(cards)}
    </div>
</body>
</html>"""

    with open(HTML_OUT, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Saved {HTML_OUT} with {len(files)} items")

if __name__ == "__main__":
    make_catalog()

