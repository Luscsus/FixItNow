package com.example.backend.exception;

import com.example.backend.common.exception.ResourceNotFoundException;

public class TicketNotFoundException extends ResourceNotFoundException {

    public TicketNotFoundException(String message) {
        super(message);
    }
}

