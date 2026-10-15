// This file tests API behavior against PostgreSQL.
// It is part of the backend test suite.
// Run the Maven wrapper with verify from backend to check it.
package com.northstar.people;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.testcontainers.containers.PostgreSQLContainer;
import java.util.Map;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"app.admin-email=test@example.com","app.admin-password=TestPassword!2026","app.demo-data=false"})
@AutoConfigureMockMvc
class PeopleApiIT {
    static PostgreSQLContainer<?> postgres;
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        String external=System.getenv("TEST_DATABASE_URL");
        if(external!=null){registry.add("spring.datasource.url",()->external);registry.add("spring.datasource.username",()->System.getenv().getOrDefault("TEST_DATABASE_USER","people"));registry.add("spring.datasource.password",()->System.getenv().getOrDefault("TEST_DATABASE_PASSWORD","local-only"));}
        else {postgres=new PostgreSQLContainer<>("postgres:17.6-alpine");postgres.start();registry.add("spring.datasource.url",postgres::getJdbcUrl);registry.add("spring.datasource.username",postgres::getUsername);registry.add("spring.datasource.password",postgres::getPassword);}
    }
    @AfterAll static void stop(){if(postgres!=null)postgres.stop();}
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Test void unauthenticatedReadAndMissingCsrfAreRejected() throws Exception {
        mvc.perform(get("/api/v1/employees")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/v1/departments").with(user("admin").roles("ADMIN")).contentType("application/json").content("{\"name\":\"Blocked\"}")).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/employees").with(user("viewer").roles("VIEWER"))).andExpect(status().isForbidden());
    }
    @Test void loginAndLogoutUseRealSession() throws Exception {
        mvc.perform(post("/api/v1/auth/login").with(csrf()).param("email","test@example.com").param("password","incorrect")).andExpect(status().isUnauthorized());
        var login=mvc.perform(post("/api/v1/auth/login").with(csrf()).param("email","test@example.com").param("password","TestPassword!2026")).andExpect(status().isOk()).andReturn();
        var session=(MockHttpSession)login.getRequest().getSession(false);
        mvc.perform(get("/api/v1/auth/me").session(session)).andExpect(status().isOk()).andExpect(jsonPath("$.email").value("test@example.com"));
        mvc.perform(post("/api/v1/auth/logout").with(csrf()).session(session)).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
    }
    @Test void completeLifecycleFilteringConcurrencyAndDatabaseRules() throws Exception {
        var auth=user("admin").roles("ADMIN");
        var d=mvc.perform(post("/api/v1/departments").with(auth).with(csrf()).contentType("application/json").content("{\"name\":\"API Team\",\"description\":\"Integration test\"}")).andExpect(status().isCreated()).andReturn();
        long department=json.readTree(d.getResponse().getContentAsString()).get("id").asLong();
        Map<String,Object> input=new java.util.HashMap<>(Map.of("fullName","API Person","email","API.PERSON@EXAMPLE.COM","phone","+91 1234567890","departmentId",department,"designation","Engineer","joiningDate","2024-03-01","salary",123456.78,"status","ACTIVE"));
        var created=mvc.perform(post("/api/v1/employees").with(auth).with(csrf()).contentType("application/json").content(json.writeValueAsString(input))).andExpect(status().isCreated()).andExpect(jsonPath("$.email").value("api.person@example.com")).andReturn();
        var record=json.readTree(created.getResponse().getContentAsString());long id=record.get("id").asLong();long version=record.get("version").asLong();
        mvc.perform(post("/api/v1/employees").with(auth).with(csrf()).contentType("application/json").content(json.writeValueAsString(input))).andExpect(status().isConflict());
        mvc.perform(get("/api/v1/employees").with(auth).param("search","API.PERSON").param("department",String.valueOf(department)).param("status","ACTIVE").param("size","1")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1)).andExpect(jsonPath("$.content[0].id").value(id));
        mvc.perform(get("/api/v1/employees").with(auth).param("search","%" )).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(delete("/api/v1/departments/"+department).param("version","0").with(auth).with(csrf())).andExpect(status().isConflict());
        input.put("salary",-1);mvc.perform(post("/api/v1/employees").with(auth).with(csrf()).contentType("application/json").content(json.writeValueAsString(input))).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.salary").exists());input.put("salary",123456.78);
        input.put("version",version);input.put("designation","Senior Engineer");
        mvc.perform(put("/api/v1/employees/"+id).with(auth).with(csrf()).contentType("application/json").content(json.writeValueAsString(input))).andExpect(status().isOk()).andExpect(jsonPath("$.version").value(version+1));
        mvc.perform(put("/api/v1/employees/"+id).with(auth).with(csrf()).contentType("application/json").content(json.writeValueAsString(input))).andExpect(status().isConflict());
        mvc.perform(get("/api/v1/employees/export").with(auth).param("department",String.valueOf(department))).andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("API Person")));
        mvc.perform(get("/api/v1/employees").with(auth).param("size","101")).andExpect(status().isBadRequest());
        mvc.perform(delete("/api/v1/employees/"+id).param("version",String.valueOf(version+1)).with(auth).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/employees/"+id).with(auth)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/v1/departments/"+department).param("version","0").with(auth).with(csrf())).andExpect(status().isNoContent());
    }
}
