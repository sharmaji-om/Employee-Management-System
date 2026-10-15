// This file tests departments behavior.
// It checks frontend behavior with the unit test environment.
// Run npm test from the frontend folder.
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api';
import { Departments } from '../pages/Departments';

vi.mock('../api', async (original) => ({
  ...(await original<typeof import('../api')>()),
  api: vi.fn(),
}));

function renderDepartments() {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <Departments />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => vi.resetAllMocks());

describe('Department directory presentation', () => {
  it('uses real counts and stored descriptions, with a factual fallback for an empty description', async () => {
    vi.mocked(api).mockResolvedValue([
      {
        id: 1,
        name: 'Design',
        description: 'Accessibility research',
        employeeCount: 4,
        version: 0,
      },
      { id: 2, name: 'Engineering', description: '', employeeCount: 0, version: 0 },
    ]);
    renderDepartments();
    expect(await screen.findByText('2 departments · 4 employees')).toBeInTheDocument();
    expect(screen.getByText('Accessibility research')).toBeInTheDocument();
    expect(screen.getByText('Backend, frontend and QA')).toBeInTheDocument();
    expect(screen.getByText('No employees yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Design employees' })).toHaveAttribute(
      'href',
      '/employees?department=1',
    );
    expect(screen.getByRole('button', { name: 'Delete Design' })).toHaveAttribute(
      'title',
      'Delete Design',
    );
  });

  it('provides six skeleton cards while loading', () => {
    vi.mocked(api).mockReturnValue(new Promise(() => {}));
    const { container } = renderDepartments();
    expect(screen.getByRole('status', { name: 'Loading departments' })).toBeInTheDocument();
    expect(container.querySelectorAll('.department-skeleton')).toHaveLength(6);
  });

  it('keeps a clear empty state when no departments exist', async () => {
    vi.mocked(api).mockResolvedValue([]);
    renderDepartments();
    expect(await screen.findByText('Create your first department')).toBeInTheDocument();
    expect(screen.getByText('0 departments · 0 employees')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Add department' })).toHaveLength(2);
  });
});
