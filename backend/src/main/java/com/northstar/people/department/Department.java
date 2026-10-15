// This file defines the stored department record.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.department;

import com.northstar.people.common.AuditedEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="departments") @Getter @Setter @NoArgsConstructor
public class Department extends AuditedEntity {
    @Column(nullable=false,length=80) private String name;
    @Column(nullable=false,length=300) private String description = "";
}
