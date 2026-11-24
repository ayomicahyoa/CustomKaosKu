from PIL import Image, ImageDraw
import numpy as np

outline = Image.open('public/mockups/jersey_clean_pattern_outline.png').convert('RGBA')

# Crop Y=1300..1500, full width 2048
crop = outline.crop((0, 1300, 2048, 1500))
crop.save('public/mockups/pattern_crop_1300_1500.png')

# Also check mask_front vs mask_left_sleeve in this area:
mf = Image.open('public/mockups/mask_front.png').convert('RGBA')
mls = Image.open('public/mockups/mask_left_sleeve.png').convert('RGBA')
mrs = Image.open('public/mockups/mask_right_sleeve.png').convert('RGBA')
mb = Image.open('public/mockups/mask_back.png').convert('RGBA')

composite = Image.new('RGBA', (2048, 2048), (255, 255, 255, 255))
# Front = Red
f_arr = np.array(mf)[:, :, 3] > 10
# Back = Blue
b_arr = np.array(mb)[:, :, 3] > 10
# LS = Green
ls_arr = np.array(mls)[:, :, 3] > 10
# RS = Yellow
rs_arr = np.array(mrs)[:, :, 3] > 10

comp_arr = np.zeros((2048, 2048, 4), dtype=np.uint8)
comp_arr[:, :] = [255, 255, 255, 255]
comp_arr[f_arr] = [255, 100, 100, 255]
comp_arr[b_arr] = [100, 100, 255, 255]
comp_arr[ls_arr] = [100, 255, 100, 255]
comp_arr[rs_arr] = [255, 255, 100, 255]

# Where they overlap:
overlap_f_ls = f_arr & ls_arr
comp_arr[overlap_f_ls] = [0, 0, 0, 255]

overlap_img = Image.fromarray(comp_arr)
overlap_crop = overlap_img.crop((0, 1300, 2048, 1500))
overlap_crop.save('public/mockups/mask_overlap_crop.png')
print("Saved pattern_crop_1300_1500.png and mask_overlap_crop.png")
print("overlap_f_ls pixel count:", np.sum(overlap_f_ls))

