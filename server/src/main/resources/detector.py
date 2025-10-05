from ultralytics import YOLO
import cv2
import numpy as np
import os
import json
from datetime import datetime
import sys

# Configuration
MODEL_PATH = r"./server/src/main/resources/best.pt"

SEVERITY_MAP = {
    'Potentially Faulty': 1,
    'Faulty': 2
}

def get_baseline_intensity(baseline_path):
    """
    Estimate a baseline intensity from the baseline image by masking a target
    color range and taking the median of the selected intensity channel.

    Returns: int in [0, 255]
    """
    img = cv2.imread(baseline_path)
    if img is None:
        print(f"Error: Could not read baseline image at {baseline_path}", file=sys.stderr)
        return 50  # Fallback

    # NOTE: Mask is applied in BGR space (consistent with current thresholds).
    lower_cool = np.array([133, 118, 162])
    upper_cool = np.array([82, 207, 20])
    mask = cv2.inRange(img, lower_cool, upper_cool)

    # Use L-channel from LAB as intensity proxy
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    L_channel = lab[:, :, 0]
    selected = L_channel[mask > 0]

    if len(selected) == 0:
        print("Warning: No target-color pixels found. Falling back.", file=sys.stderr)
        return 50

    baseline = np.percentile(selected, 50)  # median
    baseline = max(baseline, 50)
    print(f"Calculated Baseline Intensity Proxy (median): {baseline:.2f}", file=sys.stderr)
    return int(baseline)

def run_detection(maintenance_image_path, baseline_image_path, save_folder, threshold_percentage):
    """
    Run YOLO on the maintenance image, filter detections by intensity difference
    relative to a baseline, annotate the image, and return structured results.
    """
    if not os.path.exists(maintenance_image_path) or not os.path.exists(baseline_image_path):
        return {
            "error": f"Image not found. Maintenance: {maintenance_image_path}, Baseline: {baseline_image_path}",
            "overall_status": "UNCERTAIN"
        }

    try:
        os.makedirs(save_folder, exist_ok=True)
        model = YOLO(MODEL_PATH)
    except Exception as e:
        return {"error": f"Model or path setup failed: {e}", "overall_status": "UNCERTAIN"}

    baseline_intensity_B = get_baseline_intensity(baseline_image_path)

    results = model(maintenance_image_path, conf=0.5, verbose=False)
    im_bgr = cv2.imread(maintenance_image_path)
    if im_bgr is None:
        return {"error": f"Error: Could not read maintenance image at {maintenance_image_path}", "overall_status": "UNCERTAIN"}

    final_anomalies_data = []
    overall_status = "NORMAL"

    base_filename = os.path.basename(maintenance_image_path)
    name, ext = os.path.splitext(base_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Use LAB; V-channel variable name is kept for compatibility with current logic
    im_hsv = cv2.cvtColor(im_bgr, cv2.COLOR_BGR2LAB)
    v_channel = im_hsv[:, :, 2]  # Using the third channel as intensity proxy (as in original code)

    for r in results:
        boxes = r.boxes.xyxy.cpu().numpy()
        scores = r.boxes.conf.cpu().numpy()
        class_ids = r.boxes.cls.cpu().numpy()
        class_names = model.names

        print(f"Detected {len(boxes)} anomaly/anomalies.", file=sys.stderr)

        for idx, (box, score, class_id) in enumerate(zip(boxes, scores, class_ids)):
            display_id = idx + 1
            x_min, y_min, x_max, y_max = map(int, box)

            roi_v = v_channel[y_min:y_max, x_min:x_max]
            if roi_v.size == 0:
                max_intensity_M = 0
            else:
                max_intensity_M = np.percentile(roi_v, 95)

            # Intensity "deference" relative to 255 scale (kept as is)
            if baseline_intensity_B > 0:
                intensity_deference = ((max_intensity_M - baseline_intensity_B) / 255) * 100
            else:
                intensity_deference = 100

            threshold_pct = threshold_percentage * 100

            if intensity_deference >= threshold_pct:
                class_label = class_names[int(class_id)]
                severity_score_int = SEVERITY_MAP.get(class_label, 0)

                anomaly_data = {
                    "id": display_id,
                    "type": class_label,
                    "location": {"x_min": x_min, "y_min": y_min, "x_max": x_max, "y_max": y_max},
                    "severity_score": severity_score_int,
                    "confidence": round(float(score), 4),
                }
                final_anomalies_data.append(anomaly_data)

                # Update overall status by highest severity encountered
                if severity_score_int == 2:
                    overall_status = "FAULTY"
                elif severity_score_int == 1 and overall_status != "FAULTY":
                    overall_status = "POTENTIALLY_FAULTY"

                # Draw bounding box and id label
                if severity_score_int == 2:
                    color = (0, 0, 255)      # Red
                elif severity_score_int == 1:
                    color = (0, 165, 255)    # Orange
                else:
                    color = (0, 255, 0)      # Green

                cv2.rectangle(im_bgr, (x_min, y_min), (x_max, y_max), color, 2)
                text = f"{display_id}"
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.7
                thickness = 2
                (tw, th), baseline = cv2.getTextSize(text, font, font_scale, thickness)
                text_y = y_min - 10
                if text_y < th + 5:
                    text_y = y_min + th + 5
                cv2.rectangle(im_bgr, (x_min, text_y - th - 5), (x_min + tw + 5, text_y + baseline), color, -1)
                cv2.putText(im_bgr, text, (x_min + 2, text_y - 2), font, font_scale, (255, 255, 255), thickness, cv2.LINE_AA)
            else:
                # Detected by YOLO but filtered out by intensity threshold
                pass

    output_image_filename = f"{name}_annotated_{timestamp}{ext}"
    save_image_path = os.path.join(save_folder, output_image_filename)

    success_img = cv2.imwrite(save_image_path, im_bgr)
    if success_img:
        print(f"Successfully saved result image to: {save_image_path}", file=sys.stderr)
    else:
        print(f"Error saving image to: {save_image_path}", file=sys.stderr)

    return {
        "overall_status": overall_status,
        "output_image_name": output_image_filename,
        "anomalies": final_anomalies_data
    }

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(json.dumps({
            "error": "Usage: python detector.py <maintenance_img_path> <baseline_img_path> <output_save_folder_path> <temp_threshold_percentage>",
            "overall_status": "UNCERTAIN"
        }))
        sys.exit(1)

    maintenance_image_path = sys.argv[1]
    baseline_image_path = sys.argv[2]
    output_save_folder = sys.argv[3]

    try:
        threshold_percentage = float(sys.argv[4])
    except ValueError:
        print(json.dumps({
            "error": "Threshold percentage must be a number.",
            "overall_status": "UNCERTAIN"
        }))
        sys.exit(1)

    result = run_detection(maintenance_image_path, baseline_image_path, output_save_folder, threshold_percentage)
    print(json.dumps(result, indent=4))
