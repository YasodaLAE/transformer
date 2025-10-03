from ultralytics import YOLO
import cv2
import numpy as np
import os
import json
from datetime import datetime
import sys

# --- CONFIGURATION (Move hardcoded values to the top or arguments) ---
MODEL_PATH = r"C:\Users\Yaseema Rusiru\Desktop\runs\detect\new_transformer_anomaly_detector_tiny_data\weights\best.pt"

SEVERITY_MAP = {
    'Potentially Faulty': 1,
    'Faulty': 2
}
# ------------------------------------------------------------------

# 🚀 NEW FUNCTION: Baseline Intensity Calculation
def get_baseline_intensity(baseline_path):
    """
    Finds a proxy for the minimum normal operating temperature intensity
    by targeting the median intensity of non-background (non-black) pixels.
    Returns: The calculated baseline intensity proxy (int 0-255).
    """
    img = cv2.imread(baseline_path)
    if img is None:
        print(f"Error: Could not read baseline image at {baseline_path}", file=sys.stderr)
        return 50 # Tunable fallback

    # Convert image to grayscale for a single intensity score (0-255)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Filter out pure black (background, black bars) and very dark pixels (e.g., < 10)
    # This leaves us with the transformer body and any color bar.
    non_black_pixels = gray[gray > 10]

    if len(non_black_pixels) == 0:
        return 50 # Fallback

    # Use the 25th percentile (or median/50th) of the non-black pixels as a proxy for the
    # 'coolest' operational part of the transformer, excluding the absolute coldest spots.
    percentile = 25
    baseline_intensity_proxy = np.percentile(non_black_pixels, percentile)

    # Ensure a minimum intensity to prevent overly sensitive results or division by zero
    baseline_intensity_proxy = max(baseline_intensity_proxy, 50)

    print(f"Calculated Baseline Intensity Proxy: {baseline_intensity_proxy:.2f}", file=sys.stderr)

    return int(baseline_intensity_proxy)


