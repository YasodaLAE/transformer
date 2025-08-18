-- src/main/resources/schema.sql

-- Drop the child table first to remove the foreign key constraint
DROP TABLE IF EXISTS thermal_image;

-- Now, you can safely drop the parent table
DROP TABLE IF EXISTS TRANSFORMER;

-- Recreate the parent table
CREATE TABLE TRANSFORMER (
    id BIGINT PRIMARY KEY,
    transformer_id VARCHAR(255),
    location VARCHAR(255),
    capacity DOUBLE
);

-- Recreate the child table with the foreign key
CREATE TABLE thermal_image (
    -- Define columns for the thermal_image table
    id BIGINT PRIMARY KEY,
    image_url VARCHAR(255),
    -- And the foreign key that references the TRANSFORMER table
    transformer_id BIGINT,
    FOREIGN KEY (transformer_id) REFERENCES TRANSFORMER(id)
);