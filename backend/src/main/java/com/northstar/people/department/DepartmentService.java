// This file manages departments and checks deletion rules.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.department;

import com.northstar.people.common.ApiException;
import com.northstar.people.employee.EmployeeRepository;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class DepartmentService {
    private final DepartmentRepository departments;
    private final EmployeeRepository employees;
    public record Input(@NotBlank @Size(max=80) String name, @Size(max=300) String description, @PositiveOrZero Long version) {}
    public record View(Long id, String name, String description, Long version, long employeeCount) {}
    public List<View> list() { return departments.summaries().stream().map(d -> new View(d.getId(),d.getName(),d.getDescription(),d.getVersion(),d.getEmployeeCount())).toList(); }
    public View get(Long id) { var d=find(id); return view(d); }
    public Department find(Long id) { return departments.findById(id).orElseThrow(() -> ApiException.missing("Department")); }
    private View view(Department d) { return new View(d.getId(),d.getName(),d.getDescription(),d.getVersion(),employees.countByDepartmentId(d.getId())); }
    @Transactional public View create(Input input) {
        String name=input.name().strip();
        if (departments.existsByNameIgnoreCase(name)) throw ApiException.conflict("A department with this name already exists.");
        var d=new Department(); d.setName(name); d.setDescription(Objects.toString(input.description(),"").strip());
        return view(departments.saveAndFlush(d));
    }
    @Transactional public View update(Long id, Input input) {
        var d=find(id);
        if (!Objects.equals(input.version(),d.getVersion())) throw ApiException.conflict("This department changed. Refresh before editing again.");
        if (departments.existsByNameIgnoreCaseAndIdNot(input.name().strip(),id)) throw ApiException.conflict("A department with this name already exists.");
        d.setName(input.name().strip()); d.setDescription(Objects.toString(input.description(),"").strip());
        return view(departments.saveAndFlush(d));
    }
    @Transactional public void delete(Long id, Long version) {
        var d=find(id);
        if (!Objects.equals(version,d.getVersion())) throw ApiException.conflict("This department changed. Refresh before deleting.");
        if(employees.countByDepartmentId(id)>0) throw ApiException.conflict("Reassign this department's employees before deleting it.");
        departments.delete(d); departments.flush();
    }
}
