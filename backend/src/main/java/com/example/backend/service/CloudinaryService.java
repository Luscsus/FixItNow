package com.example.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.backend.common.exception.ApiException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.Set;

@Service
@Slf4j
public class CloudinaryService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    private static final Set<String> ALLOWED_CHAT_FILE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    private static final long MAX_CHAT_FILE_BYTES = 10L * 1024 * 1024;

    // Magic byte signatures
    private static final byte[] JPEG_MAGIC = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] WEBP_RIFF = {0x52, 0x49, 0x46, 0x46}; // "RIFF"
    private static final byte[] WEBP_WEBP = {0x57, 0x45, 0x42, 0x50}; // "WEBP"

    private final Cloudinary cloudinary;
    private final long maxFileSizeBytes;

    public CloudinaryService(Cloudinary cloudinary,
                             @Value("${cloudinary.max-file-size-mb:5}") long maxFileSizeMb) {
        this.cloudinary = cloudinary;
        this.maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
    }

    public String uploadFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) throw new ApiException("No file provided.");
        if (file.getSize() > MAX_CHAT_FILE_BYTES) throw new ApiException("File exceeds 10 MB limit.");
        String ct = file.getContentType();
        if (ct == null || !ALLOWED_CHAT_FILE_TYPES.contains(ct.toLowerCase()))
            throw new ApiException("File type not allowed. Accepted: JPEG, PNG, PDF, DOC, DOCX.");
        try {
            byte[] bytes = file.getBytes();
            Map<?, ?> result = cloudinary.uploader().upload(bytes, ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "auto",
                    "use_filename", true,
                    "unique_filename", true
            ));
            String secureUrl = (String) result.get("secure_url");
            log.debug("Uploaded file to Cloudinary: {}", secureUrl);
            return secureUrl;
        } catch (IOException e) {
            log.error("Failed to upload file to Cloudinary", e);
            throw new ApiException("Failed to upload file. Please try again.");
        }
    }

    public void deleteImage(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        String publicId = extractPublicId(imageUrl);
        if (publicId == null) {
            log.warn("Could not extract public ID from Cloudinary URL: {}", imageUrl);
            return;
        }
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.debug("Deleted image from Cloudinary: {}", publicId);
        } catch (IOException e) {
            log.error("Failed to delete image from Cloudinary: {}", publicId, e);
        }
    }

    private String extractPublicId(String url) {
        // e.g. https://res.cloudinary.com/cloud/image/upload/v1234/folder/file.jpg
        int uploadIdx = url.indexOf("/upload/");
        if (uploadIdx == -1) return null;
        String afterUpload = url.substring(uploadIdx + "/upload/".length());
        // strip optional version segment: v1234567890/
        if (afterUpload.matches("v\\d+/.*")) {
            afterUpload = afterUpload.substring(afterUpload.indexOf('/') + 1);
        }
        // strip file extension
        int dotIdx = afterUpload.lastIndexOf('.');
        return dotIdx != -1 ? afterUpload.substring(0, dotIdx) : afterUpload;
    }

    public String uploadImage(MultipartFile file, String folder) {
        validateFile(file);
        try {
            byte[] bytes = file.getBytes();
            Map<?, ?> result = cloudinary.uploader().upload(bytes, ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image",
                    "allowed_formats", "jpg,jpeg,png,webp"
            ));
            String secureUrl = (String) result.get("secure_url");
            log.debug("Uploaded image to Cloudinary: {}", secureUrl);
            return secureUrl;
        } catch (IOException e) {
            log.error("Failed to upload image to Cloudinary", e);
            throw new ApiException("Failed to upload image. Please try again.");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("No file provided or file is empty.");
        }
        if (file.getSize() > maxFileSizeBytes) {
            long maxMb = maxFileSizeBytes / (1024 * 1024);
            throw new ApiException("File size exceeds the maximum allowed size of " + maxMb + " MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ApiException("Invalid file type. Only JPEG, PNG, and WebP images are allowed.");
        }
        validateMagicBytes(file);
    }

    private void validateMagicBytes(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            byte[] header = is.readNBytes(12);
            if (!hasValidMagicBytes(header)) {
                throw new ApiException("File content does not match a valid image format.");
            }
        } catch (ApiException e) {
            throw e;
        } catch (IOException e) {
            throw new ApiException("Could not read file content for validation.");
        }
    }

    private boolean hasValidMagicBytes(byte[] header) {
        if (header.length < 3) return false;
        // JPEG: FF D8 FF
        if (header[0] == JPEG_MAGIC[0] && header[1] == JPEG_MAGIC[1] && header[2] == JPEG_MAGIC[2]) {
            return true;
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (header.length >= 8) {
            boolean isPng = true;
            for (int i = 0; i < PNG_MAGIC.length; i++) {
                if (header[i] != PNG_MAGIC[i]) {
                    isPng = false;
                    break;
                }
            }
            if (isPng) return true;
        }
        // WebP: RIFF....WEBP (bytes 0-3 are "RIFF", bytes 8-11 are "WEBP")
        if (header.length >= 12) {
            boolean isRiff = header[0] == WEBP_RIFF[0] && header[1] == WEBP_RIFF[1]
                    && header[2] == WEBP_RIFF[2] && header[3] == WEBP_RIFF[3];
            boolean isWebp = header[8] == WEBP_WEBP[0] && header[9] == WEBP_WEBP[1]
                    && header[10] == WEBP_WEBP[2] && header[11] == WEBP_WEBP[3];
            if (isRiff && isWebp) return true;
        }
        return false;
    }
}
