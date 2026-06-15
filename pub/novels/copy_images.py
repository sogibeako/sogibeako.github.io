import os, shutil, glob

artifact_dir = r"C:\Users\ks_ar\.gemini\antigravity\brain\21054766-eeaa-4cb5-a12e-02156bfa5165"
target_dir = r"c:\Users\ks_ar\OneDrive\デスクトップ\project\mizuhara_hp\novels\image"

if not os.path.exists(target_dir):
    os.makedirs(target_dir)

for i in range(1, 11):
    prefix = f"nagasakiya_{i:02d}_"
    files = glob.glob(os.path.join(artifact_dir, prefix + "*.png"))
    if files:
        src = files[0]
        dst = os.path.join(target_dir, f"naga_{i:02d}.png")
        shutil.copy2(src, dst)
        print(f"Copied {os.path.basename(src)} to {os.path.basename(dst)}")
