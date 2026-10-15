// This file reads and searches employee records in the database.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.employee;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;

public interface EmployeeRepository extends JpaRepository<Employee,Long>, JpaSpecificationExecutor<Employee> {
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndIdNot(String email,Long id);
    long countByDepartmentId(Long id);
    long countByStatus(Employee.Status status);
    @Override @EntityGraph(attributePaths="department")
    Page<Employee> findAll(Specification<Employee> spec, Pageable pageable);
}
