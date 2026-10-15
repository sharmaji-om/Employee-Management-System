// This file converts backend errors into consistent API responses.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import java.time.Instant;
import java.util.*;

@RestControllerAdvice
public class ApiErrors {
    public record ErrorBody(int status, String message, Map<String,String> errors, String requestId, Instant timestamp) {}
    public static ErrorBody body(int status, String message, Map<String,String> fields, HttpServletRequest req) {
        return new ErrorBody(status,message,fields,Objects.toString(req.getAttribute("requestId"),""),Instant.now());
    }
    private ResponseEntity<ErrorBody> response(HttpStatus status, String message, Map<String,String> fields, HttpServletRequest req) {
        return ResponseEntity.status(status).body(body(status.value(),message,fields,req));
    }
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ErrorBody> application(ApiException e, HttpServletRequest req) { return response(e.getStatus(),e.getMessage(),Map.of(),req); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErrorBody> validation(MethodArgumentNotValidException e, HttpServletRequest req) {
        Map<String,String> fields = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return response(HttpStatus.BAD_REQUEST,"Please check the highlighted fields.",fields,req);
    }
    @ExceptionHandler({HttpMessageNotReadableException.class,MethodArgumentTypeMismatchException.class,ConstraintViolationException.class})
    ResponseEntity<ErrorBody> malformed(Exception e, HttpServletRequest req) { return response(HttpStatus.BAD_REQUEST,"The request contains an invalid value.",Map.of(),req); }
    @ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class)
    ResponseEntity<ErrorBody> missingParameter(Exception e,HttpServletRequest req) { return response(HttpStatus.BAD_REQUEST,"A required request parameter is missing.",Map.of(),req); }
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ErrorBody> method(Exception e,HttpServletRequest req) { return response(HttpStatus.METHOD_NOT_ALLOWED,"This HTTP method is not supported for this endpoint.",Map.of(),req); }
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    ResponseEntity<ErrorBody> notFound(Exception e,HttpServletRequest req) { return response(HttpStatus.NOT_FOUND,"This endpoint was not found.",Map.of(),req); }
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ResponseEntity<ErrorBody> stale(Exception e, HttpServletRequest req) { return response(HttpStatus.CONFLICT,"This record changed. Refresh before editing again.",Map.of(),req); }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ErrorBody> integrity(Exception e, HttpServletRequest req) { return response(HttpStatus.CONFLICT,"A duplicate value or linked record prevents this change.",Map.of(),req); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ErrorBody> unexpected(Exception e, HttpServletRequest req) {
        LoggerFactory.getLogger(ApiErrors.class).error("Unhandled request failure: {}", e.getClass().getSimpleName());
        return response(HttpStatus.INTERNAL_SERVER_ERROR,"Something went wrong. Please retry or contact your administrator with the request ID.",Map.of(),req);
    }
}
