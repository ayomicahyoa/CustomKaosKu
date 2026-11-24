import struct
import json
import numpy as np
from PIL import Image

# 1. Load a test template texture (e.g. Design 002.png or 001.png)
tex_path = "public/cdr_previews_clean/Design 002.png"
tmpl = Image.open(tex_path).convert("RGB")
tw, th = tmpl.size

# 2. Build 2048x2048 canvas matching Jersey3DViewer.tsx new logic
canvas = Image.new("RGB", (2048, 2048), (255, 255, 255))

# Badan Depan: (0, 0, 1024, 1475)
front = tmpl.resize((1024, 1475), Image.Resampling.LANCZOS)
canvas.paste(front, (0, 0))

# Badan Belakang: (1024, 0, 1024, 1475) - Mirrored
from PIL import ImageOps
back = ImageOps.mirror(front)
canvas.paste(back, (1024, 0))

# Sleeves: (0, 1475, 790, 445) and (790, 1475, 790, 445)
scale_x = tw / 1024
scale_y = th / 1475
crop_w = int(790 * scale_x)
crop_h = int(445 * scale_y)
crop_x = max(0, int(((1024 - 790) / 2) * scale_x))
crop_y = max(0, int(150 * scale_y))

sleeve_crop = tmpl.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h)).resize((790, 445), Image.Resampling.LANCZOS)
canvas.paste(sleeve_crop, (0, 1475))
canvas.paste(ImageOps.mirror(sleeve_crop), (790, 1475))

canvas.save("scripts/test_canvas_v8.png")

# 3. Check 3D mesh bottom hem vertices
with open('public/mockups/shirt_baked.glb', 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    json_bytes = f.read(chunk_len)
    gltf = json.loads(json_bytes.decode('utf-8'))
    bin_len, bin_type = struct.unpack('<II', f.read(8))
    bin_data = f.read(bin_len)

bufferViews = gltf['bufferViews']
accessors = gltf['accessors']
p = gltf['meshes'][0]['primitives'][0]

pos = np.frombuffer(bin_data, dtype=np.float32, count=accessors[p['attributes']['POSITION']]['count']*3, offset=bufferViews[accessors[p['attributes']['POSITION']]['bufferView']]['byteOffset'] + accessors[p['attributes']['POSITION']].get('byteOffset', 0)).reshape(-1, 3)
uvs = np.frombuffer(bin_data, dtype=np.float32, count=accessors[p['attributes']['TEXCOORD_0']]['count']*2, offset=bufferViews[accessors[p['attributes']['TEXCOORD_0']]['bufferView']]['byteOffset'] + accessors[p['attributes']['TEXCOORD_0']].get('byteOffset', 0)).reshape(-1, 2)
uv_px = uvs * 2048

# Front bottom hem (Y_3d < -0.32 and Z > 0.05)
front_hem = (pos[:, 1] < -0.32) & (pos[:, 2] > 0.05)
hem_uvs = uv_px[front_hem]
print("Front hem vertices count:", np.sum(front_hem))
print(f"Front hem UV Y range: [{hem_uvs[:, 1].min():.1f} .. {hem_uvs[:, 1].max():.1f}]")
print(f"Front hem UV X range: [{hem_uvs[:, 0].min():.1f} .. {hem_uvs[:, 0].max():.1f}]")

# Are ANY front hem UVs sampling >= 1475 (the sleeve area)?
leaking_into_sleeve = hem_uvs[:, 1] >= 1475
print("Number of front hem vertices leaking into sleeve (UV Y >= 1475):", np.sum(leaking_into_sleeve))

# Back bottom hem (Y_3d < -0.32 and Z < -0.05)
back_hem = (pos[:, 1] < -0.32) & (pos[:, 2] < -0.05)
b_hem_uvs = uv_px[back_hem]
print("Back hem vertices count:", np.sum(back_hem))
print(f"Back hem UV Y range: [{b_hem_uvs[:, 1].min():.1f} .. {b_hem_uvs[:, 1].max():.1f}]")
print(f"Back hem UV X range: [{b_hem_uvs[:, 0].min():.1f} .. {b_hem_uvs[:, 0].max():.1f}]")
b_leaking = b_hem_uvs[:, 1] >= 1475
print("Number of back hem vertices leaking into sleeve (UV Y >= 1475):", np.sum(b_leaking))

