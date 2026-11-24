import os
import zipfile
import io
from PIL import Image, ImageOps

base_dir = r"C:\Users\Pongo\Documents\Projects\Business\CustomKaosWeb\src\Design Jersey templates\Texture Pattern"
out_dir = r"C:\Users\Pongo\Documents\Projects\Business\CustomKaosWeb\public\mockups\templates"
os.makedirs(out_dir, exist_ok=True)

templates = [
    {
        "id": "design-01",
        "name": "Design 1 - Topography Gold",
        "category": "Modern Abstract",
        "path": os.path.join(base_dir, r"001 - 100\Texture 003.cdr"),
        "collarColor": "#1a1a1a",
        "description": "Motif kontur topografi modern dengan gradasi emas mewah dan aksen hitam."
    },
    {
        "id": "design-02",
        "name": "Design 2 - Rossoneri Stripes",
        "category": "Klub & Retro",
        "path": os.path.join(base_dir, r"Special texture\AC Milan 001.cdr"),
        "collarColor": "#dc2626",
        "description": "Garis vertikal klasik merah-hitam legendaris khas Milan dengan tekstur sublimasi."
    },
    {
        "id": "design-03",
        "name": "Design 3 - Speed Slash Dynamic",
        "category": "Esport & Racing",
        "path": os.path.join(base_dir, r"001 - 100\Texture 012.cdr"),
        "collarColor": "#1e293b",
        "description": "Corak garis dinamis tajam berkecepatan tinggi, sangat populer untuk tim esport & futsal."
    },
    {
        "id": "design-04",
        "name": "Design 4 - Geometric Cyber Grid",
        "category": "Geometris",
        "path": os.path.join(base_dir, r"001 - 100\Texture 022.cdr"),
        "collarColor": "#0f172a",
        "description": "Pola geometris futuristik dengan kedalaman 3D poligon yang tegas."
    },
    {
        "id": "design-05",
        "name": "Design 5 - Thunder Flash Wave",
        "category": "Dynamic Sport",
        "path": os.path.join(base_dir, r"001 - 100\Texture 042.cdr"),
        "collarColor": "#2563eb",
        "description": "Motif sambaran gelombang energik dengan perpaduan gradasi kontras modern."
    },
]

for t in templates:
    with zipfile.ZipFile(t["path"], "r") as z:
        raw_img = Image.open(io.BytesIO(z.read("previews/thumbnail.png"))).convert("RGB")
        
        # 1. Save UI Thumbnail
        thumb_path = os.path.join(out_dir, f"{t['id']}_thumb.png")
        thumb = raw_img.copy()
        thumb.thumbnail((400, 500), Image.Resampling.LANCZOS)
        thumb.save(thumb_path, "PNG")
        
        # 2. Build 2048x2048 full mapped sublimation texture
        sheet = Image.new("RGB", (2048, 2048), (255, 255, 255))
        
        # Front Body: (0, 0, 1024, 1375)
        front = raw_img.resize((1024, 1375), Image.Resampling.LANCZOS)
        sheet.paste(front, (0, 0))
        
        # Back Body: (1024, 0, 1024, 1375)
        back = raw_img.resize((1024, 1375), Image.Resampling.LANCZOS)
        sheet.paste(back, (1024, 0))
        
        # Left Sleeve: (0, 1375, 795, 545)
        sleeve_crop = raw_img.resize((795, 545), Image.Resampling.LANCZOS)
        sheet.paste(sleeve_crop, (0, 1375))
        
        # Right Sleeve: (795, 1375, 795, 545)
        sleeve_r = ImageOps.mirror(sleeve_crop)
        sheet.paste(sleeve_r, (795, 1375))
        
        # Collar Rib: (0, 1920, 2048, 128)
        collar_strip = raw_img.crop((0, 0, raw_img.width, 25)).resize((2048, 128), Image.Resampling.LANCZOS)
        sheet.paste(collar_strip, (0, 1920))
        
        full_path = os.path.join(out_dir, f"{t['id']}_full.png")
        sheet.save(full_path, "PNG", quality=95)
        print(f"Extracted {t['id']}: {t['name']} -> {full_path}")

print("Extraction of 5 templates completed successfully!")

