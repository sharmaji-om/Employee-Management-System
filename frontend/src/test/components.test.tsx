// This file tests components behavior.
// It checks frontend behavior with the unit test environment.
// Run npm test from the frontend folder.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Badge, Empty, ErrorNotice } from '../components';
import { ApiError, date, initials } from '../api';
describe('Accessible feedback', () => {
  it('communicates employment status in text, not color alone', () => {
    render(<Badge status="INACTIVE" />);
    expect(screen.getByText('Inactive')).toBeVisible();
  });
  it('announces failures and allows a retry', async () => {
    const retry = vi.fn();
    render(
      <ErrorNotice
        error={new ApiError('Server unavailable', 503, {}, 'request-123')}
        retry={retry}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();
  });
  it('explains empty search results', () => {
    render(<Empty title="No matching employees" description="Try another search." />);
    expect(screen.getByRole('heading')).toHaveTextContent('No matching employees');
  });
  it('formats names and date-only values consistently', () => {
    expect(initials('Ananya Rao')).toBe('AR');
    expect(date('2024-01-02')).toBe('2 Jan 2024');
  });
});
