// This file validates and manages employee operations.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.employee;

import com.northstar.people.common.ApiException;
import com.northstar.people.department.DepartmentRepository;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class EmployeeService {
    private final EmployeeRepository employees;
    private final DepartmentRepository departments;
    public record Input(
        @NotBlank @Size(max=100) String fullName,
        @NotBlank @Email @Size(max=254) String email,
        @NotBlank @Pattern(regexp="[+0-9() .-]{7,25}",message="Use 7–25 phone characters: digits, +, spaces, (), dots or hyphens.") String phone,
        @NotNull @Positive Long departmentId,
        @NotBlank @Size(max=100) String designation,
        @NotNull LocalDate joiningDate,
        @NotNull @DecimalMin("0.00") @Digits(integer=12,fraction=2) BigDecimal salary,
        @NotNull Employee.Status status,
        @PositiveOrZero Long version) {}
    public record View(Long id,String employeeId,String fullName,String email,String phone,Long departmentId,String departmentName,String designation,LocalDate joiningDate,BigDecimal salary,Employee.Status status,Long version,Instant createdAt,Instant updatedAt) {}
    public record PageView(List<View> content,long totalElements,int totalPages,int page,int size) {}
    public record Stats(long total,long active,long inactive,long departments) {}
    private static final Map<String,String> SORTS=Map.of("fullName","fullName","joiningDate","joiningDate","salary","salary","employeeId","id","department","department.name","status","status");
    public Stats stats() { return new Stats(employees.count(),employees.countByStatus(Employee.Status.ACTIVE),employees.countByStatus(Employee.Status.INACTIVE),departments.count()); }
    public PageView list(String search,Long department,Employee.Status status,int page,int size,String sort,String direction) {
        if(page<0 || size<1 || size>100) throw ApiException.bad("Page must be nonnegative and page size must be between 1 and 100.");
        if(!SORTS.containsKey(sort) || !Set.of("asc","desc").contains(direction)) throw ApiException.bad("Unsupported sort order.");
        var result=employees.findAll(filter(search,department,status),PageRequest.of(page,size,Sort.by(Sort.Direction.fromString(direction),SORTS.get(sort)).and(Sort.by("id"))));
        return new PageView(result.map(this::view).getContent(),result.getTotalElements(),result.getTotalPages(),page,size);
    }
    private Specification<Employee> filter(String search,Long department,Employee.Status status) {
        if(search!=null && search.length()>100) throw ApiException.bad("Search must be 100 characters or fewer.");
        return (root,query,cb) -> {
            var conditions=new ArrayList<jakarta.persistence.criteria.Predicate>();
            if(search!=null && !search.isBlank()) {
                String pattern="%"+search.strip().toLowerCase(Locale.ROOT).replace("\\","\\\\").replace("%","\\%").replace("_","\\_")+"%";
                conditions.add(cb.or(cb.like(cb.lower(root.get("fullName")),pattern,'\\'),cb.like(cb.lower(root.get("email")),pattern,'\\')));
            }
            if(department!=null) conditions.add(cb.equal(root.get("department").get("id"),department));
            if(status!=null) conditions.add(cb.equal(root.get("status"),status));
            return cb.and(conditions.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }
    public View get(Long id) { return view(find(id)); }
    private Employee find(Long id) { return employees.findById(id).orElseThrow(() -> ApiException.missing("Employee")); }
    private View view(Employee e) { return new View(e.getId(),"EMP-%05d".formatted(e.getId()),e.getFullName(),e.getEmail(),e.getPhone(),e.getDepartment().getId(),e.getDepartment().getName(),e.getDesignation(),e.getJoiningDate(),e.getSalary(),e.getStatus(),e.getVersion(),e.getCreatedAt(),e.getUpdatedAt()); }
    @Transactional public View create(Input input) {
        if(employees.existsByEmailIgnoreCase(input.email().strip())) throw ApiException.conflict("An employee with this email already exists.");
        var e=new Employee(); apply(e,input); return view(employees.saveAndFlush(e));
    }
    @Transactional public View update(Long id,Input input) {
        var e=find(id);
        if(!Objects.equals(e.getVersion(),input.version())) throw ApiException.conflict("This employee changed. Refresh before editing again.");
        if(employees.existsByEmailIgnoreCaseAndIdNot(input.email().strip(),id)) throw ApiException.conflict("An employee with this email already exists.");
        apply(e,input); return view(employees.saveAndFlush(e));
    }
    private void apply(Employee e,Input i) {
        e.setFullName(i.fullName().strip()); e.setEmail(i.email().strip().toLowerCase(Locale.ROOT)); e.setPhone(i.phone().strip());
        e.setDepartment(departments.findById(i.departmentId()).orElseThrow(() -> ApiException.missing("Department")));
        e.setDesignation(i.designation().strip()); e.setJoiningDate(i.joiningDate()); e.setSalary(i.salary()); e.setStatus(i.status());
    }
    @Transactional public void delete(Long id,Long version) {
        var e=find(id);
        if(!Objects.equals(version,e.getVersion())) throw ApiException.conflict("This employee changed. Refresh before deleting.");
        employees.delete(e); employees.flush();
    }
    public String export(String search,Long department,Employee.Status status) {
        var result=employees.findAll(filter(search,department,status),PageRequest.of(0,10001,Sort.by("fullName","id")));
        if(result.getTotalElements()>10000) throw ApiException.bad("Export is limited to 10,000 employees. Narrow your filters.");
        StringBuilder csv=new StringBuilder("\uFEFFEmployee ID,Full Name,Email,Phone,Department,Designation,Joining Date,Salary,Status\r\n");
        for(var employee:result) {
            var e=view(employee);
            csv.append(List.of(e.employeeId(),e.fullName(),e.email(),e.phone(),e.departmentName(),e.designation(),e.joiningDate().toString(),e.salary().toPlainString(),e.status().name()).stream().map(EmployeeService::csvCell).collect(Collectors.joining(","))).append("\r\n");
        }
        return csv.toString();
    }
    static String csvCell(String value) {
        String trimmed=value.stripLeading();
        if(!trimmed.isEmpty() && "=+-@\t\r\n".indexOf(trimmed.charAt(0))>=0 || value.startsWith("\t") || value.startsWith("\r") || value.startsWith("\n")) value="'"+value;
        return "\""+value.replace("\"","\"\"")+"\"";
    }
}
