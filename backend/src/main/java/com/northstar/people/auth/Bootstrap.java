// This file creates the initial administrator and optional demo data.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.auth;

import com.northstar.people.department.*;
import com.northstar.people.employee.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Component @RequiredArgsConstructor
public class Bootstrap implements CommandLineRunner {
    private final AdminRepository users;
    private final DepartmentRepository departments;
    private final EmployeeRepository employees;
    private final PasswordEncoder encoder;
    @Value("${app.admin-email}") private String email;
    @Value("${app.admin-password}") private String password;
    @Value("${app.demo-data}") private boolean demo;
    @Override @Transactional public void run(String... args) {
        if(users.count()==0) {
            if(email.isBlank() || password.length()<12 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)
                throw new IllegalStateException("First startup requires ADMIN_EMAIL and ADMIN_PASSWORD (12 characters minimum, 72 UTF-8 bytes maximum).");
            var user=new AdminUser(); user.setEmail(email.strip().toLowerCase(Locale.ROOT)); user.setPasswordHash(encoder.encode(password)); users.save(user);
        }
        if(!demo || departments.count()!=0 || employees.count()!=0) return;
        String[] names={"Engineering","Design","People & Culture","Marketing","Operations","Finance"};
        String[] descriptions={"Building thoughtful, reliable products.","Making every experience feel effortless.","Helping our people do their best work.","Connecting our work with the world.","Keeping the business moving forward.","Planning for sustainable growth."};
        var teams=new ArrayList<Department>();
        for(int i=0;i<names.length;i++) { var d=new Department(); d.setName(names[i]); d.setDescription(descriptions[i]); teams.add(departments.save(d)); }
        String[][] people={{"Aarav Sharma","Senior Software Engineer","0"},{"Ananya Rao","Product Designer","1"},{"Arjun Mehta","Engineering Manager","0"},{"Diya Patel","People Partner","2"},{"Ethan Brooks","Growth Marketer","3"},{"Isha Kapoor","Frontend Engineer","0"},{"Kabir Singh","Operations Analyst","4"},{"Leah Chen","Brand Designer","1"},{"Maya Thomas","Finance Manager","5"},{"Neel Desai","Backend Engineer","0"},{"Olivia Wilson","Content Strategist","3"},{"Priya Nair","Talent Specialist","2"},{"Rohan Gupta","Platform Engineer","0"},{"Sara Ahmed","UX Researcher","1"},{"Vikram Joshi","Financial Analyst","5"},{"Zara Khan","Operations Manager","4"},{"Aditi Menon","Software Engineer","0"},{"Daniel Park","Product Designer","1"}};
        for(int i=0;i<people.length;i++) {
            var p=people[i]; var e=new Employee(); e.setFullName(p[0]); e.setEmail(p[0].toLowerCase(Locale.ROOT).replace(' ','.')+"@example.com"); e.setPhone("+91 90000 "+String.format("%05d",10000+i)); e.setDepartment(teams.get(Integer.parseInt(p[2]))); e.setDesignation(p[1]);
            e.setJoiningDate(LocalDate.of(2022+i%4,1+i%12,3+i%24)); e.setSalary(new BigDecimal(720000+i*45000)); e.setStatus(i==4 || i==10 || i==15 ? Employee.Status.INACTIVE : Employee.Status.ACTIVE); employees.save(e);
        }
    }
}
