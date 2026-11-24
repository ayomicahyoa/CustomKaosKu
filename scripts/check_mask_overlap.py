from PIL import Image
import numpy as np

mf = np.array(Image.open('public/mockups/mask_front.png').convert('RGBA'))[:, :, 3] > 10
mls = np.array(Image.open('public/mockups/mask_left_sleeve.png').convert('RGBA'))[:, :, 3] > 10
mrs = np.array(Image.open('public/mockups/mask_right_sleeve.png').convert('RGBA'))[:, :, 3] > 10
mb = np.array(Image.open('public/mockups/mask_back.png').convert('RGBA'))[:, :, 3] > 10

ov_f_ls = mf & mls
ov_f_rs = mf & mrs
ov_b_rs = mb & mrs
ov_b_ls = mb & mls

print("ov_f_ls:", np.sum(ov_f_ls), "at Y:", np.where(ov_f_ls)[0].min() if np.sum(ov_f_ls) else None, "..", np.where(ov_f_ls)[0].max() if np.sum(ov_f_ls) else None)
print("ov_f_rs:", np.sum(ov_f_rs), "at Y:", np.where(ov_f_rs)[0].min() if np.sum(ov_f_rs) else None, "..", np.where(ov_f_rs)[0].max() if np.sum(ov_f_rs) else None)
print("ov_b_rs:", np.sum(ov_b_rs), "at Y:", np.where(ov_b_rs)[0].min() if np.sum(ov_b_rs) else None, "..", np.where(ov_b_rs)[0].max() if np.sum(ov_b_rs) else None)
print("ov_b_ls:", np.sum(ov_b_ls), "at Y:", np.where(ov_b_ls)[0].min() if np.sum(ov_b_ls) else None, "..", np.where(ov_b_ls)[0].max() if np.sum(ov_b_ls) else None)

