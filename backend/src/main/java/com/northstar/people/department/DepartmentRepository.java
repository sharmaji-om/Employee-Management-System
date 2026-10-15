// This file reads department records from the database.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.department;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department,Long> {
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);
    interface Summary { Long getId(); String getName(); String getDescription(); Long getVersion(); Long getEmployeeCount(); }
    @Query("select d.id as id,d.name as name,d.description as description,d.version as version,count(e.id) as employeeCount from Department d left join Employee e on e.department=d group by d.id,d.name,d.description,d.version order by d.name")
    List<Summary> summaries();
}
