// AnomalyFeedbackRepository.java

package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.AnomalyFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnomalyFeedbackRepository extends JpaRepository<AnomalyFeedback, Long> {
    //export all feedback later
}