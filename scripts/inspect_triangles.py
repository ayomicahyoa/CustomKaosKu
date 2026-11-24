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

# Indices / triangles
idx_acc = accessors[p['indices']]
indices = np.frombuffer(bin_data, dtype=np.uint16 if idx_acc['componentType'] == 5123 else np.uint32, count=idx_acc['count'], offset=bufferViews[idx_acc['bufferView']]['byteOffset'] + idx_acc.get('byteOffset', 0))
triangles = indices.reshape(-1, 3)

# Find connected components or separate parts by 3D position
# Shirt has:
# 1. Front Body: Z > 0, |X| < 0.16 (or roughly center)
# 2. Back Body: Z < 0, |X| < 0.16
# 3. Left Sleeve: X < -0.16
# 4. Right Sleeve: X > 0.16
# 5. Collar: Y > 0.22, |X| < 0.12

# Let's check each triangle's centroid in 3D:
tri_pos = pos[triangles].mean(axis=1) # (N_tri, 3)
tri_uv = uv_px[triangles] # (N_tri, 3, 2)

tri_is_left_sleeve = (tri_pos[:, 0] < -0.16) & (tri_pos[:, 1] > -0.15)
tri_is_right_sleeve = (tri_pos[:, 0] > 0.16) & (tri_pos[:, 1] > -0.15)
tri_is_collar = (tri_pos[:, 1] > 0.22) & (np.abs(tri_pos[:, 0]) < 0.12)
tri_is_front = (tri_pos[:, 2] > 0.01) & ~tri_is_left_sleeve & ~tri_is_right_sleeve & ~tri_is_collar
tri_is_back = (tri_pos[:, 2] < -0.01) & ~tri_is_left_sleeve & ~tri_is_right_sleeve & ~tri_is_collar

print("Triangle counts:")
print(f"Front: {np.sum(tri_is_front)}")
print(f"Back: {np.sum(tri_is_back)}")
print(f"Left Sleeve: {np.sum(tri_is_left_sleeve)}")
print(f"Right Sleeve: {np.sum(tri_is_right_sleeve)}")
print(f"Collar: {np.sum(tri_is_collar)}")

def get_uv_bounds(mask, name):
    tris = tri_uv[mask].reshape(-1, 2)
    print(f"\n{name} UV Bounds:")
    print(f"  X: [{tris[:, 0].min():.1f} .. {tris[:, 0].max():.1f}]")
    print(f"  Y: [{tris[:, 1].min():.1f} .. {tris[:, 1].max():.1f}]")

get_uv_bounds(tri_is_front, "FRONT BODY")
get_uv_bounds(tri_is_back, "BACK BODY")
get_uv_bounds(tri_is_left_sleeve, "LEFT SLEEVE")
get_uv_bounds(tri_is_right_sleeve, "RIGHT SLEEVE")
get_uv_bounds(tri_is_collar, "COLLAR")

