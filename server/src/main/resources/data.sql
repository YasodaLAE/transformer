-- src/main/resources/data.sql

-- Insert 5 sample transformers
INSERT INTO `transformer` VALUES (1,'AZ-8890','EN-122A','Nugegoda','Bulk','Im detail 1','Cloudy','baseline_1_1756026735344baseline1.jpg','2025-08-24 09:12:16','admin','1000','3'),(2,'AZ-1649','EN-123A','Nugegoda','Bulk','Im detail 2','Sunny','baseline_2_1756026773359baseline2.png','2025-08-24 09:12:54','admin2','1500','4'),(3,'AZ-7316','EN-123A','Maharagama','Distribution','Im detail 3',NULL,NULL,NULL,NULL,'500','2'),(4,'AZ-4613','EN-123B','Maharagama','Bulk','Im detail 4','Sunny','baseline_4_1756026839846baseline4.jpg','2025-08-24 09:14:00','admin3','2000','5'),(5,'AX-8993','EN-122B','Kottawa','Distribution','Im detail 5','Cloudy','baseline_5_1756026873416baseline5.png','2025-08-24 09:14:33','admin','750','3');

--  transformers have IDs 1 through 5
INSERT INTO inspection (id, inspection_no, inspected_date, maintenance_date, status, transformer_id, inspected_by)
VALUES
(1, '000123589', '2025-07-02', '2025-08-02', 'In Progress', 2, 'admin'),
(2, '000123590', '2025-07-01', NULL, 'In Progress', 1, 'admin2'),
(3, '000123591', '2025-06-13', NULL, 'Pending', 3, 'admin3'),
(4, '000123592', '2025-06-06', '2025-08-08', 'Completed', 4, 'admin'),
(5, '000123593', '2025-04-25', '2025-08-08', 'Completed', 5, 'admin2');

-- Insert sample thermal images
INSERT INTO `thermal_image` VALUES (1,'RAINY','81bc595a-8e5e-4c2c-9f88-b32b0cb615a2_maintenance1.jpg','uploads\\81bc595a-8e5e-4c2c-9f88-b32b0cb615a2_maintenance1.jpg','MAINTENANCE','2025-08-24 14:42:29.545414','admin',2),(2,'CLOUDY','e38cc5df-662d-462b-b752-90e4faad64ea_maintenance2.jpg','uploads\\e38cc5df-662d-462b-b752-90e4faad64ea_maintenance2.jpg','MAINTENANCE','2025-08-24 14:43:03.082611','admin2',1),(4,'RAINY','482c03ad-6d5e-4dea-9d3a-470f43447404_maintenance4.jpg','uploads\\482c03ad-6d5e-4dea-9d3a-470f43447404_maintenance4.jpg','MAINTENANCE','2025-08-24 14:44:09.069790','admin3',4);
