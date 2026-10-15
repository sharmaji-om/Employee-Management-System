// This file tests employee validation and service operations.
// It is part of the backend test suite.
// Run the Maven wrapper with verify from backend to check it.
package com.northstar.people.employee;

import com.northstar.people.common.ApiException;
import com.northstar.people.department.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {
    @Mock EmployeeRepository employees;
    @Mock DepartmentRepository departments;
    @InjectMocks EmployeeService service;
    EmployeeService.Input input(String email,Long version) { return new EmployeeService.Input(" Ada Lovelace ",email,"+44 123456789",1L," Engineer ",LocalDate.of(2024,1,2),new BigDecimal("120000.50"),Employee.Status.ACTIVE,version); }
    Employee existing() { var e=new Employee(); ReflectionTestUtils.setField(e,"id",1L); ReflectionTestUtils.setField(e,"version",2L); return e; }
    @Test void createsNormalizedEmployeeAndPreservesExactSalary() {
        var d=new Department(); d.setName("Engineering"); ReflectionTestUtils.setField(d,"id",1L);
        when(departments.findById(1L)).thenReturn(Optional.of(d));
        when(employees.saveAndFlush(any())).thenAnswer(a->{Employee e=a.getArgument(0);ReflectionTestUtils.setField(e,"id",42L);return e;});
        var result=service.create(input("ADA@EXAMPLE.COM",null));
        assertEquals("ada@example.com",result.email()); assertEquals("Ada Lovelace",result.fullName()); assertEquals("EMP-00042",result.employeeId()); assertEquals(new BigDecimal("120000.50"),result.salary());
    }
    @Test void duplicateEmailIsRejectedBeforeSaving() {
        when(employees.existsByEmailIgnoreCase("ada@example.com")).thenReturn(true);
        assertThrows(ApiException.class,()->service.create(input("ada@example.com",null)));verify(employees,never()).saveAndFlush(any());
    }
    @Test void missingDepartmentDoesNotCreateEmployee() {
        when(departments.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ApiException.class,()->service.create(input("ada@example.com",null)));verify(employees,never()).saveAndFlush(any());
    }
    @Test void staleUpdateIsRejected() {
        when(employees.findById(1L)).thenReturn(Optional.of(existing()));
        assertThrows(ApiException.class,()->service.update(1L,input("ada@example.com",1L))); verify(employees,never()).saveAndFlush(any());
    }
    @Test void updateCannotStealAnotherEmail() {
        when(employees.findById(1L)).thenReturn(Optional.of(existing())); when(employees.existsByEmailIgnoreCaseAndIdNot("ada@example.com",1L)).thenReturn(true);
        assertThrows(ApiException.class,()->service.update(1L,input("ada@example.com",2L))); verify(employees,never()).saveAndFlush(any());
    }
    @Test void deletionChecksVersion() {
        when(employees.findById(1L)).thenReturn(Optional.of(existing()));
        assertThrows(ApiException.class,()->service.delete(1L,0L)); verify(employees,never()).delete(any(Employee.class));
    }
    @Test void validDeletionRemovesRecord() {
        var e=existing();when(employees.findById(1L)).thenReturn(Optional.of(e));service.delete(1L,2L);verify(employees).delete(e);
    }
    @Test void missingRecordReturns404() {var error=assertThrows(ApiException.class,()->service.get(999L));assertEquals(404,error.getStatus().value());}
    @Test void unboundedPageIsRejected() {assertThrows(ApiException.class,()->service.list("",null,null,0,500,"fullName","asc"));}
    @Test void unknownSortIsRejected() {assertThrows(ApiException.class,()->service.list("",null,null,0,10,"password","asc"));}
    @Test void csvEscapesQuotesAndSpreadsheetFormulas() {
        assertEquals("\"'  =SUM(A1:A2)\"",EmployeeService.csvCell("  =SUM(A1:A2)"));
        assertEquals("\"Ada, \"\"A\"\"\"",EmployeeService.csvCell("Ada, \"A\""));
        assertEquals("\"'+91 12345678\"",EmployeeService.csvCell("+91 12345678"));
    }
}
