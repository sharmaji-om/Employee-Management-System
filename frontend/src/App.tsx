// This file contains the app shell, login screen and page routes.
// It connects navigation and sign-in to the existing backend.
// Run npm run dev from the root to use the application.
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createBrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { api, ApiError, refreshCsrf, type User } from './api';
import { Avatar, ErrorNotice, Loading, ToastProvider, useToast } from './components';
import { Dashboard, EmployeeList } from './pages/Directory';
import { EmployeeDetails, EmployeeForm } from './pages/Employee';
import { Departments } from './pages/Departments';
import { UserContext } from './session';

function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">
        <Sparkles size={23} />
      </span>
      <span>
        northstar<span className="brand-caption">PEOPLE WORKSPACE</span>
      </span>
    </Link>
  );
}
function Shell() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [logoutError, setLogoutError] = useState<unknown>();
  const [loggingOut, setLoggingOut] = useState(false);
  const user = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/auth/me'), retry: false });
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    const expired = () => {
      client.clear();
      toast('Your session expired. Please sign in again.');
      navigate('/login', { replace: true });
    };
    window.addEventListener('session-expired', expired);
    return () => window.removeEventListener('session-expired', expired);
  }, [client, navigate, toast]);
  if (user.isPending) return <Loading />;
  if (user.error instanceof ApiError && user.error.status === 401)
    return <Navigate to="/login" replace />;
  if (user.error)
    return (
      <main className="standalone">
        <ErrorNotice error={user.error} retry={() => user.refetch()} />
      </main>
    );
  if (!user.data) return null;
  async function logout() {
    setLoggingOut(true);
    try {
      await api('/auth/logout', { method: 'POST' });
      await refreshCsrf();
      client.clear();
      navigate('/login');
    } catch (e) {
      setLogoutError(e);
    } finally {
      setLoggingOut(false);
    }
  }
  return (
    <UserContext.Provider value={user.data}>
      <div className="app-shell">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {open && (
          <button
            className="sidebar-overlay"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
        )}
        <aside className={`sidebar ${open ? 'open' : ''}`}>
          <Brand />
          <button
            className="mobile-close icon-button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
          <div className="workspace-switch">
            <span className="workspace-icon">N</span>
            <div>
              <strong>Northstar HQ</strong>
            </div>
            <ChevronDown size={15} />
          </div>
          <span className="nav-label">WORKSPACE</span>
          <nav aria-label="Main navigation">
            <NavLink to="/" end>
              <LayoutDashboard size={19} />
              Overview
            </NavLink>
            <NavLink to="/employees">
              <Users size={19} />
              People
            </NavLink>
            <NavLink to="/departments">
              <Building2 size={19} />
              Departments
            </NavLink>
          </nav>
          <div className="sidebar-bottom">
            <div className="sidebar-user">
              <Avatar name={user.data.email} />
              <div className="user-label">
                <strong title={user.data.email}>{user.data.email}</strong>
                <small>{user.data.role === 'ADMIN' ? 'Administrator' : user.data.role}</small>
              </div>
              <button
                className="icon-button"
                title="Sign out"
                aria-label="Sign out"
                disabled={loggingOut}
                onClick={logout}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="topbar-title">
              <button
                className="mobile-menu icon-button"
                aria-label="Open navigation"
                onClick={() => setOpen(true)}
              >
                <Menu />
              </button>
              <Link to="/">Workspace</Link>
              <span className="slash">/</span>
              <strong>
                {location.pathname.startsWith('/departments')
                  ? 'Departments'
                  : location.pathname.startsWith('/employees')
                    ? location.pathname === '/employees/new'
                      ? 'Add employee'
                      : location.pathname.endsWith('/edit')
                        ? 'Edit employee'
                        : location.pathname === '/employees'
                          ? 'People'
                          : 'Employee details'
                    : 'Overview'}
              </strong>
            </div>
          </header>
          <main id="main" className="content">
            {!!logoutError && <ErrorNotice error={logoutError} />}
            <Outlet />
          </main>
          <footer className="page-footer">
            <span>Northstar People</span>
            <span>v1.0</span>
          </footer>
        </div>
      </div>
    </UserContext.Provider>
  );
}
function Login() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const client = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<User>('/auth/me'), retry: false });
  if (me.data) return <Navigate to="/" replace />;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    try {
      await refreshCsrf();
      await api('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password }).toString(),
      });
      await refreshCsrf();
      await client.invalidateQueries({ queryKey: ['me'] });
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-story">
        <Brand />
        <div className="login-story-content">
          <span className="eyebrow">EMPLOYEE MANAGEMENT</span>
          <h1>
            Employee records.
            <br />
            Department directory.
          </h1>
          <p>
            Manage contact details, employment information
            <br className="desktop-only" /> and department assignments.
          </p>
          <div className="people-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="art-center">
              <Sparkles size={46} />
            </span>
            <span className="art-person person-one">AR</span>
            <span className="art-person person-two">PN</span>
            <span className="art-person person-three">KS</span>
            <span className="art-person person-four">MC</span>
            <span className="art-label">Northstar</span>
          </div>
        </div>
        <span className="login-footnote">NORTHSTAR PEOPLE · EMPLOYEE MANAGEMENT</span>
      </section>
      <section className="login-form-area">
        <div className="login-form">
          <span className="login-icon">
            <ShieldCheck size={26} />
          </span>
          <h2>Welcome back</h2>
          <p>Sign in to your people workspace.</p>
          {!!error && <ErrorNotice error={error} />}
          <form onSubmit={submit}>
            <label className="field">
              Email address
              <input
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              Password
              <div className="password-wrap">
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={show ? 'Hide password' : 'Show password'}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <button className="button primary login-submit" disabled={pending}>
              {pending ? 'Signing in…' : 'Sign in to workspace'}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="login-note">
            <ShieldCheck size={16} />
            <span>
              Admin access only. Need help signing in?
              <br />
              Contact your workspace administrator.
            </span>
          </div>
        </div>
        <span className="login-copyright">© {new Date().getFullYear()} Northstar People</span>
      </section>
    </div>
  );
}
function NotFound() {
  return (
    <div className="empty">
      <h1>That page isn't here.</h1>
      <p>The link may have changed.</p>
      <Link className="button primary" to="/">
        Back to overview
      </Link>
    </div>
  );
}
const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <Shell />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/employees', element: <EmployeeList /> },
      { path: '/employees/new', element: <EmployeeForm /> },
      { path: '/employees/:id', element: <EmployeeDetails /> },
      { path: '/employees/:id/edit', element: <EmployeeForm /> },
      { path: '/departments', element: <Departments /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
