# ⚡ Oversight: Transformer Control System

A comprehensive web application designed to manage, track, and analyze inspections of electrical transformers with AI-powered thermal anomaly detection. Both admins and viewers can monitor transformer data, inspection records, and gain automated insights from thermal image analysis.

Test data (6 transformers with baseline and thermal images) are included in the `Test Data` folder.

---

## 📑 Features

### 🔐 Phase 1: Core Management System
- **Authentication System**: Local authentication to differentiate between regular users and administrators
- **Transformer Management**: 
  - Administrators can `view` `add` `edit` `delete` transformers and inspections
  - Administrators can `view` `upload` `delete` both thermal and baseline images
  - Regular users can view all data but cannot modify it
- **Inspection Workflow**: 
  - Update inspection status (`Pending`, `In Progress`, `Completed`)
  - Color-coded status badges (`Pending`: red, `In Progress`: green, `Completed`: blue)
- **Advanced Search**: 
  - Search transformers by number, location, and type
  - Search inspections by transformer number
  - Add inspections directly from the search interface

### 🤖 Phase 2: AI-Powered Anomaly Detection
- **Automated Thermal Analysis**:
  - AI-based comparison engine that analyzes new maintenance images against baseline images
  - Automatic detection of thermal anomalies (temperature spikes, asymmetries, hotspot changes)
  - Intelligent thresholding mechanism to flag potential issues
- **Interactive Image Comparison**:
  - Side-by-side view of baseline and maintenance thermal images
  - Zoom, pan (click and drag), and reset controls
  - Visual anomaly highlighting with color-coded overlays and markers
- **Detailed Anomaly Metadata**:
  - Pixel coordinates and anomaly size information
  - Severity scores and confidence levels
  - Automatic annotation of detected anomalies
- **Performance Optimized**:
  - Fast model inference for responsive user experience
  - Modular architecture for future AI model improvements
  - Complete detection logs and metadata storage

---

## 🛠️ Setup Instructions

### ✅ Prerequisites
Make sure you have the following installed with corresponding versions:

- **Java Development Kit (JDK):** `17.0.12`  
- **Spring Boot:** `3.5.4`  
- **Apache Maven:** `3.9.11`  
- **Node.js:** `21.7.3`  
- **npm:** `10.5.0`  
- **MySQL Database:** `8.0.39`  
- **IDE (recommended):** IntelliJ IDEA 2025.2 (Community Edition)

---

### ⚙️ Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YasodaLAE/transformer
   ```

2. **Open the project**  
   Open the cloned project folder in your IDE.

3. **Configure database connection**  
   Open `server/src/main/resources/application.properties` and update the database credentials:
   ```properties
   spring.datasource.username=[Add Your MySQL Username Here]
   spring.datasource.password=[Add Your MySQL Password Here]
   ```

4. **Start MySQL server**  
   Run the following command in a separate terminal and enter your password when prompted:
   ```bash
   mysql -u root -p
   ```

5. **Run the application**  
   Execute the main application file `OversightApplication.java`

✅ Backend server will start on `http://localhost:8080`

---

### 🌐 Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

✅ Frontend application will open in your browser on `http://localhost:5173`

---

### 🔑 Login Credentials

Use any of the following `username : password` pairs to access the system:

```
admin  : 1
admin2 : 2
admin3 : 3
```

---

## 🎯 AI Detection Approach

### Anomaly Detection Logic
Our system employs a hybrid approach combining deep learning and computer vision techniques:

#### Deep Learning Component (YOLO Model)
- **Custom-trained YOLOv model** for real-time anomaly detection and automatic annotation
- Trained specifically on thermal transformer images to identify:
  - Hotspots and temperature anomalies
  - Structural abnormalities
  - Component degradation patterns
- Provides accurate bounding boxes and confidence scores for detected anomalies
- Optimized architecture for fast inference on thermal imagery

#### Computer Vision Optimization
- **Advanced thresholding techniques** applied post-detection to:
  - Filter false positives
  - Enhance detection accuracy
  - Reduce overall inference time
- Pixel-wise temperature comparison between baseline and maintenance images

#### Processing Pipeline
1. **Image Preprocessing**: Thermal images are normalized and prepared for model input
2. **YOLO Detection**: Deep learning model identifies potential anomaly regions
3. **Computer Vision Refinement**: Thresholding and filtering optimize detection results
4. **Confidence Scoring**: Each detection includes reliability metrics
5. **Automatic Annotation**: Bounding boxes and labels are generated on detected anomalies
6. **Metadata Extraction**: Coordinates, size, severity, and confidence data are captured

### Detection Workflow
```
Maintenance Image + Baseline Image
           ↓
    Image Preprocessing
           ↓
    YOLO Model Inference
           ↓
    Computer Vision Thresholding
           ↓
    Anomaly Refinement & Filtering
           ↓
    Automatic Annotation
           ↓
    Visual Output + Metadata
```

---

## 📦 Dependencies

### Backend
- Spring Boot 3.5.4
- Spring Data JPA
- MySQL Connector
- Spring Security
- Lombok

### Frontend
- React.js
- Vite
- Axios (API communication)
- React Router (navigation)
- TailwindCSS (styling)

### AI/ML Components
- **YOLOv (You Only Look Once)** - Custom-trained deep learning model for anomaly detection
- OpenCV - Computer vision library for image processing and thresholding
- NumPy - Numerical computing for image array operations
- PyTorch/TensorFlow - Deep learning framework for YOLO model
- Image preprocessing and augmentation libraries
- Thermal image analysis utilities

---

## ⚠️ Known Limitations

- **Training Data Dependency**: YOLO model performance depends on the diversity and quality of training data
- **Processing Time**: Large, high-resolution images may require longer processing times despite optimization
- **Threshold Tuning**: Computer vision thresholds may need adjustment for different transformer types or environmental conditions
- **Image Format Support**: Currently optimized for specific thermal image formats
- **Model Generalization**: Detection accuracy may vary for transformer types not well-represented in training data
- **Concurrent Processing**: Multiple simultaneous image analyses may impact performance

---

## 📊 Detection Metadata

The system logs comprehensive metadata for each anomaly detection, including:
- Transformer identification
- Image pair details (baseline and maintenance)
- Detection timestamp
- Anomaly locations (pixel coordinates)
- Severity scores and confidence levels
- Temperature deviation measurements

Logs are stored for retrieval and analysis, supporting future model improvements and feedback integration.

---

## 👥 Contributors

This project was developed as part of a phased transformer inspection management system.

### Development Team
- **Y.L.A. Epa** (210156U) 
- **Y.R.A. Epa** (210157A) 
- **R.M.K.C. Jayathissa** (210258J)
- **L.A.S. Liyanaarachchi** (210341H) 

---

### 🤝 Contributing
We welcome contributions! If you'd like to contribute to this project:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 Support

For issues, questions, or contributions, please refer to the GitHub repository issue tracker.
