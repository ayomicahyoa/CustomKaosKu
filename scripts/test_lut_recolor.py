import numpy as np
from PIL import Image
import time

# Create a 32x32x32 LUT (32,768 colors)
lut_size = 32
lut = np.zeros((lut_size, lut_size, lut_size, 3), dtype=np.uint8)

# Grid of RGB values (0..255)
r_grid, g_grid, b_grid = np.meshgrid(
    np.linspace(0, 255, lut_size),
    np.linspace(0, 255, lut_size),
    np.linspace(0, 255, lut_size),
    indexing='ij'
)
grid_pts = np.stack([r_grid, g_grid, b_grid], axis=-1).reshape(-1, 3) # (32768, 3)

orig_c = np.array([
    [240, 240, 240], # White
    [152, 32, 32],   # Red
    [184, 112, 112], # Accent
], dtype=np.float32)

new_c = np.array([
    [240, 240, 240], # White
    [20, 80, 240],   # Red -> Blue!
    [40, 180, 240],  # Accent -> Cyan!
], dtype=np.float32)

deltas = new_c - orig_c
sigma = 50.0

t0 = time.time()
# Compute shift for all 32,768 LUT entries
diffs = grid_pts[:, None, :] - orig_c[None, :, :]
dists_sq = np.sum(diffs**2, axis=2)
weights = np.exp(-dists_sq / (2 * (sigma**2)))
weights_norm = weights / (weights.sum(axis=1, keepdims=True) + 1e-6)
shifts = np.dot(weights_norm, deltas)
recolored_lut = np.clip(grid_pts + shifts, 0, 255).astype(np.uint8)
lut = recolored_lut.reshape(lut_size, lut_size, lut_size, 3)
t_lut = time.time() - t0
print(f"LUT computation took: {t_lut*1000:.2f} ms")

# Now apply LUT to an image (e.g. 1024x1024 or 2048x2048)
img = Image.open("public/cdr_previews_clean/Design 003.png").convert("RGB")
arr = np.array(img)
h, w, _ = arr.shape

t0 = time.time()
r_idx = arr[:, :, 0] >> 3 # divide by 8 to index 0..31
g_idx = arr[:, :, 1] >> 3
b_idx = arr[:, :, 2] >> 3
recolored_img_arr = lut[r_idx, g_idx, b_idx]
t_apply = time.time() - t0
print(f"LUT application to {w}x{h} ({w*h:,} pixels) took: {t_apply*1000:.2f} ms")

recolored_img = Image.fromarray(recolored_img_arr)
recolored_img.save("scripts/lut_recolor_003.png")
print("Saved scripts/lut_recolor_003.png successfully!")

