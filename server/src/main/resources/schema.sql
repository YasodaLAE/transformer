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

-- Recreate the thermal_image table with a foreign key to the transformer table
CREATE TABLE thermal_image (
  id BIGINT AUTO_INCREMENT PRIMARY KEY
);