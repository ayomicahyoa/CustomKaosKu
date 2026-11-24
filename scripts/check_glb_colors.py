from PIL import Image
import numpy as np

img = Image.open('scripts/glb_texture_0.png').resize((2048, 2048))
img.save('scripts/glb_texture_0_2048.png')

# Let's inspect what colors/patterns are at Y=1350..1480
arr = np.array(img)
print("RGB sample at Y=1350, X=500:", arr[1350, 500])
print("RGB sample at Y=1400, X=500:", arr[1400, 500])
print("RGB sample at Y=1450, X=500:", arr[1450, 500])
print("RGB sample at Y=1500, X=500 (Left sleeve area):", arr[1500, 500])

