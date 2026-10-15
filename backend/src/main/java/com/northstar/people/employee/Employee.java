// This file defines the stored employee record.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.employee;

import com.northstar.people.common.AuditedEntity;
import com.northstar.people.department.Department;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity @Table(name="employees") @Getter @Setter @NoArgsConstructor
public class Employee extends AuditedEntity {
    public enum Status { ACTIVE, INACTIVE }
    @Column(nullable=false,length=100) private String fullName;
    @Column(nullable=false,length=254) private String email;
    @Column(nullable=false,length=25) private String phone;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="department_id") private Department department;
    @Column(nullable=false,length=100) private String designation;
    @Column(nullable=false) private LocalDate joiningDate;
    @Column(nullable=false,precision=14,scale=2) private BigDecimal salary;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=10) private Status status;
}
