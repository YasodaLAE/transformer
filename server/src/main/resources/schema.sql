DROP TABLE IF EXISTS anomaly_detection_result;
-- schema.sql (replace thermal_image DDL)
DROP TABLE IF EXISTS thermal_image;
DROP TABLE IF EXISTS inspection;
DROP TABLE IF EXISTS transformer;

-- (The CREATE TABLE transformer block remains unchanged)
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

-- (The CREATE TABLE inspection block is updated with NOTES)
CREATE TABLE inspection (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  inspection_no VARCHAR(255),
  inspected_date DATETIME,
  maintenance_date DATETIME,
  status VARCHAR(255),
  transformer_id BIGINT,
  inspected_by VARCHAR(255),
  notes TEXT,  -- <--- ADDED THE NOTES COLUMN
  FOREIGN KEY (transformer_id) REFERENCES transformer(id) ON DELETE CASCADE
);

-- ******************************************************
-- ** CORRECTED thermal_image TABLE (Unchanged) **
-- ******************************************************
CREATE TABLE thermal_image (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    -- Columns combined from both versions:
    environmental_condition ENUM('CLOUDY','RAINY','SUNNY'),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    image_type ENUM('BASELINE','MAINTENANCE') NOT NULL,
    upload_timestamp DATETIME(6),
    uploader_id VARCHAR(255),

    -- The Foreign Key now correctly links to Inspection (from the merged code)
    inspection_id BIGINT NOT NULL,
    FOREIGN KEY (inspection_id) REFERENCES inspection(id) ON DELETE CASCADE
);

-- (The CREATE TABLE anomaly_detection_result block remains unchanged)
CREATE TABLE `anomaly_detection_result` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `detected_timestamp` datetime(6) DEFAULT NULL,
  `detection_json_output` text,
  `output_image_name` varchar(255) DEFAULT NULL,
  `overall_status` varchar(255) DEFAULT NULL,
  `inspection_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK9powin3ux3oslbcuoguifhqro` (`inspection_id`),
  CONSTRAINT `FK87o85w504j1em42s76se41nc7` FOREIGN KEY (`inspection_id`) REFERENCES `inspection` (`id`)
);