// This file displays the overview and employee directory.
// It provides employee search, filters, pagination and CSV export.
// Open Overview or People after starting with npm run dev.
import { useEffect, useState } from 'react';
import { getDepartmentStyle } from '../departmentTheme';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  UserCheck,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { api, date, params, type Department, type EmployeePage, type Stats } from '../api';
import { Avatar, Badge, Empty, ErrorNotice, Loading, PageHeader, useToast } from '../components';

export function StatsCards() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: () => api<Stats>('/employees/summary') });
  if (stats.error) return <ErrorNotice error={stats.error} retry={() => stats.refetch()} />;
  const values = [
    {
      label: 'Total employees',
      value: stats.data?.total,
      icon: Users,
      tone: 'purple',
      note: 'Your entire team, in one place',
    },
    {
      label: 'Active employees',
      value: stats.data?.active,
      icon: UserCheck,
      tone: 'green',
      note: 'Currently part of the team',
    },
    {
      label: 'Inactive employees',
      value: stats.data?.inactive,
      icon: UserMinus,
      tone: 'orange',
      note: 'Past and paused employment',
    },
    {
      label: 'Departments',
      value: stats.data?.departments,
      icon: Building2,
      tone: 'blue',
      note: 'Teams that make it happen',
    },
  ];
  return (
    <div className="stats-grid">
      {values.map((s) => (
        <div className="stat-card" key={s.label}>
          <div>
            <span className="stat-label">{s.label}</span>
            <span className={`stat-icon ${s.tone}`}>
              <s.icon size={20} />
            </span>
          </div>
          <strong>{s.value ?? '—'}</strong>
          <small>{s.note}</small>
        </div>
      ))}
    </div>
  );
}
export function Dashboard() {
  const people = useQuery({
    queryKey: ['recent'],
    queryFn: () => api<EmployeePage>('/employees?size=5&sort=joiningDate&direction=desc'),
  });
  const teams = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<Department[]>('/departments'),
  });
  return (
    <>
      <PageHeader
        eyebrow="YOUR PEOPLE, AT A GLANCE"
        title="Overview"
        description="Employee counts, departments and recent additions."
        actions={
          <Link className="button primary" to="/employees/new">
            <Plus size={18} />
            Add employee
          </Link>
        }
      />
      <StatsCards />
      <div className="overview-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Newest team members</h2>
              <p>Recently added employee records.</p>
            </div>
            <Link className="text-link" to="/employees">
              View all
              <ArrowRight size={16} />
            </Link>
          </div>
          {people.isPending ? (
            <Loading />
          ) : people.error ? (
            <ErrorNotice error={people.error} retry={() => people.refetch()} />
          ) : people.data.content.length === 0 ? (
            <Empty title="No employees yet" description="Add an employee to start the directory." />
          ) : (
            <div className="recent-list">
              {people.data.content.map((e) => (
                <Link to={`/employees/${e.id}`} className="recent-person" key={e.id}>
                  <Avatar name={e.fullName} />
                  <div>
                    <strong>{e.fullName}</strong>
                    <small>
                      {e.designation} · {e.departmentName}
                    </small>
                  </div>
                  <span>{date(e.joiningDate)}</span>
                  <ChevronRight size={17} />
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Across the organization</h2>
              <p>Employee counts by department.</p>
            </div>
          </div>
          {teams.isPending ? (
            <Loading />
          ) : teams.error ? (
            <ErrorNotice error={teams.error} retry={() => teams.refetch()} />
          ) : !teams.data.length ? (
            <Empty title="No departments yet" description="Create a department to get started." />
          ) : (
            <div className="team-chart">
              {teams.data.map((d) => (
                <Link to={`/employees?department=${d.id}`} key={d.id}>
                  <div>
                    <span>{d.name}</span>
                    <strong>{d.employeeCount}</strong>
                  </div>
                  <div className="bar-track">
                    <i
                      style={{
                        backgroundColor: getDepartmentStyle(d.name).iconColor,
                        width: `${Math.max(3, (d.employeeCount / Math.max(...teams.data.map((t) => t.employeeCount), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link className="panel-bottom-link" to="/departments">
            Manage departments
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <div className="welcome-strip">
        <span className="stat-icon purple">
          <Users size={23} />
        </span>
        <div>
          <h3>Keep employee records up to date.</h3>
          <p>
            Keep employee profiles up to date, so your team always has a reliable source of truth.
          </p>
        </div>
        <Link to="/employees">
          Explore directory
          <ArrowRight size={17} />
        </Link>
      </div>
    </>
  );
}
export function EmployeeList() {
  const [sp, setSp] = useSearchParams();
  const search = sp.get('search') ?? '';
  const [draft, setDraft] = useState(search);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<unknown>();
  const toast = useToast();
  const page = Math.max(0, Number(sp.get('page')) || 0);
  const size = [10, 25, 50].includes(Number(sp.get('size'))) ? Number(sp.get('size')) : 10;
  const department = sp.get('department') ?? '';
  const status = sp.get('status') ?? '';
  const sort = sp.get('sort') ?? 'fullName';
  const direction = sp.get('direction') ?? 'asc';
  function update(values: Record<string, string>) {
    setSp((current) => {
      const p = new URLSearchParams(current);
      Object.entries(values).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
      if (!('page' in values)) p.delete('page');
      return p;
    });
  }
  useEffect(() => {
    setDraft(search);
  }, [search]);
  useEffect(() => {
    if (draft === search) return;
    const t = setTimeout(
      () =>
        setSp(
          (current) => {
            const p = new URLSearchParams(current);
            if (draft) p.set('search', draft);
            else p.delete('search');
            p.delete('page');
            return p;
          },
          { replace: true },
        ),
      300,
    );
    return () => clearTimeout(t);
  }, [draft, search, setSp]);
  const query = params({ search, department, status, page, size, sort, direction });
  const people = useQuery({
    queryKey: ['employees', query],
    queryFn: () => api<EmployeePage>('/employees?' + query),
  });
  const teams = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<Department[]>('/departments'),
  });
  async function exportCsv(all: boolean) {
    setExporting(true);
    setExportError(undefined);
    try {
      const blob = await api<Blob>(
        '/employees/export?' + (all ? '' : params({ search, department, status })),
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'northstar-employees.csv';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast('Employee export downloaded.');
    } catch (e) {
      setExportError(e);
    } finally {
      setExporting(false);
    }
  }
  const filtered = !!(search || department || status);
  return (
    <>
      <PageHeader
        title="People"
        description="Search, filter and manage employee records."
        actions={
          <>
            <button
              className="button secondary"
              disabled={exporting}
              onClick={() => exportCsv(false)}
            >
              <ArrowDownToLine size={17} />
              {exporting ? 'Exporting…' : filtered ? 'Export results' : 'Export CSV'}
            </button>
            <Link className="button primary" to="/employees/new">
              <Plus size={18} />
              Add employee
            </Link>
          </>
        }
      />
      <StatsCards />
      {!!exportError && <ErrorNotice error={exportError} />}
      <section className="panel directory-panel">
        <div className="directory-heading">
          <div>
            <h2>
              Employee directory{' '}
              <span className="count-chip">{people.data?.totalElements ?? '—'}</span>
            </h2>
            <p>Contact details, departments and employment status.</p>
          </div>
          <span className="directory-caption">
            <Users size={15} /> TEAM DIRECTORY
          </span>
        </div>
        <div className="filter-bar">
          <div className="search-input">
            <Search size={18} />
            <input
              aria-label="Search employees"
              maxLength={100}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search by name or email…"
            />
            {draft && (
              <button aria-label="Clear search" onClick={() => setDraft('')}>
                <X size={15} />
              </button>
            )}
          </div>
          <div className="filter-controls">
            <SlidersHorizontal size={17} />
            <select
              aria-label="Filter by department"
              value={department}
              onChange={(e) => update({ department: e.target.value })}
            >
              <option value="">All departments</option>
              {teams.data?.map((d) => (
                <option value={d.id} key={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => update({ status: e.target.value })}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            {filtered && (
              <button
                className="text-link"
                onClick={() => {
                  setDraft('');
                  setSp({});
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
        {teams.error && <ErrorNotice error={teams.error} retry={() => teams.refetch()} />}
        <div className="mobile-sort">
          <label>
            Sort by{' '}
            <select
              aria-label="Sort employees"
              value={sort}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="fullName">Name</option>
              <option value="joiningDate">Joining date</option>
              <option value="department">Department</option>
            </select>
          </label>
          <button
            className="icon-button"
            aria-label="Reverse sort direction"
            onClick={() => update({ direction: direction === 'asc' ? 'desc' : 'asc' })}
          >
            <ArrowDownUpIcon />
          </button>
        </div>
        {people.isPending ? (
          <Loading label="Loading your people…" />
        ) : people.error ? (
          <ErrorNotice error={people.error} retry={() => people.refetch()} />
        ) : !people.data.content.length ? (
          <Empty
            title={
              filtered ? 'No matching employees' : 'Your directory is ready for its first person'
            }
            description={
              filtered
                ? 'Try a different search or clear your filters.'
                : 'Add an employee to start building your team directory.'
            }
          >
            {filtered ? (
              <button
                className="button secondary"
                onClick={() => {
                  setDraft('');
                  setSp({});
                }}
              >
                Clear filters
              </button>
            ) : page > 0 ? (
              <button className="button secondary" onClick={() => update({ page: '0' })}>
                Back to first page
              </button>
            ) : (
              <Link className="button primary" to="/employees/new">
                <Plus size={17} />
                Add employee
              </Link>
            )}
          </Empty>
        ) : (
          <>
            <div className="table-wrap">
              <table className="employee-table">
                <thead>
                  <tr>
                    {[
                      ['fullName', 'Employee'],
                      ['department', 'Department'],
                      ['designation', 'Designation'],
                      ['status', 'Status'],
                      ['joiningDate', 'Date joined'],
                    ].map(([key, label]) => (
                      <th key={key}>
                        {key === 'designation' ? (
                          label
                        ) : (
                          <button
                            onClick={() =>
                              update({
                                sort: key,
                                direction: sort === key && direction === 'asc' ? 'desc' : 'asc',
                              })
                            }
                          >
                            {label}
                            {sort === key ? (
                              <ArrowDown
                                size={13}
                                style={{
                                  transform: direction === 'asc' ? 'rotate(180deg)' : undefined,
                                }}
                              />
                            ) : (
                              <ArrowUpDown size={12} />
                            )}
                          </button>
                        )}
                      </th>
                    ))}
                    <th>
                      <span className="sr-only">View profile</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {people.data.content.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <Link className="employee-name" to={`/employees/${e.id}`}>
                          <Avatar name={e.fullName} />
                          <span>
                            <strong>{e.fullName}</strong>
                            <small>{e.email}</small>
                          </span>
                        </Link>
                      </td>
                      <td>
                        <span className="department-pill">{e.departmentName}</span>
                      </td>
                      <td className="designation-cell">{e.designation}</td>
                      <td>
                        <Badge status={e.status} />
                      </td>
                      <td className="date-cell">{date(e.joiningDate)}</td>
                      <td>
                        <Link
                          className="icon-button"
                          to={`/employees/${e.id}`}
                          aria-label={`View ${e.fullName}`}
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-people">
              {people.data.content.map((e) => (
                <Link className="mobile-person" key={e.id} to={`/employees/${e.id}`}>
                  <div>
                    <Avatar name={e.fullName} />
                    <span>
                      <strong>{e.fullName}</strong>
                      <small>{e.designation}</small>
                    </span>
                    <ChevronRight size={18} />
                  </div>
                  <footer>
                    <span>{e.departmentName}</span>
                    <Badge status={e.status} />
                  </footer>
                </Link>
              ))}
            </div>
          </>
        )}
        <div className="pagination">
          <div>
            Showing{' '}
            <strong>
              {people.data?.content.length ? page * size + 1 : 0}–
              {people.data ? Math.min((page + 1) * size, people.data.totalElements) : 0}
            </strong>{' '}
            of <strong>{people.data?.totalElements ?? 0}</strong> employees
          </div>
          <div className="pagination-controls">
            <label>
              Rows per page
              <select
                aria-label="Rows per page"
                value={size}
                onChange={(e) => update({ size: e.target.value })}
              >
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
            </label>
            <button
              className="icon-button"
              aria-label="Previous page"
              disabled={page === 0 || people.isPending}
              onClick={() => update({ page: String(page - 1) })}
            >
              <ChevronLeft size={17} />
            </button>
            {Array.from(
              { length: Math.min(5, Math.max(1, people.data?.totalPages ?? 1)) },
              (_, index) => {
                const pageIndex =
                  Math.max(0, Math.min(page - 2, (people.data?.totalPages ?? 1) - 5)) + index;
                return (
                  <button
                    key={pageIndex}
                    className={pageIndex === page ? 'page-number' : 'icon-button'}
                    aria-label={`Page ${pageIndex + 1}`}
                    aria-current={pageIndex === page ? 'page' : undefined}
                    disabled={people.isPending}
                    onClick={() => update({ page: String(pageIndex) })}
                  >
                    {pageIndex + 1}
                  </button>
                );
              },
            )}
            <button
              className="icon-button"
              aria-label="Next page"
              disabled={!people.data || page + 1 >= people.data.totalPages}
              onClick={() => update({ page: String(page + 1) })}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
      {filtered && (
        <div className="export-all">
          <span>Need the complete directory?</span>
          <button className="text-link" disabled={exporting} onClick={() => exportCsv(true)}>
            Export all employees
            <ArrowDownToLine size={14} />
          </button>
        </div>
      )}
    </>
  );
}
function ArrowDownUpIcon() {
  return <ArrowUpDown size={17} />;
}
