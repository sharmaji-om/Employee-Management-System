// This file represents a backend request error.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    public ApiException(HttpStatus status, String message) { super(message); this.status = status; }
    public static ApiException missing(String name) { return new ApiException(HttpStatus.NOT_FOUND, name + " was not found."); }
    public static ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT, message); }
    public static ApiException bad(String message) { return new ApiException(HttpStatus.BAD_REQUEST, message); }
}