# 🚀 MODIFIED FUNCTION SIGNATURE AND LOGIC
def run_detection(maintenance_image_path, baseline_image_path, save_folder, threshold_percentage):
    """
    Performs detection and returns results as a dictionary, filtered by temperature deference.
    """
    # ... (Input validation and setup paths/model as before) ...

    # 1. Input validation (check all four arguments)
    if not os.path.exists(maintenance_image_path) or not os.path.exists(baseline_image_path):
        return {"error": f"Image not found. Maintenance: {maintenance_image_path}, Baseline: {baseline_image_path}", "overall_status": "UNCERTAIN"}

    try:
        os.makedirs(save_folder, exist_ok=True)
        model = YOLO(MODEL_PATH)
    except Exception as e:
        return {"error": f"Model or path setup failed: {e}", "overall_status": "UNCERTAIN"}

    # 2. --- Establish the Baseline Reference Intensity ---
    baseline_intensity_B = get_baseline_intensity(baseline_image_path)
    # The get_baseline_intensity function already handles fallbacks.

    # 3. Run inference on the maintenance image
    results = model(maintenance_image_path, conf=0.5, verbose=False)

    im_bgr = cv2.imread(maintenance_image_path)
    if im_bgr is None:
        return {"error": f"Error: Could not read maintenance image at {maintenance_image_path}", "overall_status": "UNCERTAIN"}

    # List to hold ONLY the anomalies that pass the deference check
    final_anomalies_data = []
    overall_status = "NORMAL"

    base_filename = os.path.basename(maintenance_image_path)
    name, ext = os.path.splitext(base_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Process the results
    for i, r in enumerate(results):
        boxes = r.boxes.xyxy.cpu().numpy()
        scores = r.boxes.conf.cpu().numpy()
        class_ids = r.boxes.cls.cpu().numpy()
        class_names = model.names

        print(f"Detected {len(boxes)} anomaly/anomalies.", file=sys.stderr)

        for box_number, (box, score, class_id) in enumerate(zip(boxes, scores, class_ids)):
            display_box_number = box_number + 1
            x_min, y_min, x_max, y_max = map(int, box)

            # --- CRITICAL NEW STEP: Calculate Max Anomaly Intensity (I_M Proxy) ---
            roi = im_bgr[y_min:y_max, x_min:x_max]

            # Find the absolute highest channel value (0-255) in the ROI as the HOTSPOT PROXY
            max_intensity_M = int(np.max(roi))

            # ----------------------------------------------------------------------

            # --- APPLY DEFERENCE CHECK (FR2.1) ---

            # Calculate the percentage difference from the Baseline Intensity Proxy
            # Equation: ((I_M - I_B) / I_B) * 100
            if baseline_intensity_B > 0:
                intensity_deference = ((max_intensity_M - baseline_intensity_B) / baseline_intensity_B) * 100
            else:
                intensity_deference = 100 # Default to high deference if baseline is near zero

            # We also ensure the YOLO confidence is met (default to 0.5 set in model() call)
            if score >= 0.5 and intensity_deference >= threshold_percentage:

                # --- Anomaly Passes BOTH YOLO Confidence AND Deference Check ---

                class_label = class_names[int(class_id)]
                severity_score_int = SEVERITY_MAP.get(class_label, 0)

                # 🚀 Collect data for JSON output
                anomaly_data = {
                    "id": display_box_number,
                    "type": class_label,
                    "location": {"x_min" : x_min, "y_min": y_min, "x_max" : x_max, "y_max" : y_max},
                    "severity_score": severity_score_int,
                    "confidence": round(float(score), 4),
#                     "intensity_deference_percent": round(intensity_deference, 2) # NEW METADATA
                }
                final_anomalies_data.append(anomaly_data)

                # 🚀 Update overall status based on highest severity
                if severity_score_int == 2:
                    overall_status = "FAULTY"
                elif severity_score_int == 1 and overall_status != "FAULTY":
                    overall_status = "POTENTIALLY_FAULTY"

                # ---------------------------------------------------------------------------------
                # Drawing on Image (Only draw boxes that passed the deference filter)
                text = f"{display_box_number}" # ... (Drawing logic as before)
                # ... (rest of drawing logic)
                if severity_score_int == 2:
                    color = (0, 0, 255) # Red
                elif severity_score_int == 1:
                    color = (0, 165, 255) # Orange/Yellow
                else:
                    color = (0, 255, 0) # Green

                cv2.rectangle(im_bgr, (x_min, y_min), (x_max, y_max), color, 2)
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.7
                thickness = 2
                (text_width, text_height), baseline = cv2.getTextSize(text, font, font_scale, thickness)
                text_y_offset = y_min - 10
                if text_y_offset < text_height + 5:
                    text_y_offset = y_min + text_height + 5

                cv2.rectangle(im_bgr, (x_min, text_y_offset - text_height - 5), (x_min + text_width + 5, text_y_offset + baseline), color, -1)
                cv2.putText(im_bgr, text, (x_min + 2, text_y_offset - 2), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)

            else:
                # Anomaly was detected by YOLO but failed the temperature deference check.
                # Do NOT draw the box or include it in the final_anomalies_data.
                pass

    # Define save path
    output_image_filename = f"{name}_annotated_{timestamp}{ext}"
    save_image_path = os.path.join(save_folder, output_image_filename)

    # Save the annotated image
    success_img = cv2.imwrite(save_image_path, im_bgr)

    if success_img:
        print(f"Successfully saved result image to: {save_image_path}", file=sys.stderr)
    else:
        print(f"Error saving image to: {save_image_path}", file=sys.stderr)

    # Return the collected data (only filtered anomalies)
    return {
        "overall_status": overall_status,
        "output_image_name": output_image_filename,
        "anomalies": final_anomalies_data
    }


# 🚀 MODIFIED ENTRY POINT: Now expects 4 arguments
if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(json.dumps({
            "error": "Usage: python detector.py <maintenance_img_path> <baseline_img_path> <output_save_folder_path> <temp_threshold_percentage>",
            "overall_status": "UNCERTAIN"
        }))
        sys.exit(1)

    maintenance_image_path = sys.argv[1]
    baseline_image_path = sys.argv[2] # New argument 2
    output_save_folder = sys.argv[3] # Argument 3

    try:
        threshold_percentage = float(sys.argv[4]) # New argument 4
    except ValueError:
        print(json.dumps({
            "error": "Threshold percentage must be a number.",
            "overall_status": "UNCERTAIN"
        }))
        sys.exit(1)

    result = run_detection(maintenance_image_path, baseline_image_path, output_save_folder, threshold_percentage)
    print(json.dumps(result, indent=4))