package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TransformerRepository extends JpaRepository<Transformer, Long> {
    Optional<Transformer> findByTransformerId(String transformerId);
}
