// This file tests the login attempt limiter.
// It is part of the backend test suite.
// Run the Maven wrapper with verify from backend to check it.
package com.northstar.people.auth;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class LoginThrottleTest {
    @Test void eleventhAttemptIsLimitedAndOtherClientsAreIndependent() {var limiter=new LoginThrottle(new ObjectMapper());for(int i=0;i<10;i++)assertTrue(limiter.allow("client-a"));assertFalse(limiter.allow("client-a"));assertTrue(limiter.allow("client-b"));}
}
