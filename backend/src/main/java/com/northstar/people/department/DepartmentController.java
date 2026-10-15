// This file exposes department API endpoints.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.department;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/v1/departments") @RequiredArgsConstructor
public class DepartmentController {
    private final DepartmentService service;
    @GetMapping public List<DepartmentService.View> list() { return service.list(); }
    @GetMapping("/{id}") public DepartmentService.View get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public DepartmentService.View create(@Valid @RequestBody DepartmentService.Input input) { return service.create(input); }
    @PutMapping("/{id}") public DepartmentService.View update(@PathVariable Long id,@Valid @RequestBody DepartmentService.Input input) { return service.update(id,input); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id,@RequestParam Long version) { service.delete(id,version); }
}
