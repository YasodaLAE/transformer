import argparse
import os
from ultralytics import YOLO

def fine_tune_yolo_model(data_yaml_path, initial_model_path, output_path):
    """
    Runs the YOLO fine-tuning process.
    """

    # Initialize the Model
    print(f"Loading initial model from: {initial_model_path}")
    model = YOLO(initial_model_path)

    # Extract the directory and filename for the final model save path
    output_dir = os.path.dirname(output_path)
    output_name = os.path.splitext(os.path.basename(output_path))[0]

    # Train the Model
    print(f"Starting training with data: {data_yaml_path}")
    print(f"Output will be saved to: {output_dir} with run name: {output_name}")

    results = model.train(
        data=data_yaml_path,
        epochs=10,
        imgsz=640,
        batch=8,
        patience=50,
        optimizer='SGD',
        name=output_name,
        project=output_dir, # location
        exist_ok=True       # Allow the directory to exist
    )

    final_model_source = os.path.join(output_dir, output_name, 'weights', 'best.pt')

    if os.path.exists(final_model_source):
        # Save the best model to the exact path requested by Java
        os.rename(final_model_source, output_path)
        print(f"Training complete. Best model saved to: {output_path}")

    else:
        raise FileNotFoundError(f"Trained model not found at expected path: {final_model_source}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="YOLO Model Fine-Tuning Script.")
    parser.add_argument('--data_yaml', required=True, help="Path to the data.yaml file.")
    parser.add_argument('--initial_model', required=True, help="Path to the initial .pt model file.")
    parser.add_argument('--output_path', required=True, help="Full path where the final fine-tuned model (.pt) should be saved.")

    args = parser.parse_args()

    try:
        fine_tune_yolo_model(args.data_yaml, args.initial_model, args.output_path)
    except Exception as e:
        print(f"An error occurred during training: {e}", flush=True)
        exit(1)