// This file configures the generated API documentation.
// It is part of the Spring Boot backend.
// Run npm run dev from the project root to start the backend.
package com.northstar.people.common;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.media.*;
import io.swagger.v3.oas.models.parameters.RequestBody;
import io.swagger.v3.oas.models.responses.*;
import io.swagger.v3.oas.models.security.*;
import org.springframework.context.annotation.*;

@Configuration
public class OpenApiConfig {
    @Bean OpenAPI openApi() {
        var form=new ObjectSchema().addProperty("email",new StringSchema().format("email")).addProperty("password",new StringSchema().format("password")).required(java.util.List.of("email","password"));
        var login=new Operation().summary("Sign in and create an admin session").description("Call GET /api/v1/auth/csrf first. Send its token in the returned headerName header. Login accepts form-urlencoded credentials. Fetch a fresh CSRF token after successful login.")
            .requestBody(new RequestBody().required(true).content(new Content().addMediaType("application/x-www-form-urlencoded",new MediaType().schema(form))))
            .responses(new ApiResponses().addApiResponse("200",new ApiResponse().description("Signed in; session cookie set")).addApiResponse("401",new ApiResponse().description("Invalid credentials")).addApiResponse("429",new ApiResponse().description("Too many attempts"))).security(java.util.List.of());
        var logout=new Operation().summary("Invalidate the current session").description("Requires a CSRF token.").responses(new ApiResponses().addApiResponse("204",new ApiResponse().description("Signed out")));
        return new OpenAPI().info(new Info().title("Northstar People API").version("1.0.0").description("Admin-only employee management. All modifying requests require CSRF protection. Sign in through the web app before opening Swagger in the same browser. Versions are required for updates and deletes."))
            .components(new Components().addSecuritySchemes("session",new SecurityScheme().type(SecurityScheme.Type.APIKEY).in(SecurityScheme.In.COOKIE).name("JSESSIONID")))
            .addSecurityItem(new SecurityRequirement().addList("session"))
            .path("/api/v1/auth/login",new PathItem().post(login)).path("/api/v1/auth/logout",new PathItem().post(logout));
    }
}
