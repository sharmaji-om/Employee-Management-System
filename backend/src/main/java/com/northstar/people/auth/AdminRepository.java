// This file finds administrator accounts in the database.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.auth;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface AdminRepository extends JpaRepository<AdminUser,Long> {
    Optional<AdminUser> findByEmailIgnoreCase(String email);
}
