package com.example.backend.exception;

import com.example.backend.common.exception.ApiException;

public class InvalidTicketStatusTransitionException extends ApiException {

    public InvalidTicketStatusTransitionException(String message) {
        super(message);
    }
}

