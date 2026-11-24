from PIL import Image
import numpy as np

outline = Image.open('public/mockups/jersey_clean_pattern_outline.png').convert('RGBA')
arr = np.array(outline)
alpha = arr[:, :, 3]

# Where are lines around Y=1400..1550?
for y in range(1450, 1500, 5):
    xs = np.where(alpha[y, :] > 50)[0]
    print(f"Y={y}: outline line X positions = {xs.tolist()[:10]} (total {len(xs)})")

