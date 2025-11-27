package com.university.transformer.oversight.service;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import java.nio.file.Path;
import java.util.stream.Stream;

public interface FileStorageService {
    void init();
    String store(MultipartFile file);
    Resource loadAsResource(String filename);
    void deleteAll();
    Stream<Path> loadAll();
    Path getRootLocation();
    void delete(String filename);
}
