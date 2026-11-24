from PIL import Image
import numpy as np

img = Image.open('scripts/true_uv_parts_2048.png')
arr = np.array(img)

# Colors:
# Red: Front (255, 0, 0)
# Blue: Back (0, 0, 255)
# Green: Left Sleeve (0, 255, 0)
# Orange: Right Sleeve (255, 165, 0)

is_front = (arr[:, :, 0] > 200) & (arr[:, :, 1] < 50) & (arr[:, :, 2] < 50)
is_back = (arr[:, :, 0] < 50) & (arr[:, :, 1] < 50) & (arr[:, :, 2] > 200)
is_ls = (arr[:, :, 0] < 50) & (arr[:, :, 1] > 200) & (arr[:, :, 2] < 50)
is_rs = (arr[:, :, 0] > 200) & (arr[:, :, 1] > 100) & (arr[:, :, 2] < 50)

print("FRONT UV bounds:")
ys, xs = np.where(is_front)
print(f"  X: [{xs.min()} .. {xs.max()}], Y: [{ys.min()} .. {ys.max()}]")

print("BACK UV bounds:")
ys, xs = np.where(is_back)
print(f"  X: [{xs.min()} .. {xs.max()}], Y: [{ys.min()} .. {ys.max()}]")

print("LEFT SLEEVE UV bounds:")
ys, xs = np.where(is_ls)
print(f"  X: [{xs.min()} .. {xs.max()}], Y: [{ys.min()} .. {ys.max()}]")

print("RIGHT SLEEVE UV bounds:")
ys, xs = np.where(is_rs)
print(f"  X: [{xs.min()} .. {xs.max()}], Y: [{ys.min()} .. {ys.max()}]")

