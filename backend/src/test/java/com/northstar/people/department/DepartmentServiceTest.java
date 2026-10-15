// This file tests department operations and deletion safeguards.
// It is part of the backend test suite.
// Run the Maven wrapper with verify from backend to check it.
package com.northstar.people.department;

import com.northstar.people.common.ApiException;
import com.northstar.people.employee.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {
    @Mock DepartmentRepository departments;
    @Mock EmployeeRepository employees;
    @InjectMocks DepartmentService service;
    Department existing() {var d=new Department();d.setName("Engineering");ReflectionTestUtils.setField(d,"id",1L);ReflectionTestUtils.setField(d,"version",0L);return d;}
    @Test void cannotDeleteDepartmentWithEmployees() {
        when(departments.findById(1L)).thenReturn(Optional.of(existing()));when(employees.countByDepartmentId(1L)).thenReturn(2L);
        assertThrows(ApiException.class,()->service.delete(1L,0L));verify(departments,never()).delete(any());
    }
    @Test void canDeleteEmptyDepartment() {var d=existing();when(departments.findById(1L)).thenReturn(Optional.of(d));service.delete(1L,0L);verify(departments).delete(d);}
    @Test void duplicateNameIsRejected() {when(departments.existsByNameIgnoreCase("Design")).thenReturn(true);assertThrows(ApiException.class,()->service.create(new DepartmentService.Input("Design","",null)));}
    @Test void staleDepartmentEditIsRejected() {when(departments.findById(1L)).thenReturn(Optional.of(existing()));assertThrows(ApiException.class,()->service.update(1L,new DepartmentService.Input("New name","",9L)));}
}
