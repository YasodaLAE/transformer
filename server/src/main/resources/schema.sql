-- schema.sql (replace thermal_image DDL)
DROP TABLE IF EXISTS thermal_image;
DROP TABLE IF EXISTS inspection;
DROP TABLE IF EXISTS transformer;

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

CREATE TABLE inspection (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  inspection_no VARCHAR(255),
  inspected_date DATETIME,
  maintenance_date DATETIME,
  status VARCHAR(255),
  transformer_id BIGINT,
  inspected_by VARCHAR(255),
  FOREIGN KEY (transformer_id) REFERENCES transformer(id) ON DELETE CASCADE
);

CREATE TABLE thermal_image (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  environmental_condition ENUM('CLOUDY','RAINY','SUNNY'),
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  image_type ENUM('BASELINE','MAINTENANCE'),
  upload_timestamp DATETIME(6),
  uploader_id VARCHAR(255),
  transformer_id BIGINT,
  FOREIGN KEY (transformer_id) REFERENCES transformer(id) ON DELETE CASCADE
);
