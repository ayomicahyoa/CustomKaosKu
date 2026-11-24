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

# Check vertices with UV Y between 1400 and 1472
mask_high_y = (uv_px[:, 1] >= 1400) & (uv_px[:, 1] <= 1472)
print("Count of vertices with UV Y in [1400, 1472]:", np.sum(mask_high_y))
high_pos = pos[mask_high_y]
high_uv = uv_px[mask_high_y]

print(f"3D Pos X: [{high_pos[:, 0].min():.3f} .. {high_pos[:, 0].max():.3f}]")
print(f"3D Pos Y: [{high_pos[:, 1].min():.3f} .. {high_pos[:, 1].max():.3f}]")
print(f"3D Pos Z: [{high_pos[:, 2].min():.3f} .. {high_pos[:, 2].max():.3f}]")
print(f"UV X: [{high_uv[:, 0].min():.1f} .. {high_uv[:, 0].max():.1f}]")
print(f"UV Y: [{high_uv[:, 1].min():.1f} .. {high_uv[:, 1].max():.1f}]")

# Let's check an original texture of shirt_baked.glb if it had any embedded textures!
images = gltf.get('images', [])
print("\nEmbedded images in GLB:", len(images))
for i, img_info in enumerate(images):
    print(f"Image {i}:", img_info.get('name'), img_info.get('mimeType'))
    bv = bufferViews[img_info['bufferView']]
    offset = bv.get('byteOffset', 0)
    length = bv.get('byteLength', 0)
    data = bin_data[offset:offset+length]
    with open(f'scripts/glb_texture_{i}.png', 'wb') as img_out:
        img_out.write(data)
    print(f"Saved scripts/glb_texture_{i}.png ({len(data)} bytes)")

