from PIL import Image
import numpy as np

def extract_dominant(img_path):
    img = Image.open(img_path).convert('RGB')
    small = img.resize((64, 64), Image.Resampling.BILINEAR)
    data = np.array(small)
    
    counts = {}
    for y in range(64):
        for x in range(64):
            r, g, b = data[y, x]
            # Quantize:
            qr = min(255, (int(r) >> 3) << 3)
            qg = min(255, (int(g) >> 3) << 3)
            qb = min(255, (int(b) >> 3) << 3)
            packed = (qr << 16) | (qg << 8) | qb
            counts[packed] = counts.get(packed, 0) + 1
            
    sorted_counts = sorted(counts.items(), key=lambda x: -x[1])
    
    selected = []
    total_count = 0
    min_dist = 36
    
    for packed, cnt in sorted_counts:
        if len(selected) >= 4:
            break
        r = (packed >> 16) & 255
        g = (packed >> 8) & 255
        b = packed & 255
        
        is_distinct = True
        for sr, sg, sb, scnt in selected:
            d = ((r - sr)**2 + (g - sg)**2 + (b - sb)**2)**0.5
            if d < min_dist:
                is_distinct = False
                break
        if is_distinct:
            selected.append((r, g, b, cnt))
            total_count += cnt
            
    print(f"\n{img_path} extracted palette:")
    for i, (r, g, b, cnt) in enumerate(selected):
        hex_c = f"#{r:02x}{g:02x}{b:02x}"
        pct = round(cnt * 100 / total_count, 1) if total_count else 0
        print(f"  Color {i+1}: {hex_c} RGB({r}, {g}, {b}) - {pct}%")

extract_dominant('public/mockups/templates/design-03_full.png')
extract_dominant('public/cdr_previews_clean/Design 003.png')
extract_dominant('public/cdr_previews_clean/Design 002.png')
extract_dominant('public/cdr_previews_clean/Design 001.png')

