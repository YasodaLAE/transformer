package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.model.Annotation;
import com.university.transformer.oversight.model.ThermalImage;
import com.university.transformer.oversight.repository.AnnotationRepository;
import com.university.transformer.oversight.repository.ThermalImageRepository;
import com.university.transformer.oversight.service.FineTuningService;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class FineTuningServiceImpl implements FineTuningService {
    private static final Logger logger = LoggerFactory.getLogger(FineTuningServiceImpl.class);

    @Value("${ml.image.upload-dir}")
    private String imageUploadDir;

    @Value("${ml.dataset-dir}")
    private String datasetDir;

    @Value("${ml.model-output-dir}")
    private String modelOutputDir;

    @Value("${ml.training-script-path}")
    private String trainingScriptPath;

    private static final String INITIAL_MODEL_PATH = "server/src/main/resources/best.pt";

    // Yolo Class Mapping
    private static final String FAULTY_CLASS_ID = "1";
    private static final String POTENTIALLY_FAULTY_CLASS_ID = "0";

    private final EntityManager entityManager;
    private final AnnotationRepository annotationRepository;
    private final ThermalImageRepository thermalImageRepository;

    public FineTuningServiceImpl(EntityManager entityManager,
                                 AnnotationRepository annotationRepository,
                                 ThermalImageRepository thermalImageRepository) {
        this.entityManager = entityManager;
        this.annotationRepository = annotationRepository;
        this.thermalImageRepository = thermalImageRepository;
    }

    /**
     * Helper to get image dimensions.
     */
    private int[] getImageDimensions(Path imagePath) throws IOException {
        BufferedImage image = ImageIO.read(imagePath.toFile());
        if (image == null) {
            throw new IOException("Could not read image or image format is unsupported: " + imagePath);
        }
        return new int[]{image.getWidth(), image.getHeight()};
    }

    /**
     * Generates the content for the YOLO data.yaml file.
     */
    private String generateYoloYaml(String datasetPath) {
        return String.format(
                "path: %s\n" +
                        "train: images\n" +
                        "val: images\n" +
                        "\n" +
                        "# Classes\n" +
                        "nc: 2\n" +
                        "names: ['potentially_faulty', 'faulty']\n",
                datasetPath.replace('\\', '/')
        );
    }

    @Override
    @Transactional
    public String generateDatasetAndFineTune() throws Exception {
        logger.info("Starting fine-tuning process...");

        Path datasetRoot = Paths.get(datasetDir).toAbsolutePath();
        Path imagesDir = datasetRoot.resolve("images");
        Path labelsDir = datasetRoot.resolve("labels");

        // Setup Dataset Directories
        Files.createDirectories(imagesDir);
        Files.createDirectories(labelsDir);
        // Delete all previous content to ensure a fresh dataset
        Files.walk(imagesDir).skip(1).map(Path::toFile).forEach(File::delete);
        Files.walk(labelsDir).skip(1).map(Path::toFile).forEach(File::delete);

        // Identify Target Images
        // Find inspection_ids that have at least one USER_ADDED or USER_EDITED annotation.
        String sql = "SELECT DISTINCT inspection_id FROM annotations " +
                "WHERE annotation_type IN ('USER_ADDED', 'USER_EDITED') AND is_deleted = FALSE";

        @SuppressWarnings("unchecked")
        List<BigInteger> inspectionIds = entityManager.createNativeQuery(sql)
                .getResultList();

        if (inspectionIds.isEmpty()) {
            throw new RuntimeException("No images with user-modified annotations found to fine-tune.");
        }

        // Process each inspection
        for (Object idObject : inspectionIds) {

            Long inspectionId = ((Number) idObject).longValue();

            // Get the Maintenance ThermalImage
            ThermalImage maintenanceImage = thermalImageRepository.findByInspectionIdAndImageType(
                    inspectionId, ThermalImage.ImageType.MAINTENANCE);

            if (maintenanceImage == null) {
                logger.warn("No MAINTENANCE image found for inspection_id: {}", inspectionId);
                continue;
            }

            Path sourceImagePath = Paths.get(imageUploadDir, maintenanceImage.getFileName());

            if (!Files.exists(sourceImagePath)) {
                logger.error("Image file not found at path: {}", sourceImagePath);
                continue;
            }

            //Get Image Dimensions
            int[] dimensions = getImageDimensions(sourceImagePath);
            double imgWidth = dimensions[0];
            double imgHeight = dimensions[1];

            // Copy Image to Dataset/images
            String newImageName = "insp_" + inspectionId + "_" + maintenanceImage.getFileName();
            Path destinationImagePath = imagesDir.resolve(newImageName);
            Files.copy(sourceImagePath, destinationImagePath);

            // Get All Annotations for this inspection, excluding soft deleted
            List<Annotation> annotations = annotationRepository
                    .findByInspectionIdAndIsDeletedFalse(inspectionId);

            // Generate YOLO Label File
            Path labelFilePath = labelsDir.resolve(
                    newImageName.substring(0, newImageName.lastIndexOf('.')) + ".txt");

            try (BufferedWriter writer = Files.newBufferedWriter(labelFilePath)) {
                for (Annotation ann : annotations) {

                    // Center coordinates (from top-left corner)
                    double x_center = ann.getX() + ann.getWidth() / 2.0;
                    double y_center = ann.getY() + ann.getHeight() / 2.0;

                    // Normalized coordinates
                    double x_center_norm = x_center / imgWidth;
                    double y_center_norm = y_center / imgHeight;
                    double width_norm = ann.getWidth() / imgWidth;
                    double height_norm = ann.getHeight() / imgHeight;

                    // Map fault_type to class_id
                    String classId = ann.getFaultType() != null && ann.getFaultType().equalsIgnoreCase("Faulty")
                            ? FAULTY_CLASS_ID
                            : POTENTIALLY_FAULTY_CLASS_ID; // Default to 0 for potentially faulty

                    String yoloLine = String.format(
                            "%s %.6f %.6f %.6f %.6f",
                            classId, x_center_norm, y_center_norm, width_norm, height_norm);

                    writer.write(yoloLine);
                    writer.newLine();
                }
            }
        }

        logger.info("Dataset generation complete. Total images: {}", inspectionIds.size());

        // Generate data.yaml for YOLO
        String yamlContent = generateYoloYaml(datasetRoot.toAbsolutePath().toString());
        Path dataYamlPath = datasetRoot.resolve("data.yaml");
        Files.writeString(dataYamlPath, yamlContent);

        // Execute Python Training Script
        String newModelName = "ft_model_" + System.currentTimeMillis() + ".pt";
        Path outputModelPath = Paths.get(modelOutputDir, newModelName).toAbsolutePath();
        Path scriptPath = Paths.get(trainingScriptPath).toAbsolutePath();

        String initialModelPath = Paths.get(INITIAL_MODEL_PATH).toAbsolutePath().toString();

        ProcessBuilder pb = new ProcessBuilder(
                "python",
                scriptPath.toString(),
                "--data_yaml", dataYamlPath.toString(),
                "--initial_model", initialModelPath,
                "--output_path", outputModelPath.toString()
        );

        Process process = pb.start();

        // Capture output for logging/debugging
        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));

        String line;
        while ((line = reader.readLine()) != null) {
            logger.info("[Python STDOUT]: {}", line);
        }
        while ((line = errorReader.readLine()) != null) {
            logger.error("[Python STDERR]: {}", line);
        }

        // Wait for the process to complete
        boolean finished = process.waitFor(30, TimeUnit.MINUTES);

        if (!finished || process.exitValue() != 0) {
            throw new RuntimeException("YOLO fine-tuning failed or timed out. Check server logs for Python errors.");
        }
        AnomalyDetectionServiceImpl.setCurrentProductionModelName(newModelName);

        logger.info("Fine-tuning successful. New model saved to: {}", outputModelPath);
        return newModelName;
    }
}