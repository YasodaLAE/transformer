from ultralytics import YOLO

# 1. Initialize the Model
model = YOLO('yolov8n.pt')

# 2. Train the Model



results = model.train(
    data=r'./data.yaml',
    epochs=250,          
    imgsz=640,            
    batch=8,             
    patience=50,          # Stop training if validation metrics don't improve after 50 epochs
    optimizer='SGD',      # Stochastic Gradient Descent 
    # mosaic=0.0,         
    # mixup=0.0,
    name='new_transformer_anomaly'
)

print("Training complete. Model saved in runs/detect/transformer_anomaly_detector/")
