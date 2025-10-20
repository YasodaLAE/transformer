# ⚡ Oversight: Transformer Control System

A comprehensive web application designed to manage, track, and analyze inspections of electrical transformers with AI-powered thermal anomaly detection. Both admins and viewers can monitor transformer data, inspection records, and gain automated insights from thermal image analysis.

Test data (5 transformers with baseline and thermal images) are included in the `Test Data` folder.

---

## 📑 Features

### 🔐 Phase 1: Core Management System
- Local authentication to differentiate between regular users and administrators
- Administrators can `view` `add` `edit` `delete` transformers and inspections
- Administrators can `view` `upload` `delete` both thermal and baseline images
- Regular users can view all data but cannot modify it
- Update inspection status (`Pending`, `In Progress`, `Completed`)
- Color-coded status badges (`Pending`: red, `In Progress`: green, `Completed`: blue)
- Search transformers by number, location, and type
- Search inspections by transformer number
- Add inspections directly from the search interface

### 🤖 Phase 2: AI-Powered Anomaly Detection
- AI-based comparison engine that analyzes new maintenance images against baseline images
- Automatic detection of thermal anomalies (temperature spikes, asymmetries, hotspot changes)
- Visual anomaly highlighting with color-coded overlays and markers
- Side-by-side view of baseline and maintenance thermal images
- Zoom, pan (click and drag), and reset controls
- Pixel coordinates, Severity scores, and confidence levels

### ✏️ Phase 3: Interactive Annotation & Feedback Loop

The system now incorporates an **interactive annotation layer** to allow administrators to validate and correct AI-generated detections, creating high-quality ground-truth data for continuous model improvement.

#### Annotation System Description
The anomaly detection view is equipped with intuitive tools enabling users to refine the output of AI model:
- Users can **resize and reposition** existing AI detected anomaly markers.
- Users can **draw new bounding boxes** to mark missed anomalies.
- Users can **delete** incorrectly detected anomaly markers.

All annotation actions are **automatically logged** with detailed metadata, ensuring full data traceability and removing the need for a manual save step.

#### Feedback Integration for Model Improvement
- All user modified annotations are stored alongside the original AI predictions in a dedicated log.
- An administrator control in the dashboard allows triggering a backend process to **convert the complete annotation log into a YOLO-compatible dataset structure** and fine tune the existing model, directly using the human feedback.
- The complete feedback log and individual logs are exportable in **JSON format**, containing Image ID, original AI output, final accepted annotations, and annotator metadata.

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

```
git clone https://github.com/YasodaLAE/transformer
```

2. **Open the cloned project folder in your IDE.**

3. **Open `server/src/main/resources/application.properties` and update the database credentials:**

```
spring.datasource.username=[Add Your MySQL Username Here]
spring.datasource.password=[Add Your MySQL Password Here]
```

4. **Start MySQL server**

Run the following command in a separate terminal and enter your password when prompted:

```
mysql -u root -p
```

5. **Run the application**

6. Execute the main application file `OversightApplication.java`

Backend server will start on `http://localhost:8080`

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

Frontend application will open in your browser on `http://localhost:5173`

---

### 🔑 Login Credentials

Use any of the following `username : password` pairs to access the system:
```
admin : 1
admin2 : 2
admin3 : 3
```
---


## 🤖 YOLO Model Training
### Training Script
The project includes a custom YOLO training script (`yolo.py`) for training the anomaly detection model on thermal transformer images.

#### Model Fine-Tuning with Feedback Data
The mechanism for improvement is the fine-tuning process, which can be triggered by an administrator from the **Dashboard** page.

1. A backend service queries the `Annotations` table to compile all user-modified data.
2. The service processes this data into the standard **YOLO text file structure** (normalized coordinates and class ID).
3. The Python `finetune_yolo.py` script is executed on the server, using the new human validated dataset for fine-tuning the existing model weights.
4. The resulting best model weights are saved, ready to replace the old model for subsequent inference runs.
5. Whenever new fine tuning is done, best model path used in the `detector.py` for detections, is changed, which is given from the backend.
---

## 💾 Backend Structure Used to Persist Annotations

