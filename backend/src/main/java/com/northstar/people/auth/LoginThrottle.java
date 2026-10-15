// This file limits repeated login attempts on one application instance.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.northstar.people.common.ApiErrors;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.*;
import java.util.*;


public class LoginThrottle extends OncePerRequestFilter {
    private final Map<String,Deque<Instant>> attempts=new HashMap<>();
    private final ObjectMapper mapper;
    public LoginThrottle(ObjectMapper mapper) { this.mapper=mapper; }
    synchronized boolean allow(String address) {
        Instant cutoff=Instant.now().minus(Duration.ofMinutes(5));
        attempts.values().forEach(q -> { while(!q.isEmpty() && q.peekFirst().isBefore(cutoff)) q.removeFirst(); });
        attempts.entrySet().removeIf(e -> e.getValue().isEmpty());
        if(!attempts.containsKey(address) && attempts.size()>=10000) return false;
        var queue=attempts.computeIfAbsent(address,k -> new ArrayDeque<>());
        if(queue.size()>=10) return false;
        queue.addLast(Instant.now()); return true;
    }
    protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws ServletException,IOException {
        if(req.getMethod().equals("POST") && req.getServletPath().equals("/api/v1/auth/login") && !allow(req.getRemoteAddr())) {
            res.setStatus(429); res.setHeader("Retry-After","300"); res.setContentType("application/json");
            mapper.writeValue(res.getOutputStream(),ApiErrors.body(429,"Too many sign-in attempts. Try again in five minutes.",Map.of(),req)); return;
        }
        chain.doFilter(req,res);
    }
}
