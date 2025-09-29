import sys
import os
import cv2
import numpy as np
import json
from ultralytics import YOLO

# --- CONFIGURATION (Paths MUST be relative to the running Spring Boot service or use absolute paths) ---
# NOTE: In a real system, the model path should be read from a config file, not hardcoded.
MODEL_PATH = r"C:\Users\Yaseema Rusiru\Desktop\runs\detect\transformer_anomaly_detector_tiny_data3\weights\best.pt"
# The SAVE_FOLDER path must be accessible by the Java process AND resolvable by the Java file serving logic.
# For simplicity, we'll assume the Java service saves ALL images to the same root, and Python uses a sub-folder.
# Let's use a temporary folder for the annotated images, assuming Java has access.
# NOTE: The Java code will need to know the relative path to this folder.
ANNOTATED_IMAGE_SUBDIR = "annotated" 
BASE_SAVE_PATH = r"C:\Users\Yaseema Rusiru\Desktop\Anomaly_Detection_Results" # MUST be the same root as Java file storage

SEVERITY_MAP = {
    'Potentially Faulty': 1,
    'Faulty': 2
}
# --------------------------------------------------------------------------------------------------

def run_detection(image_path, base_save_path):
    # 1. Input validation
    if not os.path.exists(image_path):
        return {"error": f"Image not found at path: {image_path}", "overall_status": "UNCERTAIN"}

    # 2. Setup paths and model
    try:
        model = YOLO(MODEL_PATH)
        save_folder = os.path.join(base_save_path, ANNOTATED_IMAGE_SUBDIR)
        os.makedirs(save_folder, exist_ok=True)
    except Exception as e:
        return {"error": f"Model or path setup failed: {e}", "overall_status": "UNCERTAIN"}

    # 3. Run inference
    results_list = []
    overall_status = "NORMAL"

    results = model(image_path, conf=0.5, verbose=False)

    for r in results:
        # Save the annotated image (im_bgr is the image with boxes drawn)
        im_bgr = r.plot()
        
        # Create a unique filename for the output image
        base_filename = os.path.basename(image_path)
        output_filename = f"annotated_{os.path.splitext(base_filename)[0]}_{os.getpid()}.jpg"
        save_path = os.path.join(save_folder, output_filename)
        
        cv2.imwrite(save_path, im_bgr)
        
        # Process bounding boxes
        boxes = r.boxes.xyxy.cpu().numpy()
        scores = r.boxes.conf.cpu().numpy()
        class_ids = r.boxes.cls.cpu().numpy()
        class_names = model.names
        
        for box, score, class_id in zip(boxes, scores, class_ids):
            x_min, y_min, x_max, y_max = map(int, box)
            class_label = class_names[int(class_id)]
            severity_score = SEVERITY_MAP.get(class_label, 0)

            anomaly = {
                "type": class_label,
                "confidence": round(float(score), 4),
                "severity_score": severity_score,
                "location": {
                    "x_min": x_min,
                    "y_min": y_min,
                    "x_max": x_max,
                    "y_max": y_max
                }
            }
            results_list.append(anomaly)
            
            # Update overall status
            if severity_score == 2:
                overall_status = "FAULTY"
            elif severity_score == 1 and overall_status != "FAULTY":
                overall_status = "POTENTIALLY_FAULTY"

    return {
        "overall_status": overall_status,
        "output_image_name": os.path.join(ANNOTATED_IMAGE_SUBDIR, output_filename), # Return the relative path for Java to find
        "anomalies": results_list
    }


if __name__ == "__main__":
    if len(sys.argv) != 3:
        # We need two arguments: image_path and the storage_root_location (from Java)
        print(json.dumps({
            "error": "Usage: python anomaly_detector.py <maintenance_image_path> <storage_root_location>",
            "overall_status": "UNCERTAIN"
        }))
        sys.exit(1)

    image_path = sys.argv[1]
    storage_root_location = sys.argv[2] # Passed from Java
    
    # NOTE: You MUST pass the storage_root_location from Java, otherwise the Python script
    # will save the image in a location Java cannot access.
    
    result = run_detection(image_path, storage_root_location)
    print(json.dumps(result, indent=4))