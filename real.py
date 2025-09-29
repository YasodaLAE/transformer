from ultralytics import YOLO
import cv2
import numpy as np

# Load your best trained model
model = YOLO(r"C:\Users\Yaseema Rusiru\Desktop\runs\detect\transformer_anomaly_detector_tiny_data3\weights\best.pt")

# Path to the image you want to test
image_path = r"C:\Users\Yaseema Rusiru\Downloads\transformer\images\test\T7_normal_003.jpg"

# Run inference on the image
# 'conf' sets the minimum confidence threshold to display a detection
results = model(image_path, conf=0.5) 

# Process the results
for r in results:
    # 'im_bgr' is the BGR image with predictions drawn (boxes, labels, scores)
    im_bgr = r.plot() 
    
    # Extract bounding box coordinates and confidence scores
    boxes = r.boxes.xyxy.cpu().numpy()  # xyxy format: [x_min, y_min, x_max, y_max]
    scores = r.boxes.conf.cpu().numpy()
    
    print(f"Detected {len(boxes)} anomaly/anomalies.")
    
    for box, score in zip(boxes, scores):
        x_min, y_min, x_max, y_max = map(int, box)
        confidence = f"{score:.2f}"
        
        print(f"Bounding Box: ({x_min}, {y_min}) to ({x_max}, {y_max}), Confidence: {confidence}")
        
        # Optionally, you can draw the confidence score manually
        cv2.putText(im_bgr, confidence, (x_min, y_min - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)
        
    # Display the image with bounding boxes
    cv2.imshow("Anomaly Detection", im_bgr)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

# The r.plot() function handles drawing the box, class label, and confidence score
# directly onto the image for simple visualization.
