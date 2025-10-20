package com.university.transformer.oversight.service;

import java.math.BigInteger; // Import BigInteger since it was in the original code, though you might need 'java.lang.Long' for inspectionIds list elements.

/**
 * Interface for the fine-tuning operations.
 * Defines the contract for generating a dataset and orchestrating the
 * machine learning model fine-tuning process.
 */
public interface FineTuningService {

    /**
     * The main method to orchestrate the fine-tuning process:
     * 1. Cleans and sets up dataset directories.
     * 2. Identifies target images (inspections with user feedback).
     * 3. Processes each image to create YOLO format labels and copies the image.
     * 4. Generates the YOLO data.yaml configuration file.
     * 5. Executes the external Python training script.
     *
     * @return The name of the newly trained model file.
     * @throws Exception if any step of the process fails (IO, execution, etc.).
     */
    String generateDatasetAndFineTune() throws Exception;
}