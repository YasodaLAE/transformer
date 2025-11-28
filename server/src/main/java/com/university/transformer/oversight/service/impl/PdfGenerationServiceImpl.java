package com.university.transformer.oversight.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.university.transformer.oversight.dto.MaintenanceRecordDTO;
import com.university.transformer.oversight.service.AnomalyDetectionService;
import com.university.transformer.oversight.service.FileStorageService;
import com.university.transformer.oversight.service.PdfGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.format.DateTimeFormatter;

@Service
public class PdfGenerationServiceImpl implements PdfGenerationService {

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private AnomalyDetectionService anomalyDetectionService;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMAT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    public byte[] generateMaintenancePdf(MaintenanceRecordDTO record) throws DocumentException, IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, out);

        document.open();

        // 1. Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLUE);
        Paragraph title = new Paragraph("Transformer Maintenance Record", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        // 2. General Information Table
        PdfPTable infoTable = new PdfPTable(4);
        infoTable.setWidthPercentage(100);
        infoTable.setSpacingAfter(10);

        addTableHeader(infoTable, "General Information", 4);

        addCell(infoTable, "Transformer ID:", true);
        addCell(infoTable, record.getTransformerId());
        addCell(infoTable, "Region:", true);
        addCell(infoTable, record.getRegion());

        addCell(infoTable, "Pole ID:", true);
        addCell(infoTable, record.getPoleId());
        addCell(infoTable, "Capacity:", true);
        addCell(infoTable, record.getCapacity());

        addCell(infoTable, "Inspection No:", true);
        addCell(infoTable, record.getInspectionNo());
        addCell(infoTable, "Status:", true);
        addCell(infoTable, record.getInspectionStatus());

        addCell(infoTable, "Insp. Date:", true);
        addCell(infoTable, record.getInspectionDate() != null ? record.getInspectionDate().format(DATE_TIME_FORMAT) : "N/A");
        addCell(infoTable, "Maint. Date:", true);
        addCell(infoTable, record.getMaintenanceDate() != null ? record.getMaintenanceDate().format(DATE_TIME_FORMAT) : "N/A");

        document.add(infoTable);

        // 3. Engineer Information Table
        PdfPTable engTable = new PdfPTable(4);
        engTable.setWidthPercentage(100);
        engTable.setSpacingAfter(10);

        addTableHeader(engTable, "Engineer Records", 4);

        addCell(engTable, "Inspector Name:", true);
        addCell(engTable, record.getInspectorName());

        // Empty cell to balance layout or merge
        addCell(engTable, "", true);
        addCell(engTable, "");

        addCell(engTable, "Record Date:", true);
        addCell(engTable, record.getInspectionEngineerDate() != null ? record.getInspectionEngineerDate().format(DATE_FORMAT) : "");

        addCell(engTable, "Record Time:", true);
        addCell(engTable, record.getInspectionEngineerTime() != null ? record.getInspectionEngineerTime().format(TIME_FORMAT) : "");

        document.add(engTable);

        // 4. Readings Table
        PdfPTable readTable = new PdfPTable(4);
        readTable.setWidthPercentage(100);
        readTable.setSpacingAfter(10);

        addTableHeader(readTable, "Electrical & Oil Readings", 4);

        addCell(readTable, "Voltage L1:", true); addCell(readTable, record.getVoltageL1());
        addCell(readTable, "Current L1:", true); addCell(readTable, record.getCurrentL1());

        addCell(readTable, "Voltage L2:", true); addCell(readTable, record.getVoltageL2());
        addCell(readTable, "Current L2:", true); addCell(readTable, record.getCurrentL2());

        addCell(readTable, "Voltage L3:", true); addCell(readTable, record.getVoltageL3());
        addCell(readTable, "Current L3:", true); addCell(readTable, record.getCurrentL3());

        addCell(readTable, "Oil Level:", true); addCell(readTable, record.getOilLevel());
        addCell(readTable, "Oil Temp:", true); addCell(readTable, record.getOilTemperature());

        document.add(readTable);

        // 5. Status & Remarks Table
        PdfPTable statusTable = new PdfPTable(2);
        statusTable.setWidthPercentage(100);
        statusTable.setSpacingAfter(10);

        addTableHeader(statusTable, "Conclusion", 2);
        addCell(statusTable, "Trans. Status:", true); addCell(statusTable, record.getTransformerStatus());
        addCell(statusTable, "Rec. Action:", true); addCell(statusTable, record.getRecommendedAction());

        addCell(statusTable, "Corrective Actions:", true);
        addCell(statusTable, record.getCorrectiveAction());

        addCell(statusTable, "Remarks:", true);
        addCell(statusTable, record.getComments());

        document.add(statusTable);

        // 6. Detected Anomalies Table (Updated with Numbering)
        if (record.getAnomalyDetails() != null && !record.getAnomalyDetails().isEmpty()) {
            // Change columns from 4 to 5
            PdfPTable anomalyTable = new PdfPTable(5);
            // Set relative widths (smaller for #, larger for others)
            try {
                anomalyTable.setWidths(new float[]{1f, 2f, 2f, 2f, 3f});
            } catch (DocumentException e) {
                e.printStackTrace();
            }
            anomalyTable.setWidthPercentage(100);
            anomalyTable.setSpacingAfter(10);

            addTableHeader(anomalyTable, "Detected Anomalies", 5);

            // Headers
            addCell(anomalyTable, "#", true); // New Header
            addCell(anomalyTable, "Type", true);
            addCell(anomalyTable, "Severity", true);
            addCell(anomalyTable, "Confidence", true);
            addCell(anomalyTable, "Source", true);

            // Rows
            int count = 1;
            for (MaintenanceRecordDTO.AnomalySimpleDTO anomaly : record.getAnomalyDetails()) {
                addCell(anomalyTable, String.valueOf(count++)); // New Numbering Cell

                addCell(anomalyTable, anomaly.getType());

                String sev = anomaly.getSeverity() != null ? String.valueOf(anomaly.getSeverity()) : "Manual";
                addCell(anomalyTable, sev);

                String conf = anomaly.getConfidence() != null ? String.format("%.1f%%", anomaly.getConfidence() * 100) : "Manual";
                addCell(anomalyTable, conf);

                String sourceText = "AI Detected";
                if ("USER".equalsIgnoreCase(anomaly.getSource())) {
                    String user = anomaly.getUserId() != null ? anomaly.getUserId() : "User";
                    sourceText = "Added by " + user;
                }
                addCell(anomalyTable, sourceText);
            }
            document.add(anomalyTable);
        } else {
            Paragraph noAnomalies = new Paragraph("No anomalies detected.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10));
            noAnomalies.setSpacingAfter(10);
            document.add(noAnomalies);
        }

        // 7. Thermal Image (Annotated)
        try {
            Image img = null;

            try {
                if (record.getInspectionId() != null) {
                    Resource annotatedResource = anomalyDetectionService.drawUserAnnotationsOnImage(record.getInspectionId());
                    if (annotatedResource.exists()) {
                        img = Image.getInstance(annotatedResource.getFile().getAbsolutePath());
                    }
                }
            } catch (Exception ignored) {
            }

            if (img == null && record.getThermalImageFileName() != null) {
                Path imagePath = fileStorageService.getRootLocation().resolve(record.getThermalImageFileName());
                if (Files.exists(imagePath)) {
                    img = Image.getInstance(imagePath.toAbsolutePath().toString());
                }
            }

            if (img != null) {
                float scaler = ((document.getPageSize().getWidth() - document.leftMargin() - document.rightMargin()) / img.getWidth()) * 100;
                img.scalePercent(scaler);

                img.setAlignment(Element.ALIGN_CENTER);
                img.setSpacingBefore(20);
                document.add(img);

                Paragraph caption = new Paragraph("Thermal Image Reference (Annotated)", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10));
                caption.setAlignment(Element.ALIGN_CENTER);
                document.add(caption);
            }

        } catch (Exception e) {
            document.add(new Paragraph("Error loading thermal image: " + e.getMessage()));
        }

        document.close();
        return out.toByteArray();
    }

    // Helper Methods
    private void addTableHeader(PdfPTable table, String headerTitle, int colspan) {
        PdfPCell header = new PdfPCell();
        header.setBackgroundColor(Color.LIGHT_GRAY);
        header.setColspan(colspan);
        header.setPhrase(new Phrase(headerTitle, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
        header.setPadding(5);
        table.addCell(header);
    }

    private void addCell(PdfPTable table, String text, boolean isBold) {
        PdfPCell cell = new PdfPCell();
        Font font = isBold ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10) : FontFactory.getFont(FontFactory.HELVETICA, 10);
        cell.setPhrase(new Phrase(text == null ? "" : text, font));
        cell.setPadding(4);
        table.addCell(cell);
    }

    private void addCell(PdfPTable table, String text) {
        addCell(table, text, false);
    }
}