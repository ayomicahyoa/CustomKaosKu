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
pos_bv = bufferViews[pos_acc['bufferView']]
pos = np.frombuffer(bin_data, dtype=np.float32, count=pos_acc['count']*3, offset=pos_bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)).reshape(-1, 3)

uv_acc = accessors[p['attributes']['TEXCOORD_0']]
uv_bv = bufferViews[uv_acc['bufferView']]
uvs = np.frombuffer(bin_data, dtype=np.float32, count=uv_acc['count']*2, offset=uv_bv.get('byteOffset', 0) + uv_acc.get('byteOffset', 0)).reshape(-1, 2)

print(f"3D Pos X: [{pos[:,0].min():.3f} .. {pos[:,0].max():.3f}]")
print(f"3D Pos Y: [{pos[:,1].min():.3f} .. {pos[:,1].max():.3f}] (Vertical / height)")
print(f"3D Pos Z: [{pos[:,2].min():.3f} .. {pos[:,2].max():.3f}] (Front / back depth)")

# Bottom vertices of the jersey: lowest 5% of Y
min_y = pos[:, 1].min()
max_y = pos[:, 1].max()
bottom_mask = pos[:, 1] < (min_y + 0.05 * (max_y - min_y))

# Separate front bottom (Z > 0) and back bottom (Z < 0)
front_bottom = bottom_mask & (pos[:, 2] > 0)
back_bottom = bottom_mask & (pos[:, 2] < 0)

print(f"\nFront Bottom vertices count: {np.sum(front_bottom)}")
fb_uv_x = uvs[front_bottom, 0] * 2048
fb_uv_y = uvs[front_bottom, 1] * 2048
print(f"Front Bottom UV X range: [{fb_uv_x.min():.1f} .. {fb_uv_x.max():.1f}]")
print(f"Front Bottom UV Y range: [{fb_uv_y.min():.1f} .. {fb_uv_y.max():.1f}]")

print(f"\nBack Bottom vertices count: {np.sum(back_bottom)}")
bb_uv_x = uvs[back_bottom, 0] * 2048
bb_uv_y = uvs[back_bottom, 1] * 2048
print(f"Back Bottom UV X range: [{bb_uv_x.min():.1f} .. {bb_uv_x.max():.1f}]")
print(f"Back Bottom UV Y range: [{bb_uv_y.min():.1f} .. {bb_uv_y.max():.1f}]")
