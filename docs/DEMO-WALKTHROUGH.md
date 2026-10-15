<!-- This guide describes a short demonstration of the application. -->
<!-- Start the app and sign in before following the steps. -->
<!-- Use npm run dev from the root to start the local demonstration. -->
# Five-minute demonstration

1. Sign in with the administrator created at first startup using `.env` (local) or `.env.docker` (Docker). Show the overview counts and department distribution, all loaded from PostgreSQL.
2. Open People. Search by a name, then by an email. Combine department and status filters, change sorting, and move between pages. Refresh to show that directory state survives in the URL.
3. Add an employee. First submit an incomplete form to demonstrate inline validation. Fill every field, save, and show the generated employee ID on the details page.
4. Edit the employee. Attempt to leave with unsaved changes, keep editing, then save. Open the same employee in two tabs, save one, and demonstrate a conflict from the stale tab.
5. Create a department, assign the employee to it, and attempt to delete the department. Explain the reassignment safeguard. Edit its description.
6. Export filtered employees to CSV. Explain that the download includes every match, not just the visible page. The separate “Export all employees” action appears while filters are active.
7. Delete the test employee after confirming the employee name. Delete the now-empty test department.
8. Show the interface at mobile width, then sign out and try reopening a protected URL.
9. Show Swagger at `/docs`, the Postman collection, the backend tests, and the README setup instructions.

All bundled seed employees are fictional and use example.com addresses. The six supplied screenshots are in the root `screenshots/` folder.
