import os
import shutil
import pandas as pd

SOURCE_IMAGES = r"C:\Users\vijay kumar.m\OneDrive\Desktop\Final Yeatr Project 2027\archive\ISIC_2019_Training_Input\ISIC_2019_Training_Input"
SOURCE_LABELS = r"C:\Users\vijay kumar.m\OneDrive\Desktop\Final Yeatr Project 2027\archive\ISIC_2019_Training_GroundTruth.csv"

DEST_DATASET = r"C:\Users\vijay kumar.m\OneDrive\Desktop\Final Yeatr Project 2027\skin-ai-insights-main\backend\dataset"
DEST_IMAGES = os.path.join(DEST_DATASET, "ISIC_2019_Training_Input")
DEST_LABELS = os.path.join(DEST_DATASET, "labels.csv")

def copy_dataset():
    print("Starting dataset copy... (This may take a while for 25,000 images)")
    
    # Check if source exists
    if not os.path.exists(SOURCE_IMAGES):
        print(f"ERROR: Source images folder not found at {SOURCE_IMAGES}")
        return
    
    # Create destination if it doesn't exist
    if not os.path.exists(DEST_IMAGES):
        os.makedirs(DEST_IMAGES)
        
    # Copy images (only if destination is empty or forced)
    img_count = len(os.listdir(SOURCE_IMAGES))
    print(f"Detected {img_count} images at source.")
    
    # To speed up for the user, we will copy in a way that shows progress
    counter = 0
    for img_name in os.listdir(SOURCE_IMAGES):
        src_path = os.path.join(SOURCE_IMAGES, img_name)
        dst_path = os.path.join(DEST_IMAGES, img_name)
        
        if not os.path.exists(dst_path):
            shutil.copy2(src_path, dst_path)
            counter += 1
            if counter % 1000 == 0:
                print(f"Copied {counter}/{img_count} images...")

    print("Copying labels CSV...")
    shutil.copy2(SOURCE_LABELS, DEST_LABELS)
    
    print("Dataset successfully stored inside the project folder.")

if __name__ == "__main__":
    copy_dataset()
