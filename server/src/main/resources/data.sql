-- Insert 5 sample transformers
INSERT INTO TRANSFORMER (id, transformer_id, pole_id, region, transformer_type) VALUES
(1, 'AZ-8890', 'EN-122A', 'Nugegoda', 'Bulk'),
(2, 'AZ-1649', 'EN-123A', 'Nugegoda', 'Bulk'),
(3, 'AZ-7316', 'EN-123A', 'Maharagama', 'Distribution'),
(4, 'AZ-4613', 'EN-123B', 'Maharagama', 'Bulk'),
(5, 'AX-8993', 'EN-122B', 'Kottawa', 'Distribution');

-- Assuming your transformers have IDs 1 through 5
INSERT INTO inspection (inspection_no, inspected_date, maintenance_date, status, transformer_id)
VALUES
('000123589', '2025-07-02', '2025-08-02', 'In Progress', 2),
('000123590', '2025-07-01', NULL, 'In Progress', 1),
('000123591', '2025-06-13', NULL, 'Pending', 3),
('000123592', '2025-06-06', '2025-08-08', 'Completed', 4),
('000123593', '2025-04-25', '2025-08-08', 'Completed',5);

INSERT INTO thermal_image (image_url, pole_id, transformer_id)
VALUES
('/path/to/image1.jpg','uploader1', 1), -- Transformer 1 exists
('/path/to/image2.jpg','uploader2', 2); -- Transformer 2 exists