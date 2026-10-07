import os
import shutil
import pandas as pd
from sklearn.model_selection import train_test_split

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
SOURCE_IMAGES = os.path.join(DATASET_DIR, "ISIC_2019_Training_Input")
LABELS_CSV = os.path.join(DATASET_DIR, "labels.csv")

# Class-specific folders for ImageDataGenerator flow_from_directory
PROCESSED_DATA_DIR = os.path.join(DATASET_DIR, "processed")
MELANOMA_DIR = os.path.join(PROCESSED_DATA_DIR, "melanoma")
BENIGN_DIR = os.path.join(PROCESSED_DATA_DIR, "benign")

def organize_dataset():
    print("Organizing dataset into Melanoma vs Benign folders...")
    
    if not os.path.exists(LABELS_CSV):
        print(f"ERROR: Labels CSV missing at {LABELS_CSV}")
        return

    # Create directories
    os.makedirs(MELANOMA_DIR, exist_ok=True)
    os.makedirs(BENIGN_DIR, exist_ok=True)

    df = pd.read_csv(LABELS_CSV)
    
    # ISIC 2019 columns: image,MEL,NV,BCC,AK,BKL,DF,VASC,SCC,UNK
    # MEL is the only malignant class we are focusing on for this binary task
    mel_df = df[df['MEL'] == 1.0]
    ben_df = df[df['MEL'] == 0.0]

    print(f"Total images: {len(df)}")
    print(f"Melanoma count: {len(mel_df)}")
    print(f"Benign/Other count: {len(ben_df)}")

    # Move files
    def move_files(subset_df, target_dir, label):
        count = 0
        total = len(subset_df)
        for _, row in subset_df.iterrows():
            img_name = row['image'] + ".jpg"
            src = os.path.join(SOURCE_IMAGES, img_name)
            dst = os.path.join(target_dir, img_name)
            
            if os.path.exists(src) and not os.path.exists(dst):
                shutil.copy2(src, dst)
                count += 1
                if count % 1000 == 0:
                    print(f"Copied {count}/{total} {label} images...")
        return count

    move_files(mel_df, MELANOMA_DIR, "Melanoma")
    move_files(ben_df, BENIGN_DIR, "Benign")

    print("\nDataset organization complete.")
    print(f"Path: {PROCESSED_DATA_DIR}")

if __name__ == "__main__":
    organize_dataset()
