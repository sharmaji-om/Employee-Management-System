// This file defines API types and frontend request helpers.
// It handles sessions, request errors and display formatting.
// The development server forwards API requests to the backend.
export type Status = 'ACTIVE' | 'INACTIVE';
export interface Employee {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: number;
  departmentName: string;
  designation: string;
  joiningDate: string;
  salary: number;
  status: Status;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface Department {
  id: number;
  name: string;
  description: string;
  version: number;
  employeeCount: number;
}
export interface EmployeePage {
  content: Employee[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
export interface Stats {
  total: number;
  active: number;
  inactive: number;
  departments: number;
}
export interface User {
  email: string;
  role: string;
  currency: string;
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string> = {},
    public requestId = '',
  ) {
    super(message);
  }
}
let csrf: { token: string; headerName: string } | undefined;
export async function refreshCsrf() {
  const response = await fetch('/api/v1/auth/csrf', {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!response.ok)
    throw new ApiError('Unable to establish a secure session. Please retry.', response.status);
  csrf = await response.json();
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const method = options.method ?? 'GET';
  if (!['GET', 'HEAD'].includes(method)) {
    if (!csrf) await refreshCsrf();
    headers.set(csrf!.headerName, csrf!.token);
    if (typeof options.body === 'string' && !headers.has('Content-Type'))
      headers.set('Content-Type', 'application/json');
  }
  let response: Response;
  try {
    response = await fetch('/api/v1' + path, {
      ...options,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && path != '/auth/login' && path != '/auth/me')
      window.dispatchEvent(new Event('session-expired'));
    if (response.status === 403) csrf = undefined;
    throw new ApiError(
      data.message ?? 'The request could not be completed.',
      response.status,
      data.errors,
      data.requestId,
    );
  }
  if (response.status === 204) return undefined as T;
  if (response.headers.get('content-type')?.includes('text/csv'))
    return (await response.blob()) as T;
  return response.json();
}
export function params(values: Record<string, string | number | undefined>) {
  const p = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') p.set(key, String(value));
  });
  return p.toString();
}
export const money = (value: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(
    value,
  );
export const date = (value: string) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value + 'T12:00:00'),
  );
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
