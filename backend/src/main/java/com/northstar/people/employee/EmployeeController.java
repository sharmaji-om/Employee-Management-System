// This file exposes employee API endpoints.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.employee;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;

@RestController @RequestMapping("/api/v1/employees") @RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService service;
    @GetMapping public EmployeeService.PageView list(@RequestParam(defaultValue="") String search,@RequestParam(required=false) Long department,@RequestParam(required=false) Employee.Status status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="10") int size,@RequestParam(defaultValue="fullName") String sort,@RequestParam(defaultValue="asc") String direction) { return service.list(search,department,status,page,size,sort,direction); }
    @GetMapping("/summary") public EmployeeService.Stats stats() { return service.stats(); }
    @GetMapping("/export") public ResponseEntity<byte[]> export(@RequestParam(defaultValue="") String search,@RequestParam(required=false) Long department,@RequestParam(required=false) Employee.Status status) {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=employees.csv").header(HttpHeaders.CACHE_CONTROL,"no-store").contentType(new MediaType("text","csv",StandardCharsets.UTF_8)).body(service.export(search,department,status).getBytes(StandardCharsets.UTF_8));
    }
    @GetMapping("/{id}") public EmployeeService.View get(@PathVariable Long id) { return service.get(id); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public EmployeeService.View create(@Valid @RequestBody EmployeeService.Input input) { return service.create(input); }
    @PutMapping("/{id}") public EmployeeService.View update(@PathVariable Long id,@Valid @RequestBody EmployeeService.Input input) { return service.update(id,input); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id,@RequestParam Long version) { service.delete(id,version); }
}
