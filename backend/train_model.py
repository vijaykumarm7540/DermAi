import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications.resnet50 import ResNet50, preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight

# --- CONFIGURATION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset", "processed")
MODEL_SAVE_PATH = os.path.join(BASE_DIR, "models", "melanoma_resnet50.h5")

BATCH_SIZE = 32
STAGE_1_EPOCHS = 8
STAGE_2_EPOCHS = 15
IMG_SIZE = (224, 224)

def build_two_stage_resnet50():
    print("Initializing ResNet50 Transfer Learning Architecture...")
    base_model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(512, activation='relu', name='fc1')(x)
    x = Dropout(0.4, name='dropout1')(x)
    predictions = Dense(1, activation='sigmoid', name='output')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    return base_model, model

def train_model():
    if not os.path.exists(DATASET_DIR):
        print(f"ERROR: Organized dataset missing at {DATASET_DIR}. Run organize_data.py first.")
        return

    # Data Augmentation & Preprocessing Consistency (Caffe BGR zero-centered mean)
    train_datagen = ImageDataGenerator(
        preprocessing_function=preprocess_input,
        rotation_range=35,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.15,
        zoom_range=0.2,
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode='nearest',
        validation_split=0.2
    )

    train_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='binary', # 0: benign, 1: melanoma
        subset='training',
        shuffle=True
    )

    val_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='binary',
        subset='validation',
        shuffle=False
    )

    print(f"Class Mapping: {train_generator.class_indices}")

    # Compute Balanced Class Weights (Handling 4.6:1 Benign:Melanoma ratio)
    classes = train_generator.classes
    class_weights = compute_class_weight(
        class_weight='balanced',
        classes=np.unique(classes),
        y=classes
    )
    weight_dict = {i: float(class_weights[i]) for i in range(len(class_weights))}
    print(f"Calculated Class Weights (Benign: 0, Melanoma: 1): {weight_dict}")

    base_model, model = build_two_stage_resnet50()

    # ===================================================
    # STAGE 1: HEAD WARM-UP (Freeze Base ResNet50)
    # ===================================================
    print("\n--- STAGE 1: Training Dense Classification Head (ResNet50 Base Frozen) ---")
    base_model.trainable = False

    model.compile(
        optimizer=Adam(learning_rate=1e-3),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Recall(name='recall'), tf.keras.metrics.Precision(name='precision')]
    )

    stage1_checkpoint = ModelCheckpoint(MODEL_SAVE_PATH, monitor='val_loss', save_best_only=True, mode='min')
    
    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=STAGE_1_EPOCHS,
        class_weight=weight_dict,
        callbacks=[stage1_checkpoint]
    )

    # ===================================================
    # STAGE 2: DEEP FINE-TUNING (Unfreeze Top Conv Layers)
    # ===================================================
    print("\n--- STAGE 2: Unfreezing Top ResNet50 Conv Layers for Deep Fine-Tuning ---")
    base_model.trainable = True
    
    # Freeze bottom layers, unfreeze top 40 layers (from conv5_block1_out onwards)
    for layer in base_model.layers[:-40]:
        layer.trainable = False
    for layer in base_model.layers[-40:]:
        layer.trainable = True

    model.compile(
        optimizer=Adam(learning_rate=1e-5),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Recall(name='recall'), tf.keras.metrics.Precision(name='precision')]
    )

    early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True, mode='min')
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-7, verbose=1)
    stage2_checkpoint = ModelCheckpoint(MODEL_SAVE_PATH, monitor='val_loss', save_best_only=True, mode='min')

    model.fit(
        train_generator,
        validation_data=val_generator,
        epochs=STAGE_2_EPOCHS,
        class_weight=weight_dict,
        callbacks=[early_stop, reduce_lr, stage2_checkpoint]
    )

    print(f"\nTraining Complete. Calibrated model saved to {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    train_model()
