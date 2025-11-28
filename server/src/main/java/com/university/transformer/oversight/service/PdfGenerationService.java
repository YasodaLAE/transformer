package com.university.transformer.oversight.service;

import com.lowagie.text.DocumentException;
import com.university.transformer.oversight.dto.MaintenanceRecordDTO;
import java.io.IOException;

public interface PdfGenerationService {
    byte[] generateMaintenancePdf(MaintenanceRecordDTO record) throws DocumentException, IOException;
}