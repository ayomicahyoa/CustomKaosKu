import struct
import json
import numpy as np
from collections import defaultdict
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

# Build edge graph in vertex index space:
# If two triangles share an edge (v1, v2), they are adjacent.
# But wait: if UV is discontinuous at seam, Blender splits vertices so v1 != v2 in index space.
# Therefore, two triangles sharing an index in triangles share UV coordinates automatically!
adj = defaultdict(set)
for t_idx, (v0, v1, v2) in enumerate(triangles):
    adj[v0].add(t_idx)
    adj[v1].add(t_idx)
    adj[v2].add(t_idx)

# Find connected triangle islands:
visited = set()
islands = []
for t_idx in range(len(triangles)):
    if t_idx in visited:
        continue
    island = []
    q = [t_idx]
    visited.add(t_idx)
    while q:
        curr = q.pop()
        island.append(curr)
        for v in triangles[curr]:
            for neighbor in adj[v]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    q.append(neighbor)
    islands.append(island)

print(f"Total UV islands: {len(islands)}")
islands.sort(key=lambda isl: len(isl), reverse=True)

colors = [
    (255, 0, 0, 255),    # Red
    (0, 0, 255, 255),    # Blue
    (0, 255, 0, 255),    # Green
    (255, 165, 0, 255),  # Orange
    (255, 255, 0, 255),  # Yellow
    (255, 0, 255, 255),  # Magenta
    (0, 255, 255, 255),  # Cyan
]

img = Image.new('RGBA', (2048, 2048), (0, 0, 0, 255))
draw = ImageDraw.Draw(img)

for i, island in enumerate(islands):
    isl_tris = triangles[island]
    isl_uvs = uv_px[isl_tris].reshape(-1, 2)
    isl_pos = pos[isl_tris].reshape(-1, 3)
    c = colors[i % len(colors)]
    
    for tri in isl_tris:
        pts = [(uv_px[j, 0], uv_px[j, 1]) for j in tri]
        draw.polygon(pts, fill=c, outline=c)
        
    print(f"\nIsland {i} (Triangles: {len(island)}):")
    print(f"  UV X: [{isl_uvs[:, 0].min():.1f} .. {isl_uvs[:, 0].max():.1f}] (center {isl_uvs[:, 0].mean():.1f})")
    print(f"  UV Y: [{isl_uvs[:, 1].min():.1f} .. {isl_uvs[:, 1].max():.1f}] (center {isl_uvs[:, 1].mean():.1f})")
    print(f"  3D Pos X: [{isl_pos[:, 0].min():.2f} .. {isl_pos[:, 0].max():.2f}]")
    print(f"  3D Pos Y: [{isl_pos[:, 1].min():.2f} .. {isl_pos[:, 1].max():.2f}]")
    print(f"  3D Pos Z: [{isl_pos[:, 2].min():.2f} .. {isl_pos[:, 2].max():.2f}]")

img.save('scripts/uv_islands_visual.png')
print("\nSaved scripts/uv_islands_visual.png")

