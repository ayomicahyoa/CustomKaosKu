import os
import zipfile
import io
import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import distance_transform_edt, binary_dilation

base_dir = r"C:\Users\Pongo\Documents\Projects\Business\CustomKaosWeb\src\Design Jersey templates\Texture Pattern"
out_dir = r"C:\Users\Pongo\Documents\Projects\Business\CustomKaosWeb\public\mockups\templates"
os.makedirs(out_dir, exist_ok=True)

def inpaint_watermark(pil_img):
    arr = np.array(pil_img)
    h, w, _ = arr.shape
    y_min, y_max = int(h * 0.15), int(h * 0.58)
    
    crop_mask = np.zeros((h, w), dtype=bool)
    region = arr[y_min:y_max, :, :]
    bright = (region[:, :, 0] > 200) & (region[:, :, 1] > 200) & (region[:, :, 2] > 200)
    crop_mask[y_min:y_max, :] = bright
    
    if not np.any(crop_mask):
        return pil_img
        
    dilated = binary_dilation(crop_mask, iterations=2)
    indices = distance_transform_edt(dilated, return_distances=False, return_indices=True)
    result = arr.copy()
    for c in range(3):
        channel = arr[:, :, c]
        result[:, :, c] = np.where(dilated, channel[indices[0], indices[1]], channel)
    
    return Image.fromarray(result)

templates = [
    {
        "id": "design-01",
        "name": "Design 1 - Topography Gold",
        "category": "Modern Abstract",
        "path": os.path.join(base_dir, r"001 - 100\Texture 003.cdr"),
        "collarColor": "#1a1a1a",
        "playerColor": "#111827",
        "description": "Motif kontur topografi modern dengan gradasi emas mewah dan aksen gelap.",
    },
    {
        "id": "design-02",
        "name": "Design 2 - Rossoneri Stripes",
        "category": "Klub & Retro",
        "path": os.path.join(base_dir, r"Special texture\AC Milan 001.cdr"),
        "collarColor": "#dc2626",
        "playerColor": "#ffffff",
        "description": "Garis vertikal klasik merah-hitam legendaris khas Milan dengan tekstur sublimasi.",
    },
    {
        "id": "design-03",
        "name": "Design 3 - Speed Slash Dynamic",
        "category": "Esport & Racing",
        "path": os.path.join(base_dir, r"001 - 100\Texture 012.cdr"),
        "collarColor": "#1e293b",
        "playerColor": "#ffffff",
        "description": "Corak garis dinamis tajam berkecepatan tinggi, favorit tim esport & futsal.",
    },
    {
        "id": "design-04",
        "name": "Design 4 - Geometric Cyber Grid",
        "category": "Geometris",
        "path": os.path.join(base_dir, r"001 - 100\Texture 022.cdr"),
        "collarColor": "#0f172a",
        "playerColor": "#38bdf8",
        "description": "Pola geometris futuristik dengan kedalaman 3D poligon yang tegas.",
    },
    {
        "id": "design-05",
        "name": "Design 5 - Thunder Flash Wave",
        "category": "Dynamic Sport",
        "path": os.path.join(base_dir, r"001 - 100\Texture 042.cdr"),
        "collarColor": "#2563eb",
        "playerColor": "#ffffff",
        "description": "Motif sambaran gelombang energik dengan perpaduan gradasi kontras modern.",
    },
]

for t in templates:
    with zipfile.ZipFile(t["path"], "r") as z:
        raw_img = Image.open(io.BytesIO(z.read("previews/thumbnail.png"))).convert("RGB")
        
        # 1. UI Thumbnail (Keep raw so user can identify the style)
        thumb_path = os.path.join(out_dir, f"{t['id']}_thumb.png")
        thumb = raw_img.copy()
        thumb.thumbnail((400, 500), Image.Resampling.LANCZOS)
        thumb.save(thumb_path, "PNG")
        
        # 2. Inpaint watermark so 100% of the original colors, gradients, and full height are preserved!
        clean_img = inpaint_watermark(raw_img)

        # 3. Build 2048x2048 spotless UV texture sheet
        sheet = Image.new("RGB", (2048, 2048), (255, 255, 255))
        
        # Front Body: (0, 0, 1024, 1375) - FULL HEIGHT ORIGINAL GRADIENT & COLORS
        front = clean_img.resize((1024, 1375), Image.Resampling.LANCZOS)
        sheet.paste(front, (0, 0))
        
        # Back Body: (1024, 0, 1024, 1375) - FULL HEIGHT ORIGINAL GRADIENT & COLORS
        back = clean_img.resize((1024, 1375), Image.Resampling.LANCZOS)
        sheet.paste(back, (1024, 0))
        
        # Left Sleeve: (0, 1375, 795, 545)
        sleeve_crop = clean_img.resize((795, 545), Image.Resampling.LANCZOS)
        sheet.paste(sleeve_crop, (0, 1375))
        
        # Right Sleeve: (795, 1375, 795, 545)
        sleeve_r = ImageOps.mirror(sleeve_crop)
        sheet.paste(sleeve_r, (795, 1375))
        
        # Collar Rib: (0, 1920, 2048, 128)
        collar_strip = clean_img.crop((0, 0, clean_img.width, 30)).resize((2048, 128), Image.Resampling.LANCZOS)
        sheet.paste(collar_strip, (0, 1920))
        
        full_path = os.path.join(out_dir, f"{t['id']}_full.png")
        sheet.save(full_path, "PNG", quality=95)
        print(f"Generated clean full-gradient texture for {t['id']}: {t['name']}")

print("All 5 clean sublimation texture sheets rebuilt successfully with original colors & gradients!")
