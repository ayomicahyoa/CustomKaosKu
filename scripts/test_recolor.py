import numpy as np
from PIL import Image

# Test on a real template, e.g. Design 002.png or 001.png or 003.png
img_path = "public/cdr_previews_clean/Design 003.png"
orig_img = Image.open(img_path).convert("RGB")

# Downsample for fast clustering
small = orig_img.resize((100, 100), Image.Resampling.BOX)
pixels = np.array(small).reshape(-1, 3).astype(np.float32)

# Simple K-Means to extract top K dominant colors (e.g. K=4)
def extract_palette(pixels, k=4, max_iter=15):
    # Filter out near white or near transparent if background
    # But jersey can have white/black
    np.random.seed(42)
    # K-means++ initialization or uniform
    centers = pixels[np.random.choice(len(pixels), k, replace=False)]
    
    for _ in range(max_iter):
        # Distances: (N, K)
        dists = np.linalg.norm(pixels[:, None, :] - centers[None, :, :], axis=2)
        labels = np.argmin(dists, axis=1)
        new_centers = np.zeros_like(centers)
        for i in range(k):
            cluster_pts = pixels[labels == i]
            if len(cluster_pts) > 0:
                new_centers[i] = cluster_pts.mean(axis=0)
            else:
                new_centers[i] = centers[i]
        if np.allclose(centers, new_centers, atol=1.0):
            break
        centers = new_centers
        
    # Count cluster sizes & sort by abundance
    dists = np.linalg.norm(pixels[:, None, :] - centers[None, :, :], axis=2)
    labels = np.argmin(dists, axis=1)
    counts = np.bincount(labels, minlength=k)
    order = np.argsort(-counts)
    
    sorted_centers = centers[order].astype(np.uint8)
    sorted_pcts = (counts[order] / len(pixels)) * 100
    return sorted_centers, sorted_pcts

palette, pcts = extract_palette(pixels, k=4)
print("Extracted 4 dominant colors:")
for i, (c, pct) in enumerate(zip(palette, pcts)):
    hex_c = f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}"
    print(f"  Color {i+1}: {hex_c} RGB({c[0]}, {c[1]}, {c[2]}) - {pct:.1f}%")

# Now let's test recoloring:
# Suppose user changes Color 1 (e.g. red) to electric blue (#0066ff)
# Let's test a delta / soft cluster recoloring algorithm
target_palette = palette.copy()
# Change the primary dominant color to bright blue [0, 102, 255]
target_palette[0] = [0, 102, 255]
# Change second color to bright cyan [0, 230, 255]
if len(target_palette) > 1:
    target_palette[1] = [0, 230, 255]

def recolor_image(img, orig_palette, new_palette):
    arr = np.array(img).astype(np.float32)
    h, w, _ = arr.shape
    pts = arr.reshape(-1, 3)
    
    # Distance to each original palette color (N, K)
    dists = np.linalg.norm(pts[:, None, :] - orig_palette[None, :, :].astype(np.float32), axis=2)
    
    # Inverse distance weighting with soft power (e.g. power=3 or softmax)
    # To avoid divide by zero:
    eps = 1.0
    weights = 1.0 / (dists**2.5 + eps)
    weights /= weights.sum(axis=1, keepdims=True) # (N, K)
    
    # Delta vector for each palette color: (K, 3)
    deltas = new_palette.astype(np.float32) - orig_palette.astype(np.float32)
    
    # Weighted shift
    shift = np.dot(weights, deltas)
    new_pts = pts + shift
    new_pts = np.clip(new_pts, 0, 255).astype(np.uint8)
    
    return Image.fromarray(new_pts.reshape(h, w, 3))

recolored = recolor_image(orig_img, palette, target_palette)
recolored.save("scripts/recolor_test_result.png")
print("Recoloring test saved to scripts/recolor_test_result.png!")

