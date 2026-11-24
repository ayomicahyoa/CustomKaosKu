import os
import zipfile
import io
from PIL import Image, ImageOps

source_dir = r"C:\Users\Pongo\Documents\Projects\Business\CustomKaosWeb\src\Design Jersey templates\Texture Pattern\TextureOnly"
out_dir = r"C:\Users\Pongo\Documents\Projects\Business\CustomKaosWeb\public\mockups\templates"
os.makedirs(out_dir, exist_ok=True)

design_files = [
    ("design-01", "Design 001.cdr"),
    ("design-02", "Design 002.cdr"),
    ("design-03", "Design 003.cdr"),
    ("design-04", "Design 004.cdr"),
    ("design-05", "Design 005.cdr"),
]

for d_id, cdr_filename in design_files:
    cdr_path = os.path.join(source_dir, cdr_filename)
    with zipfile.ZipFile(cdr_path, "r") as z:
        raw_img = Image.open(io.BytesIO(z.read("previews/thumbnail.png"))).convert("RGB")
        w, h = raw_img.size
        
        # Detect content bbox
        bbox = []
        for y in range(h):
            for x in range(w):
                r, g, b = raw_img.getpixel((x, y))
                if r < 248 or g < 248 or b < 248:
                    bbox.append((x, y))
        
        if bbox:
            min_x = min(pt[0] for pt in bbox)
            max_x = max(pt[0] for pt in bbox)
            min_y = min(pt[1] for pt in bbox)
            max_y = max(pt[1] for pt in bbox)
            clean_texture = raw_img.crop((min_x, min_y, max_x + 1, max_y + 1))
        else:
            clean_texture = raw_img

        # 1. UI Thumbnail
        thumb_path = os.path.join(out_dir, f"{d_id}_thumb.png")
        thumb = clean_texture.copy()
        thumb.thumbnail((400, 500), Image.Resampling.LANCZOS)
        thumb.save(thumb_path, "PNG")

        # 2. Build 2048x2048 Full Sublimation Sheet
        sheet = Image.new("RGB", (2048, 2048), (255, 255, 255))
        
        # Scale texture to body dimensions (1024 x 1475)
        body = clean_texture.resize((1024, 1475), Image.Resampling.LANCZOS)
        
        # Front Body: (0, 0, 1024, 1475)
        sheet.paste(body, (0, 0))
        
        # Back Body: (1024, 0, 1024, 1475) - HORIZONTALLY MIRRORED
        sheet.paste(ImageOps.mirror(body), (1024, 0))
        
        # Sleeves: PURE CROP 1:1 SCALE (NO STRETCHING, NO SQUASHING)
        # We crop a 790 x 445 window directly at identical scale so patterns match the body perfectly!
        crop_x = (1024 - 790) // 2
        crop_y = 150
        sleeve_crop = body.crop((crop_x, crop_y, crop_x + 790, crop_y + 445))
        
        # Left Sleeve: (0, 1475, 790, 445)
        sheet.paste(sleeve_crop, (0, 1475))
        
        # Right Sleeve: (790, 1475, 790, 445)
        sleeve_r = ImageOps.mirror(sleeve_crop)
        sheet.paste(sleeve_r, (790, 1475))
        
        # Collar Rib: (0, 1920, 2048, 128)
        collar_strip = body.crop((0, 0, 1024, 64)).resize((2048, 128), Image.Resampling.LANCZOS)
        sheet.paste(collar_strip, (0, 1920))
        
        full_path = os.path.join(out_dir, f"{d_id}_full.png")
        sheet.save(full_path, "PNG", quality=95)
        print(f"Applied 1:1 proportional crop for {d_id} -> {full_path}")

print("All 5 templates remade with natural 1:1 proportional crop (no stretching)!")
