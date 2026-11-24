import struct
import json
import numpy as np
from PIL import Image, ImageDraw

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

idx_acc = accessors[p['indices']]
indices = np.frombuffer(bin_data, dtype=np.uint16 if idx_acc['componentType'] == 5123 else np.uint32, count=idx_acc['count'], offset=bufferViews[idx_acc['bufferView']]['byteOffset'] + idx_acc.get('byteOffset', 0))
triangles = indices.reshape(-1, 3)

tri_pos = pos[triangles].mean(axis=1)

tri_is_left_sleeve = (tri_pos[:, 0] < -0.16) & (tri_pos[:, 1] > -0.15)
tri_is_right_sleeve = (tri_pos[:, 0] > 0.16) & (tri_pos[:, 1] > -0.15)
tri_is_collar = (tri_pos[:, 1] > 0.22) & (np.abs(tri_pos[:, 0]) < 0.12)
tri_is_front = (tri_pos[:, 2] > 0.01) & ~tri_is_left_sleeve & ~tri_is_right_sleeve & ~tri_is_collar
tri_is_back = (tri_pos[:, 2] < -0.01) & ~tri_is_left_sleeve & ~tri_is_right_sleeve & ~tri_is_collar

img = Image.new('RGBA', (2048, 2048), (0, 0, 0, 255))
draw = ImageDraw.Draw(img)

def draw_triangles(mask, fill_color):
    for tri in triangles[mask]:
        pts = [(uv_px[i, 0], uv_px[i, 1]) for i in tri]
        draw.polygon(pts, fill=fill_color, outline=fill_color)

print("Rasterizing parts...")
draw_triangles(tri_is_front, (255, 0, 0, 255))        # Red
draw_triangles(tri_is_back, (0, 0, 255, 255))         # Blue
draw_triangles(tri_is_left_sleeve, (0, 255, 0, 255))  # Green
draw_triangles(tri_is_right_sleeve, (255, 165, 0, 255))# Orange
draw_triangles(tri_is_collar, (255, 255, 0, 255))     # Yellow

img.save('scripts/true_uv_parts_2048.png')
crop = img.crop((0, 1300, 2048, 1550))
crop.save('scripts/true_uv_hem_crop.png')
print("Saved scripts/true_uv_parts_2048.png and scripts/true_uv_hem_crop.png")

