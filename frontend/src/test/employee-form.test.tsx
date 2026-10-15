// This file tests employee form behavior.
// It checks frontend behavior with the unit test environment.
// Run npm test from the frontend folder.
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { EmployeeForm, employeeSchema } from '../pages/Employee';
import { UserContext } from '../session';
import { ToastProvider } from '../components';
afterEach(() => vi.unstubAllGlobals());
function renderForm() {
  const router = createMemoryRouter(
    [
      { path: '/employees/new', element: <EmployeeForm /> },
      { path: '/employees/42', element: <h1>Saved profile</h1> },
      { path: '/employees', element: <h1>Directory</h1> },
    ],
    { initialEntries: ['/employees/new'] },
  );
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = String(input);
    if (path.endsWith('/departments'))
      return new Response(
        JSON.stringify([
          { id: 1, name: 'Engineering', description: '', version: 0, employeeCount: 0 },
        ]),
        { status: 200 },
      );
    if (path.endsWith('/auth/csrf'))
      return new Response(JSON.stringify({ token: 'token', headerName: 'X-CSRF-TOKEN' }), {
        status: 200,
      });
    if (init?.method === 'POST') return new Response(JSON.stringify({ id: 42 }), { status: 201 });
    throw new Error('Unexpected request ' + path);
  });
  vi.stubGlobal('fetch', fetcher);
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <UserContext.Provider value={{ email: 'admin@example.com', role: 'ADMIN', currency: 'INR' }}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </UserContext.Provider>
    </QueryClientProvider>,
  );
  return { fetcher, router };
}
describe('Employee form', () => {
  it('rejects invalid salary and incomplete data', () => {
    expect(employeeSchema.safeParse({}).success).toBe(false);
    const valid = {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '+44 123456789',
      departmentId: '1',
      designation: 'Engineer',
      joiningDate: '2024-01-01',
      salary: '100.50',
      status: 'ACTIVE',
    };
    expect(employeeSchema.safeParse(valid).success).toBe(true);
    for (const salary of ['-1', '10.999', 'abc'])
      expect(employeeSchema.safeParse({ ...valid, salary }).success).toBe(false);
  });
  it('shows validation errors without sending an employee request', async () => {
    const { fetcher } = renderForm();
    await screen.findByRole('option', { name: 'Engineering' });
    await userEvent.click(screen.getByRole('button', { name: 'Add employee' }));
    expect(await screen.findByText('Enter the full name.')).toBeVisible();
    expect(fetcher.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false);
  });
  it('saves a complete employee and navigates without an unsaved-changes dialog', async () => {
    const { fetcher, router } = renderForm();
    const user = userEvent.setup();
    await screen.findByRole('option', { name: 'Engineering' });
    await user.type(screen.getByLabelText(/Full name/), 'Ada Lovelace');
    await user.type(screen.getByLabelText(/Email address/), 'ada@example.com');
    await user.type(screen.getByLabelText(/Phone number/), '+44 123456789');
    await user.selectOptions(screen.getByLabelText(/^Department/), '1');
    await user.type(screen.getByLabelText(/Designation/), 'Engineer');
    await user.type(screen.getByLabelText(/Date of joining/), '2024-01-01');
    await user.type(screen.getByLabelText(/Annual salary/), '123456.78');
    await user.click(screen.getByRole('button', { name: 'Add employee' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/employees/42'));
    const request = fetcher.mock.calls.find(([, init]) => init?.method === 'POST');
    expect(JSON.parse(String(request?.[1]?.body))).toMatchObject({
      fullName: 'Ada Lovelace',
      departmentId: 1,
      salary: 123456.78,
      status: 'ACTIVE',
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
