package com.example.backend.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ClassifyRequest {

    @NotBlank
    @Size(max = 500)
    private String problemText;

    @NotEmpty
    private List<String> categories;
}
