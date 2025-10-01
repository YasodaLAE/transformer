DROP TABLE IF EXISTS anomaly_detection_result;
DROP TABLE IF EXISTS thermal_image;
DROP TABLE IF EXISTS inspection;
-- Parent table last
DROP TABLE IF EXISTS transformer;

-- Recreate the parent table
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

-- Recreate the inspection table with a foreign key to the transformer table
CREATE TABLE inspection (
 id BIGINT AUTO_INCREMENT PRIMARY KEY,
 inspection_no VARCHAR(255),
 inspected_date DATE,
 maintenance_date DATE,
 status VARCHAR(255),
 transformer_id BIGINT,
 inspected_by VARCHAR(255),
 FOREIGN KEY (transformer_id) REFERENCES transformer(id) ON DELETE CASCADE
);

-- Recreate the thermal_image table
CREATE TABLE thermal_image (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  environmental_condition enum('CLOUDY','RAINY','SUNNY'),
  file_name varchar(255),
  file_path varchar(255),
  image_type enum('BASELINE','MAINTENANCE'),
  upload_timestamp datetime(6),
  uploader_id varchar(255),
  inspection_id BIGINT NOT NULL, -- <-- ADDED THIS COLUMN
  FOREIGN KEY (inspection_id) REFERENCES inspection(id) ON DELETE CASCADE
);

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