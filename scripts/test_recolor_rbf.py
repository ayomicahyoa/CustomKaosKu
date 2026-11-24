import numpy as np
from PIL import Image

def test_recolor_rbf(img_path, orig_colors, new_colors, sigma=40.0):
    img = Image.open(img_path).convert("RGB")
    arr = np.array(img).astype(np.float32)
    h, w, _ = arr.shape
    pts = arr.reshape(-1, 3) # (N, 3)
    
    C_orig = np.array(orig_colors, dtype=np.float32) # (K, 3)
    C_new = np.array(new_colors, dtype=np.float32)   # (K, 3)
    deltas = C_new - C_orig                          # (K, 3)
    
    # Distance from each pixel to each original center: (N, K)
    # ||P - C||^2
    diffs = pts[:, None, :] - C_orig[None, :, :]
    dists_sq = np.sum(diffs**2, axis=2)
    
    # Gaussian weights
    weights = np.exp(-dists_sq / (2 * (sigma**2))) # (N, K)
    weight_sum = weights.sum(axis=1, keepdims=True) + 1e-6
    weights_norm = weights / weight_sum
    
    # Blend factor based on how close pixel is to ANY palette color
    # If a pixel is far from all palette colors, it retains original color
    # min_dist = np.sqrt(dists_sq.min(axis=1, keepdims=True))
    # confidence = np.exp(-min_dist / (2 * sigma))
    
    shift = np.dot(weights_norm, deltas)
    new_pts = np.clip(pts + shift, 0, 255).astype(np.uint8)
    return Image.fromarray(new_pts.reshape(h, w, 3))

# Test on Design 003.png (red + white + crimson)
# Orig colors:
# Color 1: #f0f0f0 (white) [240, 240, 240]
# Color 2: #982020 (crimson red) [152, 32, 32]
# Color 3: #b87070 (salmon/accent) [184, 112, 112]
orig_c = [
    [240, 240, 240], # White
    [152, 32, 32],   # Red
    [184, 112, 112], # Accent
]

# We want to change Red -> Electric Blue [20, 80, 240]
# Accent -> Cyan [40, 180, 240]
# Keep White as White [240, 240, 240] (or tint to black)
new_c = [
    [240, 240, 240], # White unchanged
    [20, 80, 240],   # Red -> Blue!
    [40, 180, 240],  # Accent -> Cyan!
]

res = test_recolor_rbf("public/cdr_previews_clean/Design 003.png", orig_c, new_c, sigma=50.0)
res.save("scripts/recolor_003_blue.png")
print("Saved scripts/recolor_003_blue.png successfully!")

