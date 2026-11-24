from PIL import Image
import numpy as np

mf = np.array(Image.open('public/mockups/mask_front.png').convert('RGBA'))[:, :, 3] > 10
mls = np.array(Image.open('public/mockups/mask_left_sleeve.png').convert('RGBA'))[:, :, 3] > 10
mrs = np.array(Image.open('public/mockups/mask_right_sleeve.png').convert('RGBA'))[:, :, 3] > 10
mb = np.array(Image.open('public/mockups/mask_back.png').convert('RGBA'))[:, :, 3] > 10

for y in range(1370, 1406, 2):
    f_cols = np.where(mf[y, :])[0]
    b_cols = np.where(mb[y, :])[0]
    ls_cols = np.where(mls[y, :])[0]
    rs_cols = np.where(mrs[y, :])[0]
    
    f_str = f"[{f_cols.min()}..{f_cols.max()}]" if len(f_cols) else "None"
    b_str = f"[{b_cols.min()}..{b_cols.max()}]" if len(b_cols) else "None"
    ls_str = f"[{ls_cols.min()}..{ls_cols.max()}]" if len(ls_cols) else "None"
    rs_str = f"[{rs_cols.min()}..{rs_cols.max()}]" if len(rs_cols) else "None"
    
    print(f"Y={y} | Front: {f_str} | Back: {b_str} | LS: {ls_str} | RS: {rs_str}")

