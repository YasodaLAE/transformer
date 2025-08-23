-- src/main/resources/data.sql

-- Insert 5 sample transformers
INSERT INTO transformer (id, transformer_id, pole_id, region, transformer_type, details, capacity, no_of_feeders) VALUES
(1, 'AZ-8890', 'EN-122A', 'Nugegoda', 'Bulk', 'Im detail 1', '1000 kVA', 3),
(2, 'AZ-1649', 'EN-123A', 'Nugegoda', 'Bulk', 'Im detail 2', '1500 kVA', 4),
(3, 'AZ-7316', 'EN-123A', 'Maharagama', 'Distribution', 'Im detail 3', '500 kVA', 2),
(4, 'AZ-4613', 'EN-123B', 'Maharagama', 'Bulk', 'Im detail 4', '2000 kVA', 5),
(5, 'AX-8993', 'EN-122B', 'Kottawa', 'Distribution', 'Im detail 5', '750 kVA', 3);

-- Assuming your transformers have IDs 1 through 5
INSERT INTO inspection (id, inspection_no, inspected_date, maintenance_date, status, transformer_id)
VALUES
(1, '000123589', '2025-07-02', '2025-08-02', 'In Progress', 2),
(2, '000123590', '2025-07-01', NULL, 'In Progress', 1),
(3, '000123591', '2025-06-13', NULL, 'Pending', 3),
(4, '000123592', '2025-06-06', '2025-08-08', 'Completed', 4),
(5, '000123593', '2025-04-25', '2025-08-08', 'Completed', 5);

-- Insert sample thermal images
INSERT INTO thermal_image (image_url, pole_id, transformer_id)
VALUES
('/path/to/image1.jpg','EN-122A', 1),
('/path/to/image2.jpg','EN-123A', 2);