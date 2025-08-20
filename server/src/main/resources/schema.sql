-- src/main/resources/schema.sql

-- Drop the child table first to remove the foreign key constraint
DROP TABLE IF EXISTS thermal_image;
DROP TABLE IF EXISTS inspection; -- This table references 'transformer', so it must be dropped before it

-- Step 2: Now, you can safely drop the parent table
DROP TABLE IF EXISTS TRANSFORMER;

-- Recreate the parent table
CREATE TABLE TRANSFORMER (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transformer_id VARCHAR(255),
    pole_id VARCHAR(255),
    region VARCHAR(255),
    transformer_type VARCHAR(255),
    details VARCHAR(255),
    baseline_image_condition VARCHAR(255),
    baseline_image_name VARCHAR(255),
    baseline_image_upload_timestamp TIMESTAMP,
    baseline_image_uploader VARCHAR(255)
);

CREATE TABLE inspection (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inspection_no VARCHAR(255),
    inspected_date DATE,
    maintenance_date DATE,
    status VARCHAR(255),
    transformer_id BIGINT,
    FOREIGN KEY (transformer_id) REFERENCES transformer(id)
);

-- Recreate the child table with the foreign key
CREATE TABLE thermal_image (
    -- Define columns for the thermal_image table
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_url VARCHAR(255),
    -- And the foreign key that references the TRANSFORMER table
    transformer_id BIGINT,
    pole_id VARCHAR(255),
    FOREIGN KEY (transformer_id) REFERENCES TRANSFORMER(id)
);