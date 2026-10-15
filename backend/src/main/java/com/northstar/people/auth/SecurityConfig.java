// This file configures login, authorization and request security.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.people.common.ApiErrors;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import java.util.Map;

@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }
    @Bean UserDetailsService userDetailsService(AdminRepository users) {
        return email -> users.findByEmailIgnoreCase(email.strip()).map(u -> User.withUsername(u.getEmail()).password(u.getPasswordHash()).roles("ADMIN").disabled(!u.isEnabled()).build()).orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    }
    @Bean SecurityFilterChain security(HttpSecurity http,ObjectMapper mapper) throws Exception {
        http.authorizeHttpRequests(a -> a.requestMatchers("/api/v1/auth/csrf","/api/v1/auth/login","/actuator/health/**","/error").permitAll().anyRequest().hasRole("ADMIN"))
            .formLogin(f -> f.loginProcessingUrl("/api/v1/auth/login").usernameParameter("email")
                .successHandler((req,res,auth) -> { res.setContentType("application/json"); mapper.writeValue(res.getOutputStream(),Map.of("email",auth.getName(),"role","ADMIN")); })
                .failureHandler((req,res,e) -> { res.setStatus(401); res.setContentType("application/json"); mapper.writeValue(res.getOutputStream(),ApiErrors.body(401,"Email or password is incorrect.",Map.of(),req)); }))
            .logout(l -> l.logoutUrl("/api/v1/auth/logout").invalidateHttpSession(true).deleteCookies("JSESSIONID").logoutSuccessHandler((req,res,auth) -> res.setStatus(204)))
            .exceptionHandling(e -> e.authenticationEntryPoint((req,res,ex) -> { res.setStatus(401); res.setContentType("application/json"); mapper.writeValue(res.getOutputStream(),ApiErrors.body(401,"Please sign in to continue.",Map.of(),req)); })
                .accessDeniedHandler((req,res,ex) -> { res.setStatus(403); res.setContentType("application/json"); mapper.writeValue(res.getOutputStream(),ApiErrors.body(403,"Access denied or security token expired. Refresh and try again.",Map.of(),req)); }))
            .sessionManagement(s -> s.sessionFixation(f -> f.changeSessionId()))
            .requestCache(c -> c.disable())
            .headers(h -> h.contentSecurityPolicy(c -> c.policyDirectives("default-src 'self'; frame-ancestors 'none'; object-src 'none'")))
            .addFilterBefore(new LoginThrottle(mapper),UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
