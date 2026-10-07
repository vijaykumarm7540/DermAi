import os
import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import ResNet50
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split

# --- CONFIGURATION ---
DATASET_PATH = r"C:\Users\vijay kumar.m\OneDrive\Desktop\Final Yeatr Project 2027\archive"
IMAGES_DIR = os.path.join(DATASET_PATH, "ISIC_2019_Training_Input", "ISIC_2019_Training_Input")
LABELS_CSV = os.path.join(DATASET_PATH, "ISIC_2019_Training_GroundTruth.csv")
OUTPUT_MODEL_DIR = "trained_model"
PUBLIC_MODEL_DIR = os.path.join("public", "model", "skin-ai")
BATCH_SIZE = 32
EPOCHS = 5  # Increased for a more 'real' training session
IMG_SIZE = (224, 224)
SUBSET_SIZE = None  # USE FULL DATASET

print(f"Starting FULL Fine-tuning process on the complete dataset...")

# 1. Load and prepare labels
df = pd.read_csv(LABELS_CSV)
if SUBSET_SIZE:
    df = df.head(SUBSET_SIZE)
# The CSV has one-hot encoded labels. We need to convert them to a single column or keep them as is.
# ImageDataGenerator flow_from_dataframe can handle multiple columns if they are listed.
class_names = ['MEL', 'NV', 'BCC', 'AK', 'BKL', 'DF', 'VASC', 'SCC', 'UNK']
df['image'] = df['image'] + ".jpg" # Append extension to match file names

# 2. Split data
train_df, val_df = train_test_split(df, test_size=0.2, random_state=42)

# 3. Data Augmentation
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True,
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_dataframe(
    dataframe=train_df,
    directory=IMAGES_DIR,
    x_col="image",
    y_col=class_names,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="raw"
)

val_generator = val_datagen.flow_from_dataframe(
    dataframe=val_df,
    directory=IMAGES_DIR,
    x_col="image",
    y_col=class_names,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="raw"
)

# 4. Build Model (ResNet50)
base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# Fine-tuning: Unfreeze the last 10 layers of the base model
for layer in base_model.layers[:-10]:
    layer.trainable = False
for layer in base_model.layers[-10:]:
    layer.trainable = True

x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation='relu')(x)
x = Dropout(0.5)(x)
predictions = Dense(len(class_names), activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

model.compile(optimizer=Adam(learning_rate=0.0001), 
              loss='categorical_crossentropy', 
              metrics=['accuracy'])

# 5. Train
print(f"Training on {len(train_df)} images, validating on {len(val_df)} images...")
model.fit(
    train_generator,
    steps_per_epoch=len(train_df) // BATCH_SIZE,
    validation_data=val_generator,
    validation_steps=len(val_df) // BATCH_SIZE,
    epochs=EPOCHS
)

# 6. Save Model
if not os.path.exists(OUTPUT_MODEL_DIR):
    os.makedirs(OUTPUT_MODEL_DIR)

model_path = os.path.join(OUTPUT_MODEL_DIR, "skin_cancer_resnet50.h5")
model.save(model_path)
print(f"Model saved to {model_path}")

# 7. Convert to TensorFlow.js (Optional, might fail due to env issues)
print("Converting model to TensorFlow.js format...")
tfjs_output_dir = os.path.join(OUTPUT_MODEL_DIR, "tfjs_model")
import subprocess
import sys
import shutil

try:
    # Using python -m to ensure we use the correct environment's converter
    env = os.environ.copy()
    env["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
    result = subprocess.run([
        sys.executable, "-m", "tensorflowjs.converters.converter",
        "--input_format", "keras", 
        model_path, 
        tfjs_output_dir
    ], shell=True, env=env)
    
    if result.returncode == 0:
        # 8. Deploy to Public Folder
        print(f"Deploying model to {PUBLIC_MODEL_DIR}...")
        if os.path.exists(PUBLIC_MODEL_DIR):
            shutil.rmtree(PUBLIC_MODEL_DIR)
        shutil.copytree(tfjs_output_dir, PUBLIC_MODEL_DIR)
        print(f"Fine-tuning complete! TF.js model deployed to {PUBLIC_MODEL_DIR}")
    else:
        print("TF.js conversion failed. You may need to convert the model manually in a stable environment (Python 3.10).")
except Exception as e:
    print(f"Error during conversion: {e}")
