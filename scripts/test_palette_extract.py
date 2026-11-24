import numpy as np
from PIL import Image

def rgb_to_hex(rgb):
    return f"#{int(rgb[0]):02x}{int(rgb[1]):02x}{int(rgb[2]):02x}"

def hex_to_rgb(hex_str):
    h = hex_str.lstrip('#')
    return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], dtype=np.float32)

def extract_distinct_palette(img, max_colors=4, min_dist=35.0):
    # Resize image to 64x64 for lightning-fast analysis (<5ms in browser!)
    small = img.resize((64, 64), Image.Resampling.BOX)
    arr = np.array(small)[:, :, :3].reshape(-1, 3).astype(np.float32)
    
    # 1. Quantize to 32 levels per channel (reduce noise)
    quantized = np.round(arr / 8.0) * 8.0
    
    # 2. Count frequencies of unique quantized colors
    colors, counts = np.unique(quantized, axis=0, return_counts=True)
    sort_idx = np.argsort(-counts)
    colors = colors[sort_idx]
    counts = counts[sort_idx]
    
    # 3. Greedy selection of dominant colors with minimum distance threshold
    selected_colors = []
    selected_counts = []
    
    for c, cnt in zip(colors, counts):
        if len(selected_colors) >= max_colors:
            break
        # Check distance to already selected colors
        if len(selected_colors) == 0:
            selected_colors.append(c)
            selected_counts.append(cnt)
        else:
            dists = [np.linalg.norm(c - sc) for sc in selected_colors]
            if min(dists) >= min_dist:
                selected_colors.append(c)
                selected_counts.append(cnt)
                
    total_samples = len(arr)
    results = []
    for c, cnt in zip(selected_colors, selected_counts):
        pct = (cnt / total_samples) * 100
        results.append({
            'hex': rgb_to_hex(c),
            'rgb': [int(c[0]), int(c[1]), int(c[2])],
            'pct': round(pct, 1)
        })
    return results

for name in ['Design 001.png', 'Design 002.png', 'Design 003.png', 'Design 004.png', 'Design 005.png']:
    img = Image.open('public/cdr_previews_clean/' + name).convert('RGB')
    palette = extract_distinct_palette(img, max_colors=4, min_dist=45.0)
    print(f"\n{name}:")
    for i, p in enumerate(palette):
        print(f"  Color {i+1}: {p['hex']} ({p['pct']}%)")

