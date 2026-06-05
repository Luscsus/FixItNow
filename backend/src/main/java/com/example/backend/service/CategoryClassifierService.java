package com.example.backend.service;

import java.util.List;

public interface CategoryClassifierService {
    String classify(String problemText, List<String> categories);
}
