"""
Script batch untuk membersihkan logo dari file CDR menggunakan otomasi CorelDRAW.
Menghapus grup logo di atas background dan menyimpan file CDR bersih ke folder TextureOnly.
"""
import os
import sys
import shutil
import time
import gc
import zipfile
import win32com.client

BASE_DIR = r"src/Design Jersey templates/Texture Pattern"
OUTPUT_DIR = r"src/Design Jersey templates/Texture Pattern/TextureOnly"
PREVIEW_DIR = r"public/cdr_previews_clean"

def get_corel_app():
    app = win32com.client.Dispatch("CorelDRAW.Application")
    app.Visible = False
    return app

def clean_folder(folder_name="001 - 100"):
    in_dir = os.path.join(BASE_DIR, folder_name)
    if not os.path.exists(in_dir):
        print(f"Folder tidak ditemukan: {in_dir}")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(PREVIEW_DIR, exist_ok=True)

    files = sorted([f for f in os.listdir(in_dir) if f.lower().endswith(".cdr") and not f.startswith("Backup_of_")])
    total = len(files)
    print(f"\n=== Memulai Pembersihan Logo CDR ({total} file di '{folder_name}') ===")

    app = get_corel_app()
    success_count = 0
    error_count = 0

    for idx, fname in enumerate(files, 1):
        in_path = os.path.abspath(os.path.join(in_dir, fname))
        out_path = os.path.abspath(os.path.join(OUTPUT_DIR, fname))

        print(f"[{idx}/{total}] Memproses: {fname}...", end=" ", flush=True)

        try:
            shutil.copy(in_path, out_path)

            doc = app.OpenDocument(out_path)
            page = doc.ActivePage

            deleted_shapes = 0
            for i in range(page.Shapes.Count, 0, -1):
                s = page.Shapes(i)
                if s.SizeWidth < 8.0 or s.SizeHeight < 11.0:
                    s.Delete()
                    deleted_shapes += 1

            doc.Save()
            doc.Close()
            del doc
            gc.collect()

            # Bersihkan file backup CorelDRAW otomatis jika ada
            backup_path = os.path.join(OUTPUT_DIR, f"Backup_of_{fname}")
            if os.path.exists(backup_path):
                try:
                    os.remove(backup_path)
                except:
                    pass

            # Ekstrak preview bersih
            thumb_name = fname.replace(".cdr", ".png")
            thumb_path = os.path.join(PREVIEW_DIR, thumb_name)
            try:
                with zipfile.ZipFile(out_path, 'r') as z:
                    for prev_target in ['previews/thumbnail.png', 'previews/page1.png']:
                        if prev_target in z.namelist():
                            with open(thumb_path, 'wb') as pf:
                                pf.write(z.read(prev_target))
                            break
            except Exception:
                pass

            print(f"BERHASIL! (Dihapus: {deleted_shapes} logo group)")
            success_count += 1
            time.sleep(0.3)

        except Exception as e:
            print(f"ERROR: {e}")
            error_count += 1
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

    print(f"\n=== SELESAI FOLDER: {folder_name} ===")
    print(f"Total: {total} | Berhasil: {success_count} | Error: {error_count}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "001 - 100"
    clean_folder(target)
