package com.university.transformer.oversight.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    private final String UPLOAD_DIR = "D:/oversight/uploads";

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // allow all endpoints
                .allowedOrigins("http://localhost:3000") // React app
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/files/")
                .addResourceLocations(UPLOAD_DIR);
    }
}
