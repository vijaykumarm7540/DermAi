import tensorflowjs as tfjs
import tensorflow as tf
import os
import shutil

model_path = r"C:\Users\vijay kumar.m\OneDrive\Desktop\Final Yeatr Project 2027\skin-ai-insights-main\skin-ai-insights-main\trained_model\skin_cancer_resnet50.h5"
output_path = r"C:\Users\vijay kumar.m\OneDrive\Desktop\Final Yeatr Project 2027\skin-ai-insights-main\skin-ai-insights-main\trained_model\tfjs_model"
deploy_path = r"C:\Users\vijay kumar.m\OneDrive\Desktop\Final Yeatr Project 2027\skin-ai-insights-main\skin-ai-insights-main\public\model\skin-ai"

print(f"Loading model from {model_path}")
model = tf.keras.models.load_model(model_path)

print(f"Converting to TF.js at {output_path}")
if not os.path.exists(output_path):
    os.makedirs(output_path)
tfjs.converters.save_keras_model(model, output_path)

print(f"Deploying to {deploy_path}")
if os.path.exists(deploy_path):
    shutil.rmtree(deploy_path)
shutil.copytree(output_path, deploy_path)

print("Model deployment complete.")
