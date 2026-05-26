package com.example.backend.domain.chat;

public enum MessageType {
    TEXT, FILE, IMAGE,
    /** Lifecycle events surfaced inline in the chat thread (e.g. "provider accepted"). */
    SYSTEM
}
