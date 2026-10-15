// This file provides shared record timestamps and version information.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.common;

import jakarta.persistence.*;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import java.time.Instant;

@Getter @MappedSuperclass @EntityListeners(AuditingEntityListener.class)
public abstract class AuditedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) protected Long id;
    @Version protected Long version;
    @CreatedDate @Column(nullable = false, updatable = false) protected Instant createdAt;
    @LastModifiedDate @Column(nullable = false) protected Instant updatedAt;
}
