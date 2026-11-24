"""
Script untuk extract thumbnail dari semua file CDR dan membuat katalog visual HTML.
"""
import os
import zipfile
import html

CDR_BASE_DIR = r"src/Design Jersey templates/Texture Pattern"
OUTPUT_DIR = r"public/cdr_previews"
HTML_OUTPUT = r"public/cdr_catalog.html"

def extract_previews():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    items = []

    for root, dirs, files in os.walk(CDR_BASE_DIR):
        for f in files:
            if f.lower().endswith(".cdr"):
                full_path = os.path.join(root, f)
                rel_folder = os.path.relpath(root, CDR_BASE_DIR)
                clean_name = f.replace(".cdr", "")
                safe_out_name = f"{rel_folder}_{clean_name}.png".replace("\\", "_").replace("/", "_").replace(" ", "_")
                thumb_out_path = os.path.join(OUTPUT_DIR, safe_out_name)

                # Extract preview from CDR
                extracted = False
                try:
                    with zipfile.ZipFile(full_path, 'r') as z:
                        # Try thumbnail.png then page1.png
                        for prev_target in ['previews/thumbnail.png', 'previews/page1.png']:
                            if prev_target in z.namelist():
                                with open(thumb_out_path, 'wb') as out_f:
                                    out_f.write(z.read(prev_target))
                                extracted = True
                                break
                except Exception as e:
                    pass

                if extracted:
                    items.append({
                        "filename": f,
                        "folder": rel_folder,
                        "thumb": f"/cdr_previews/{safe_out_name}",
                        "full_path": full_path
                    })

    # Sort items by folder, then filename
    items.sort(key=lambda x: (x["folder"], x["filename"]))

    # Generate HTML catalog
    html_content = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Katalog Desain Jersey CDR ({len(items)} Desain)</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
        body {{ background: #0f172a; color: #f8fafc; padding: 24px; }}
        header {{ margin-bottom: 24px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; }}
        h1 {{ font-size: 24px; font-weight: 700; color: #38bdf8; }}
        .search-box {{ padding: 10px 16px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; width: 320px; font-size: 14px; outline: none; }}
        .search-box:focus {{ border-color: #38bdf8; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }}
        .card {{ background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; transition: transform 0.2s, border-color 0.2s; }}
        .card:hover {{ transform: translateY(-4px); border-color: #38bdf8; }}
        .img-wrap {{ width: 100%; aspect-ratio: 1; background: #020617; display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: pointer; }}
        .img-wrap img {{ width: 100%; height: 100%; object-fit: contain; }}
        .info {{ padding: 12px; }}
        .name {{ font-weight: 600; font-size: 13px; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
        .folder {{ font-size: 11px; color: #94a3b8; margin-top: 4px; }}
        /* Modal */
        #modal {{ display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 100; align-items: center; justify-content: center; padding: 20px; }}
        #modal.open {{ display: flex; }}
        #modal img {{ max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 8px; }}
        #modal-close {{ position: absolute; top: 20px; right: 24px; font-size: 32px; color: white; cursor: pointer; }}
    </style>
</head>
<body>
    <header>
        <div>
            <h1>Katalog Preview Desain CDR</h1>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Total: <b>{len(items)}</b> template desain jersey</p>
        </div>
        <input type="text" id="search" class="search-box" placeholder="Cari nama desain / folder..." oninput="filterCards()">
    </header>

    <div class="grid" id="cardGrid">
        {"".join([f'''
        <div class="card" data-name="{html.escape(item['filename'].lower())} {html.escape(item['folder'].lower())}">
            <div class="img-wrap" onclick="openModal('{item['thumb']}', '{html.escape(item['filename'])}')">
                <img src="{item['thumb']}" loading="lazy" alt="{html.escape(item['filename'])}">
            </div>
            <div class="info">
                <div class="name" title="{html.escape(item['filename'])}">{html.escape(item['filename'])}</div>
                <div class="folder">{html.escape(item['folder'])}</div>
            </div>
        </div>
        ''' for item in items])}
    </div>

    <div id="modal" onclick="closeModal()">
        <span id="modal-close">&times;</span>
        <img id="modal-img" src="" alt="">
    </div>

    <script>
        function filterCards() {{
            const q = document.getElementById('search').value.toLowerCase();
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {{
                const match = card.getAttribute('data-name').includes(q);
                card.style.display = match ? '' : 'none';
            }});
        }}
        function openModal(src, title) {{
            document.getElementById('modal-img').src = src;
            document.getElementById('modal').classList.add('open');
        }}
        function closeModal() {{
            document.getElementById('modal').classList.remove('open');
        }}
    </script>
</body>
</html>
"""
    with open(HTML_OUTPUT, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"Extracted {len(items)} previews to {OUTPUT_DIR}")
    print(f"Catalog HTML saved to {HTML_OUTPUT}")

if __name__ == "__main__":
    extract_previews()

