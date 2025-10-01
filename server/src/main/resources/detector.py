from ultralytics import YOLO
import cv2
import numpy as np
import os
import json
from datetime import datetime
import sys

# --- CONFIGURATION (Move hardcoded values to the top or arguments) ---
# NOTE: The MODEL_PATH remains hardcoded for simplicity, but in production, 
# it should ideally be handled via config or environment variables.
MODEL_PATH = r"C:\Users\Yaseema Rusiru\Desktop\runs\detect\transformer_anomaly_detector_tiny_data3\weights\best.pt"

SEVERITY_MAP = {
    'Potentially Faulty': 1,
    'Faulty': 2
}
# ------------------------------------------------------------------

# Function to encapsulate the detection logic
def run_detection(image_path, save_folder):
    """Performs detection and returns results as a dictionary."""
    
    # 1. Input validation
    if not os.path.exists(image_path):
        return {"error": f"Image not found at path: {image_path}", "overall_status": "UNCERTAIN"}

    # 2. Setup paths and model
    try:
        # Ensure the save folder exists
        os.makedirs(save_folder, exist_ok=True)
        # Load your best trained model
        model = YOLO(MODEL_PATH)
    except Exception as e:
        return {"error": f"Model or path setup failed: {e}", "overall_status": "UNCERTAIN"}

    # Run inference on the image
    results = model(image_path, conf=0.5, verbose=False)

    # Read the original image to draw on
    im_bgr = cv2.imread(image_path)
    if im_bgr is None:
        return {"error": f"Error: Could not read image at {image_path}", "overall_status": "UNCERTAIN"}

    # List to hold all detected anomaly objects for JSON output
    all_anomalies_data = []
    overall_status = "NORMAL" # Initialize overall status

    # Process the results
    for i, r in enumerate(results):
        # Get the data
        boxes = r.boxes.xyxy.cpu().numpy()
        scores = r.boxes.conf.cpu().numpy()
        class_ids = r.boxes.cls.cpu().numpy()
        class_names = model.names

        # Use stderr for non-JSON status output
        print(f"Detected {len(boxes)} anomaly/anomalies.", file=sys.stderr)

        # Iterate through the boxes using enumerate to get an index (box_number)
        for box_number, (box, score, class_id) in enumerate(zip(boxes, scores, class_ids)):
            # Box number starts from 1 for user readability
            display_box_number = box_number + 1

            x_min, y_min, x_max, y_max = map(int, box)
            confidence = score # Use the raw float score for the JSON

            # --- Look up the class name and integer severity score ---
            class_label = class_names[int(class_id)]
            severity_score_int = SEVERITY_MAP.get(class_label, 0)
            
            # 🚀 Collect data for JSON output
            anomaly_data = {
                "id": display_box_number,
                "type": class_label,
                "location": {"x_min" : x_min, "y_min": y_min, "x_max" : x_max, "y_max" : y_max},
                "severity_score": severity_score_int, 
                "confidence": round(float(confidence), 4),
            }
            all_anomalies_data.append(anomaly_data)
            
            # 🚀 Update overall status based on highest severity
            if severity_score_int == 2:
                overall_status = "FAULTY"
            elif severity_score_int == 1 and overall_status != "FAULTY":
                overall_status = "POTENTIALLY_FAULTY"
            
            # ---------------------------------------------------------------------------------
            # Drawing on Image (Kept for visual output)
            text = f"{display_box_number}"

            # Determine color based on severity (BGR format)
            if severity_score_int == 2:
                color = (0, 0, 255) # Red
            elif severity_score_int == 1:
                color = (0, 165, 255) # Orange/Yellow
            else:
                color = (0, 255, 0) # Green

            # Draw the bounding box
            cv2.rectangle(im_bgr, (x_min, y_min), (x_max, y_max), color, 2)

            # Draw text (box number) for annotation
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.7
            thickness = 2
            (text_width, text_height), baseline = cv2.getTextSize(text, font, font_scale, thickness)

            text_y_offset = y_min - 10
            if text_y_offset < text_height + 5:
                text_y_offset = y_min + text_height + 5

            cv2.rectangle(im_bgr, (x_min, text_y_offset - text_height - 5), (x_min + text_width + 5, text_y_offset + baseline), color, -1)
            cv2.putText(im_bgr, text, (x_min + 2, text_y_offset - 2), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

        # --- Code for saving the image ---
        base_filename = os.path.basename(image_path)
        name, ext = os.path.splitext(base_filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Define save path
        output_image_filename = f"{name}_annotated_{timestamp}{ext}"
        save_image_path = os.path.join(save_folder, output_image_filename)
        
        # Save the annotated image
        success_img = cv2.imwrite(save_image_path, im_bgr)

        # Use stderr for non-JSON status output
        if success_img:
            print(f"Successfully saved result image to: {save_image_path}", file=sys.stderr)
        else:
            print(f"Error saving image to: {save_image_path}", file=sys.stderr)

        # Return the collected data
        return {
            "overall_status": overall_status,
            "output_image_path": save_image_path,
            "anomalies": all_anomalies_data
        }

# 🚀 NEW ENTRY POINT: Use sys.argv to get inputs
if __name__ == "__main__":
    # Check for the required arguments
    if len(sys.argv) != 3:
        # Print error message and exit
        print(json.dumps({
            "error": "Usage: python script_name.py <input_image_path> <output_save_folder_path>",
            "overall_status": "UNCERTAIN"
        }))
        sys.exit(1)

    # Map the command-line arguments to variables
    input_image_path = sys.argv[1] # The path to the image to inspect
    output_save_folder = sys.argv[2] # The path where the annotated image and report should be saved

    # Run the detection function
    result = run_detection(input_image_path, output_save_folder)
    
    # Print the final JSON to standard output (stdout)
    print(json.dumps(result, indent=4))