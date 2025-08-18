-- src/main/resources/schema.sql

-- Drop the child table first to remove the foreign key constraint
DROP TABLE IF EXISTS thermal_image;

-- Now, you can safely drop the parent table
DROP TABLE IF EXISTS TRANSFORMER;

-- Recreate the parent table
CREATE TABLE TRANSFORMER (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    transformer_id VARCHAR(255),
    pole_id VARCHAR(255),
    region VARCHAR(255),
    type DOUBLE
);

-- Recreate the child table with the foreign key
CREATE TABLE thermal_image (
    -- Define columns for the thermal_image table
    id BIGINT PRIMARY KEY,
    image_url VARCHAR(255),
    -- And the foreign key that references the TRANSFORMER table
    transformer_id BIGINT,
    pole_id BIGINT,
    FOREIGN KEY (transformer_id) REFERENCES TRANSFORMER(id)
);