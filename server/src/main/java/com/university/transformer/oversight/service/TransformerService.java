package com.university.transformer.oversight.service;

import com.university.transformer.oversight.model.ThermalImage.EnvironmentalCondition;
import com.university.transformer.oversight.model.ThermalImage.ImageType;
import com.university.transformer.oversight.model.Transformer;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Optional;

public interface TransformerService {
    Transformer saveTransformer(Transformer transformer);
    List<Transformer> findAllTransformers();
    Optional<Transformer> findTransformerById(Long id);
    Optional<Transformer> findByTransformerId(String transformerId);
    Transformer updateTransformer(Long id, Transformer transformerDetails);
    void deleteTransformer(Long id);
    void addImageToTransformer(String transformerId, MultipartFile file, ImageType imageType, EnvironmentalCondition condition, String uploaderId);
}
