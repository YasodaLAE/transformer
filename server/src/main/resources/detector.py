from ultralytics import YOLO
import cv2
import numpy as np
import os
import json
from datetime import datetime
import sys

# --- CONFIGURATION (Move hardcoded values to the top or arguments) ---
# MODEL_PATH = r"/Users/kavindujayathissa/Desktop/Academics/Semester 07/EN3350 Software Design/phase 2/best.pt"
MODEL_PATH = r"./server/src/main/resources/best.pt"

SEVERITY_MAP = {
    'Potentially Faulty': 1,
    'Faulty': 2
}

# 🚀 NEW FUNCTION: Baseline Intensity Calculation (IMPROVED)
def get_baseline_intensity(baseline_path):
    """
    Finds a proxy for the 'coolest' normal operating temperature intensity
    by targeting the median intensity (V channel) of pixels falling within
    the blue/green Hue range, representing the body of the transformer.

    Returns: The calculated baseline intensity proxy (int 0-255).
    """
    img = cv2.imread(baseline_path)
    if img is None:
        print(f"Error: Could not read baseline image at {baseline_path}", file=sys.stderr)
        return 50 # Tunable fallback

    # 1. Convert to HSV (Hue, Saturation, Value/Intensity)
    # Hue in OpenCV is 0-179. Blue/Cyan/Green are typically in the 60-120 range.
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # 2. Define the Color Range (Hue Mask)
    # We target blue/cyan/green (cool colors) typically associated with healthy transformers.
    # Hue: 60 (Green) to 120 (Cyan/Blue)
    # Saturation: Must be above a threshold (e.g., 50) to exclude gray/black/white areas (background, text)
    # Value: Must be above a threshold (e.g., 50) to exclude very dark noise

    # Lower bound for cool colors (H, S, V)
#     lower_cool = np.array([60, 50, 50])
    lower_cool = np.array([133, 118, 162])
    # Upper bound for cool colors (H, S, V)
#     upper_cool = np.array([120, 255, 255])
    upper_cool = np.array([82, 207, 20])

#     mask = cv2.inRange(hsv, lower_cool, upper_cool)
    mask = cv2.inRange(img, lower_cool, upper_cool)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
#     R_channel = hsv[:, :, 2] # V is the third channel (index 2)
    R_channel = lab[:, :, 0]

    # Filter the V channel using the mask
#     cool_pixels_intensity = V_channel[mask > 0] # Intensities of pixels in the target color range
    cool_pixels_intensity = R_channel[mask > 0]

    if len(cool_pixels_intensity) == 0:
        print("Warning: No cool (blue/green) pixels found. Falling back.", file=sys.stderr)
        return 50 # Fallback

    # 4. Find the Baseline Intensity Proxy
    # Use the 50th percentile (median) of the 'cool' pixel intensities.
    # This represents the typical intensity of the healthy transformer body,
    # which is often more stable than the 25th percentile.

    percentile = 50
    baseline_intensity_proxy = np.percentile(cool_pixels_intensity, percentile)

    # Ensure a minimum intensity
    baseline_intensity_proxy = max(baseline_intensity_proxy, 50)

    print(f"Calculated Color-Filtered Baseline Intensity Proxy (Median V): {baseline_intensity_proxy:.2f}", file=sys.stderr)

    return int(baseline_intensity_proxy)

# 🚀 MODIFIED FUNCTION SIGNATURE AND LOGIC
def run_detection(maintenance_image_path, baseline_image_path, save_folder, threshold_percentage):
    """
    Performs detection and returns results as a dictionary, filtered by temperature deference.
    """

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

    im_hsv = cv2.cvtColor(im_bgr, cv2.COLOR_BGR2LAB)
    v_channel = im_hsv[:, :, 2] # Extract the V-channel (Intensity)

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
            roi_v_channel = v_channel[y_min:y_max, x_min:x_max]
            if roi_v_channel.size == 0:
                max_intensity_M = 0
            else:
                # np.max on a uint8 array will return an integer.
                max_intensity_M = np.percentile(roi_v_channel, 95)

#             # --- CRITICAL NEW STEP: Calculate Max Anomaly Intensity (I_M Proxy) ---
#             roi = im_bgr[y_min:y_max, x_min:x_max]
#
#             # Find the absolute highest channel value (0-255) in the ROI as the HOTSPOT PROXY
#             max_intensity_M = int(np.max(roi))

            # ----------------------------------------------------------------------
            # --- APPLY DEFERENCE CHECK (FR2.1) ---

            # Calculate the percentage difference from the Baseline Intensity Proxy
            # Equation: ((I_M - I_B) / I_B) * 100
            if baseline_intensity_B > 0:
                intensity_deference = ((max_intensity_M - baseline_intensity_B) / 255) *100
            else:
                intensity_deference = 100 # Default to high deference if baseline is near zero

            #print(f"Anomaly {box_number+1}: Deference={intensity_deference:.2f}%, Threshold={threshold_percentage:.2f}%", file=sys.stderr)
#             print(f"Maintenance Image Shape: {im_bgr.shape}, Dtype: {im_bgr.dtype}", file=sys.stderr)
#             print(f"Maintenance Image Max Value: {np.max(im_bgr)}", file=sys.stderr)
#
            threshold_percentage = threshold_percentage*100
            # We also ensure the YOLO confidence is met (default to 0.5 set in model() call)
            if intensity_deference >= threshold_percentage:
#             if True:

                # --- Anomaly Passes BOTH YOLO Confidence AND Deference Check ---

                class_label = class_names[int(class_id)]
                severity_score_int = SEVERITY_MAP.get(class_label, 0)

                # 🚀 Collect data for JSON output
                anomaly_data = {
                    "id": display_box_number,
                    "type": class_label,
                    #"type": ,
                    "location": {"x_min" : x_min, "y_min": y_min, "x_max" : x_max, "y_max" : y_max},
                    "severity_score": severity_score_int,
#                     "severity_score": intensity_deference,
                    "confidence": round(float(score), 4),
#                     "confidence": threshold_percentage,
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