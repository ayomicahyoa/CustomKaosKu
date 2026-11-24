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
uv_px = uvs * 2048

# Check Island 1 (Front)
# X in [30..1025]
# Let's inspect vertices with Y >= 1370
f_hem = (uv_px[:, 0] <= 1025) & (uv_px[:, 1] >= 1370) & (uv_px[:, 1] <= 1475)
print("Front hem vertices in [1370..1475]:", np.sum(f_hem))
print("  3D Pos Y range:", pos[f_hem, 1].min(), "..", pos[f_hem, 1].max())
print("  3D Pos Z range:", pos[f_hem, 2].min(), "..", pos[f_hem, 2].max())
print("  UV Y range:", uv_px[f_hem, 1].min(), "..", uv_px[f_hem, 1].max())

# And what about Island 2 (Left sleeve)?
# Let's inspect Left Sleeve UV range
ls_v = (uv_px[:, 0] <= 800) & (uv_px[:, 1] >= 1475)
print("\nLeft sleeve vertices (Y >= 1475, X <= 800):", np.sum(ls_v))
print("  UV Y min..max:", uv_px[ls_v, 1].min(), "..", uv_px[ls_v, 1].max())
print("  3D Pos Y range:", pos[ls_v, 1].min(), "..", pos[ls_v, 1].max())

