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

pos_acc = accessors[p['attributes']['POSITION']]
pos = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc['count']*3, offset=bufferViews[pos_acc['bufferView']].get('byteOffset', 0) + pos_acc.get('byteOffset', 0)).reshape(-1, 3)

uv_acc = accessors[p['attributes']['TEXCOORD_0']]
uvs = np.frombuffer(bin_data, dtype=np.float32, count=uv_acc['count']*2, offset=bufferViews[uv_acc['bufferView']].get('byteOffset', 0) + uv_acc.get('byteOffset', 0)).reshape(-1, 2)

# Sleeves are typically at extreme X positions (|X| > 0.16) and upper Y (Y > 0.0)
left_sleeve_3d = (pos[:, 0] < -0.16) & (pos[:, 1] > -0.15)
right_sleeve_3d = (pos[:, 0] > 0.16) & (pos[:, 1] > -0.15)

print(f"Left sleeve 3D count: {np.sum(left_sleeve_3d)}")
ls_uv_x = uvs[left_sleeve_3d, 0] * 2048
ls_uv_y = uvs[left_sleeve_3d, 1] * 2048
print(f"Left sleeve UV X range: [{ls_uv_x.min():.1f} .. {ls_uv_x.max():.1f}]")
print(f"Left sleeve UV Y range: [{ls_uv_y.min():.1f} .. {ls_uv_y.max():.1f}]")

print(f"\nRight sleeve 3D count: {np.sum(right_sleeve_3d)}")
rs_uv_x = uvs[right_sleeve_3d, 0] * 2048
rs_uv_y = uvs[right_sleeve_3d, 1] * 2048
print(f"Right sleeve UV X range: [{rs_uv_x.min():.1f} .. {rs_uv_x.max():.1f}]")
print(f"Right sleeve UV Y range: [{rs_uv_y.min():.1f} .. {rs_uv_y.max():.1f}]")

# Collar vertices (near top Y > 0.23, center |X| < 0.1)
collar_3d = (pos[:, 1] > 0.22) & (np.abs(pos[:, 0]) < 0.12)
print(f"\nCollar 3D count: {np.sum(collar_3d)}")
col_uv_x = uvs[collar_3d, 0] * 2048
col_uv_y = uvs[collar_3d, 1] * 2048
print(f"Collar UV X range: [{col_uv_x.min():.1f} .. {col_uv_x.max():.1f}]")
print(f"Collar UV Y range: [{col_uv_y.min():.1f} .. {col_uv_y.max():.1f}]")

