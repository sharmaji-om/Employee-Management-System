// This file defines the administrator account record.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.auth;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity @Table(name="users") @Getter @Setter @NoArgsConstructor
public class AdminUser {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false,length=254,unique=true) private String email;
    @Column(nullable=false,length=100) private String passwordHash;
    @Column(nullable=false) private boolean enabled=true;
    @Column(nullable=false,updatable=false) private Instant createdAt=Instant.now();
}
