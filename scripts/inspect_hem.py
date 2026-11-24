import struct
import json
import numpy as np

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

# UV in pixels (2048 x 2048)
uv_px = uvs * 2048

# Vertices with UV Y between 1350 and 1500
sel = (uv_px[:, 1] >= 1350) & (uv_px[:, 1] <= 1500)
print(f"Total vertices with UV Y in [1350, 1500]: {np.sum(sel)}")

# Look at 3D positions of these vertices:
print(f"3D Pos Y min..max: {pos[sel, 1].min():.3f} .. {pos[sel, 1].max():.3f}")
# Are they near the bottom of shirt (Y < -0.3)? Or are they sleeve?
is_hem = pos[sel, 1] < -0.25
is_sleeve = pos[sel, 1] >= -0.25
print(f"  Count at bottom hem (Y < -0.25): {np.sum(is_hem)}")
print(f"    UV X range of hem: [{uv_px[sel][is_hem, 0].min():.1f} .. {uv_px[sel][is_hem, 0].max():.1f}]")
print(f"    UV Y range of hem: [{uv_px[sel][is_hem, 1].min():.1f} .. {uv_px[sel][is_hem, 1].max():.1f}]")
print(f"  Count at sleeve/other (Y >= -0.25): {np.sum(is_sleeve)}")
print(f"    UV X range of sleeve: [{uv_px[sel][is_sleeve, 0].min():.1f} .. {uv_px[sel][is_sleeve, 0].max():.1f}]")
print(f"    UV Y range of sleeve: [{uv_px[sel][is_sleeve, 1].min():.1f} .. {uv_px[sel][is_sleeve, 1].max():.1f}]")

