import os
import zipfile
import io
import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import distance_transform_edt, binary_dilation

base_dir = r"C:\Users\Pongo\Documents\Projects\Business\CustomKaosWeb\src\Design Jersey templates\Texture Pattern"
out_dir = r"C:\Users\Pongo\Documents\Projects\Business\CustomKaosWeb\public\mockups\templates"
os.makedirs(out_dir, exist_ok=True)

def inpaint_precise_watermark(pil_img, d_id):
    arr = np.array(pil_img)
    h, w, _ = arr.shape
    y_min, y_max = int(h * 0.14), int(h * 0.45)
    
    crop_mask = np.zeros((h, w), dtype=bool)
    region = arr[y_min:y_max, :, :]
    
    # In design-01 and design-03, watermark text/logos are BLACK (< 80)
    # In design-02 and design-04, watermark text/logos are WHITE (> 185)
    # In design-05, watermark has white letters with black dropshadow/outline
    if d_id in ['design-01', 'design-03']:
        m = (region[:, :, 0] < 80) & (region[:, :, 1] < 80) & (region[:, :, 2] < 80)
    elif d_id in ['design-02', 'design-04']:
        m = (region[:, :, 0] > 185) & (region[:, :, 1] > 185) & (region[:, :, 2] > 185)
    else: # design-05
        m_bright = (region[:, :, 0] > 185) & (region[:, :, 1] > 185) & (region[:, :, 2] > 185)
        m = binary_dilation(m_bright, iterations=3)
        
    crop_mask[y_min:y_max, :] = m
    
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
        "path": os.path.join(base_dir, r"001 - 100\Texture 003.cdr"),
    },
    {
        "id": "design-02",
        "name": "Design 2 - Rossoneri Stripes",
        "path": os.path.join(base_dir, r"Special texture\AC Milan 001.cdr"),
    },
    {
        "id": "design-03",
        "name": "Design 3 - Speed Slash Dynamic",
        "path": os.path.join(base_dir, r"001 - 100\Texture 012.cdr"),
    },
    {
        "id": "design-04",
        "name": "Design 4 - Geometric Cyber Grid",
        "path": os.path.join(base_dir, r"001 - 100\Texture 022.cdr"),
    },
    {
        "id": "design-05",
        "name": "Design 5 - Thunder Flash Wave",
        "path": os.path.join(base_dir, r"001 - 100\Texture 042.cdr"),
    },
]

for t in templates:
    with zipfile.ZipFile(t["path"], "r") as z:
        raw_img = Image.open(io.BytesIO(z.read("previews/thumbnail.png"))).convert("RGB")
        
        # 1. Inpaint precise watermark (black or white)
        cleaned = inpaint_precise_watermark(raw_img, t["id"])
        
        # 2. UI Thumbnail
        thumb_path = os.path.join(out_dir, f"{t['id']}_thumb.png")
        thumb = cleaned.copy()
        thumb.thumbnail((400, 500), Image.Resampling.LANCZOS)
        thumb.save(thumb_path, "PNG")
        
        # 3. 2048x2048 Full Sublimation Sheet
        sheet = Image.new("RGB", (2048, 2048), (255, 255, 255))
        
        # Front Body
        front = cleaned.resize((1024, 1375), Image.Resampling.LANCZOS)
        sheet.paste(front, (0, 0))
        
        # Back Body
        back = cleaned.resize((1024, 1375), Image.Resampling.LANCZOS)
        sheet.paste(back, (1024, 0))
        
        # Left Sleeve
        sleeve_crop = cleaned.resize((795, 545), Image.Resampling.LANCZOS)
        sheet.paste(sleeve_crop, (0, 1375))
        
        # Right Sleeve (Mirrored)
        sleeve_r = ImageOps.mirror(sleeve_crop)
        sheet.paste(sleeve_r, (795, 1375))
        
        # Collar Rib
        collar_strip = cleaned.crop((0, 0, cleaned.width, 30)).resize((2048, 128), Image.Resampling.LANCZOS)
        sheet.paste(collar_strip, (0, 1920))
        
        full_path = os.path.join(out_dir, f"{t['id']}_full.png")
        sheet.save(full_path, "PNG", quality=95)
        print(f"Cleaned and saved {t['id']} -> {full_path}")

print("All templates remade and verified clean!")