Annotations and their associated feedback metadata are stored in a structured relational database (MySQL) to ensure traceability and queryability.

| Table Name            | Purpose                                                                                                                                           | Key Fields Stored                                                                                                                                                 |
|:----------------------|:--------------------------------------------------------------------------------------------------------------------------------------------------|:------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **`Annotations`**     | Stores the user-approved bounding box data along with the deleted bounding boxes details. This data is what is used in the YOLO training later. | `id`, `inspection_id`, `x`, `y`, `width`, `height`, `comments`, `fault_type`, `annotation_type`, `original_source`, `user_id`, `timestamp`, `ai_confidence`, `ai_severity_score`, `is_deleted` |

The purpose of these fields are as below.

| Field Name          | Purpose                                                                                                                                      |                                                                                                                                                
|:--------------------|:---------------------------------------------------------------------------------------------------------------------------------------------|
| **`id`**            | A unique id for each bounding box                                                                                                            | 
| **`inspection_id`** | The inspection id the bounding box belongs to                                                                                                | 
| **`x`**             | The left and uppermost x coordinate of the bounding box                                                                                      | 
| **`y`**             | The left and uppermost y coordinate of the bounding box                                                                                      | 
| **`width`**             | The width of the bounding box                                                                                                                | 
| **`height`**             | The height of the bounding box                                                                                                               | 
| **`comments`**             | User added comments for a particular bounding box                                                                                            | 
| **`fault_type`**             | Whether the anomaly is Potentially Faulty or Faulty                                                                                          | 
| **`annotation_type`**             | In the very start, Potentially Faulty or Faulty status for the AI detetced anomalies. Later changed to USER_EDITED, USER_DELETED, USER_ADDED | 
| **`original_source`**             | Whether the bounding box was initally added by a user or detected through AI model                                                           | 
| **`user_id`**             | User who did the latest modification to the bounding box                                                                                     | 
| **`timestamp`**             | Latest modification time                                                                                                                     | 
| **`ai_confidence`**             | If the bounding box is AI detected, the confidence score                                                                                     | 
| **`ai_severity_score`**             | If the bounding box is AI detected, the severity score                                                                                       | 
| **`is_deleted`**             | If the bounding box is deleted or not                                                                                                        | 

---

## 🎯 AI Detection Approach
### Anomaly Detection Logic
Our system employs a hybrid approach combining deep learning and computer vision techniques:

#### Deep Learning Component (YOLO Model)
- Custom-trained YOLOv model for real-time anomaly detection and automatic annotation
- Provides accurate bounding boxes and confidence scores for detected anomalies

#### Computer Vision Optimization
- Advanced thresholding techniques applied post detection to:
    - Filter false positives
    - Enhance detection accuracy
    - Reduce overall inference time
- Pixel-wise temperature comparison between baseline and maintenance images

#### Processing Pipeline
1. *Image Preprocessing*: Thermal images are normalized and prepared for model input
2. *YOLO Detection*: Deep learning model identifies potential anomaly regions
3. *Computer Vision Refinement*: Thresholding and filtering optimize detection results
4. *Confidence Scoring*: Each detection includes reliability metrics
5. *Automatic Annotation*: Bounding boxes and labels are generated on detected anomalies
6. *Metadata Extraction*: Coordinates, size, severity, and confidence data are captured

---

## ⚠️ Known Bugs or Limitations

- YOLO model performance depends on the diversity and quality of training data
-  Large, high-resolution images may require longer processing times despite optimization
- Computer vision thresholds may need adjustment for different transformer types or environmental conditions
- Detection accuracy may vary for transformer types not well-represented in training data

---

## 📊 Detection Metadata
The system logs comprehensive metadata for each anomaly detection, including:
- Transformer identification
- Image pair details (baseline and maintenance)
- Detection timestamp
- Anomaly locations (pixel coordinates)
- Severity scores and confidence levels
- Annotator ID, Action Type, and Annotation Timestamp (for user modifications)


---

## Contributors

- **Y.L.A. Epa** (210156U)
- **Y.R.A. Epa** (210157A)
- **R.M.K.C. Jayathissa** (210258J)
- **L.A.S. Liyanaarachchi** (210341H)

---
