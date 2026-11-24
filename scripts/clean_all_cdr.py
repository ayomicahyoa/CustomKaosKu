"""
Script batch untuk membersihkan logo dari SEMUA file CDR di seluruh folder secara berurutan.
Menghapus logo dummy dan mengekstrak preview bersih ke katalog web.
"""
import os
import sys
import shutil
import time
import gc
import zipfile
import html
import win32com.client

BASE_DIR = r"src/Design Jersey templates/Texture Pattern"
OUTPUT_DIR = r"src/Design Jersey templates/Texture Pattern/TextureOnly"
PREVIEW_DIR = r"public/cdr_previews_clean"
CATALOG_HTML = r"public/clean_textures_catalog.html"

# Urutan folder yang akan diproses
FOLDERS = [
    "101 - 200",
    "201 - 300",
    "301 - 400",
    "401 - 500",
    "501 - 600",
    "601 -",
    "Special texture"
]

def get_corel_app():
    app = win32com.client.Dispatch("CorelDRAW.Application")
    app.Visible = False
    return app

def update_catalog():
    if not os.path.exists(PREVIEW_DIR):
        return
    files = sorted([f for f in os.listdir(PREVIEW_DIR) if f.endswith(".png")])
    cards = []
    for f in files:
        name = f.replace(".png", "")
        cards.append(f"""
        <div class="card" data-name="{html.escape(name.lower())}">
            <div class="img-wrap"><img src="/cdr_previews_clean/{f}" loading="lazy"></div>
            <div class="title" title="{html.escape(name)}">{html.escape(name)}</div>
        </div>
        """)

    content = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Katalog Desain Jersey Bersih ({len(files)} Tekstur)</title>
    <style>
        * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
        body {{ background: #0f172a; color: white; padding: 24px; }}
        header {{ margin-bottom: 20px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; }}
        h1 {{ color: #38bdf8; font-size: 24px; font-weight: 700; }}
        .search-box {{ padding: 10px 16px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; width: 320px; font-size: 14px; outline: none; }}
        .search-box:focus {{ border-color: #38bdf8; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }}
        .card {{ background: #1e293b; border-radius: 8px; overflow: hidden; border: 1px solid #334155; transition: transform 0.2s; }}
        .card:hover {{ transform: translateY(-3px); border-color: #38bdf8; }}
        .img-wrap {{ width: 100%; aspect-ratio: 0.72; background: #020617; overflow: hidden; display: flex; align-items: center; justify-content: center; }}
        .img-wrap img {{ width: 100%; height: 100%; object-fit: contain; }}
        .title {{ padding: 8px 10px; font-size: 12px; font-weight: 600; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
    </style>
</head>
<body>
    <header>
        <div>
            <h1>Katalog Tekstur Bersih (TextureOnly)</h1>
            <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Total: <b>{len(files)}</b> tekstur CDR bersih siap pakai</p>
        </div>
        <input type="text" id="search" class="search-box" placeholder="Cari nama tekstur..." oninput="filterCards()">
    </header>
    <div class="grid" id="grid">
        {"".join(cards)}
    </div>
    <script>
        function filterCards() {{
            const q = document.getElementById('search').value.toLowerCase();
            document.querySelectorAll('.card').forEach(c => {{
                c.style.display = c.getAttribute('data-name').includes(q) ? '' : 'none';
            }});
        }}
    </script>
</body>
</html>"""
    with open(CATALOG_HTML, "w", encoding="utf-8") as f:
        f.write(content)

def clean_all():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(PREVIEW_DIR, exist_ok=True)

    app = get_corel_app()
    total_processed = 0
    total_skipped = 0
    total_errors = 0

    for folder_name in FOLDERS:
        in_dir = os.path.join(BASE_DIR, folder_name)
        if not os.path.exists(in_dir):
            continue

        files = sorted([f for f in os.listdir(in_dir) if f.lower().endswith(".cdr") and not f.startswith("Backup_of_")])
        print(f"\n==========================================")
        print(f"=== FOLDER: {folder_name} ({len(files)} file) ===")
        print(f"==========================================")

        for idx, fname in enumerate(files, 1):
            in_path = os.path.abspath(os.path.join(in_dir, fname))
            out_path = os.path.abspath(os.path.join(OUTPUT_DIR, fname))
            thumb_path = os.path.join(PREVIEW_DIR, fname.replace(".cdr", ".png"))

            # Jika sudah pernah dibersihkan dan preview ada, skip
            if os.path.exists(out_path) and os.path.exists(thumb_path) and os.path.getsize(out_path) > 1000:
                print(f"[{idx}/{len(files)}] {fname} -> SUDAH ADA (Skip)")
                total_skipped += 1
                continue

            print(f"[{idx}/{len(files)}] Memproses: {fname}...", end=" ", flush=True)

            success = False
            for attempt in range(2):
                try:
                    shutil.copy(in_path, out_path)

                    doc = app.OpenDocument(out_path)
                    page = doc.ActivePage

                    deleted_shapes = 0
                    # Cari ukuran shape terbesar sebagai background
                    max_area = 0
                    for i in range(1, page.Shapes.Count + 1):
                        s = page.Shapes(i)
                        area = s.SizeWidth * s.SizeHeight
                        if area > max_area:
                            max_area = area

                    # Hapus logo (shape yang luasnya jauh lebih kecil dari background atau < 40 sq in)
                    for i in range(page.Shapes.Count, 0, -1):
                        s = page.Shapes(i)
                        area = s.SizeWidth * s.SizeHeight
                        # Jika luas < 45 sq inch ATAU lebar < 7.0 ATAU tinggi < 8.5
                        if area < 45.0 or s.SizeWidth < 7.0 or s.SizeHeight < 8.5:
                            s.Delete()
                            deleted_shapes += 1

                    doc.Save()
                    doc.Close()
                    del doc
                    gc.collect()

                    # Hapus Corel backup
                    backup_path = os.path.join(OUTPUT_DIR, f"Backup_of_{fname}")
                    if os.path.exists(backup_path):
                        try:
                            os.remove(backup_path)
                        except:
                            pass

                    # Ekstrak thumbnail
                    try:
                        with zipfile.ZipFile(out_path, 'r') as z:
                            for prev_target in ['previews/thumbnail.png', 'previews/page1.png']:
                                if prev_target in z.namelist():
                                    with open(thumb_path, 'wb') as pf:
                                        pf.write(z.read(prev_target))
                                    break
                    except:
                        pass

                    print(f"BERHASIL! (Dihapus: {deleted_shapes} logo)")
                    total_processed += 1
                    success = True
                    time.sleep(0.2)
                    break

                except Exception as e:
                    if attempt == 0:
                        # Reconnect Corel and retry
                        try:
                            del app
                        except:
                            pass
                        gc.collect()
                        time.sleep(1)
                        try:
                            app = get_corel_app()
                        except:
                            pass
                    else:
                        print(f"ERROR: {e}")
                        total_errors += 1

        # Update web catalog setelah tiap folder selesai
        update_catalog()

    print("\n==========================================")
    print("=== SEMUA FOLDER SELESAI DIPROSES ===")
    print(f"Diproses: {total_processed} | Dilewati (sudah ada): {total_skipped} | Error: {total_errors}")
    print("==========================================")

if __name__ == "__main__":
    clean_all()

