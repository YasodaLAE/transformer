-- =================================================================
--  DROP TABLES (Children First, Then Parents)
-- =================================================================
-- These tables depend on 'inspection', so they must be dropped first.
DROP TABLE IF EXISTS annotation_logs;
DROP TABLE IF EXISTS annotations;             -- <-- NEW DEPENDENCY
DROP TABLE IF EXISTS anomaly_detection_result;
DROP TABLE IF EXISTS anomaly;

DROP TABLE IF EXISTS thermal_image;
-- (Include any other child tables, like 'file_data', etc.)

-- 2. Drop the parent table
DROP TABLE IF EXISTS inspection;

-- 3. Continue with the rest of the tables
DROP TABLE IF EXISTS transformer;


-- =================================================================
--  CREATE TABLES (Parents First, Then Children)
-- =================================================================

-- 1. Create 'transformer' table (Parent)
CREATE TABLE transformer (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  transformer_id VARCHAR(255),
  pole_id VARCHAR(255),
  region VARCHAR(255),
  transformer_type VARCHAR(255),
  details VARCHAR(255),
  baseline_image_condition VARCHAR(255),
  baseline_image_name VARCHAR(255),
  baseline_image_upload_timestamp TIMESTAMP,
  baseline_image_uploader VARCHAR(255),
  capacity VARCHAR(255),
  no_of_feeders INT
);

-- 2. Create 'inspection' table (Child of 'transformer')
CREATE TABLE inspection (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  inspection_no VARCHAR(255),
  inspected_date DATETIME,
  maintenance_date DATETIME,
  status VARCHAR(255),
  transformer_id BIGINT,
  inspected_by VARCHAR(255),
  notes TEXT,
  FOREIGN KEY (transformer_id) REFERENCES transformer(id) ON DELETE CASCADE
);

-- 3. Create tables that depend on 'inspection' (Children of 'inspection')
CREATE TABLE thermal_image (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    environmental_condition ENUM('CLOUDY','RAINY','SUNNY'),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    image_type ENUM('BASELINE','MAINTENANCE') NOT NULL,
    upload_timestamp DATETIME(6),
    uploader_id VARCHAR(255),
    inspection_id BIGINT,
    FOREIGN KEY (inspection_id) REFERENCES inspection(id) ON DELETE CASCADE
);

CREATE TABLE anomaly_detection_result (
  id BIGINT NOT NULL AUTO_INCREMENT,
  detected_timestamp DATETIME(6) DEFAULT NULL,
  detection_json_output TEXT,
  output_image_name VARCHAR(255) DEFAULT NULL,
  overall_status VARCHAR(255) DEFAULT NULL,
  inspection_id BIGINT DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY UK_inspection_id (inspection_id),
  CONSTRAINT FK_anomaly_to_inspection FOREIGN KEY (inspection_id) REFERENCES inspection(id)
);

CREATE TABLE annotations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inspection_id BIGINT NOT NULL,
    x DOUBLE NOT NULL,
    y DOUBLE NOT NULL,
    width DOUBLE NOT NULL,
    height DOUBLE NOT NULL,
    comments TEXT,

    -- Fields for tracking the action and user
    annotation_type VARCHAR(255) NOT NULL, -- Will store: 'INITIAL_AI', 'USER_ADDED', 'USER_VALIDATED', 'USER_DELETED'
    original_source VARCHAR(255) NOT NULL DEFAULT 'AI',
    user_id VARCHAR(255),
    timestamp DATETIME,
    ai_confidence DOUBLE,
    ai_severity_score INT,
    -- NEW: Soft Delete Flag
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (inspection_id) REFERENCES inspection(id) ON DELETE CASCADE
);