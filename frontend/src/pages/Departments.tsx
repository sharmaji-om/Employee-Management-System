// This file displays departments and their employee counts.
// It provides the department create, edit and delete screens.
// Open Departments in the app after starting with npm run dev.
import { useState, type CSSProperties } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { api, ApiError, type Department } from '../api';
import { getDepartmentStyle } from '../departmentTheme';
import { Empty, ErrorNotice, Modal, PageHeader, useToast } from '../components';

export function Departments() {
  const client = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<Department | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const teams = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<Department[]>('/departments'),
  });
  const save = useMutation({
    mutationFn: () =>
      api('/departments' + (editing !== 'new' && editing ? '/' + editing.id : ''), {
        method: editing === 'new' ? 'POST' : 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          ...(editing !== 'new' && editing ? { version: editing.version } : {}),
        }),
      }),
    onSuccess: () => {
      client.invalidateQueries();
      setEditing(null);
      toast(`${name.trim()} department ${editing === 'new' ? 'created' : 'updated'}.`);
    },
  });
  const remove = useMutation({
    mutationFn: () =>
      api(`/departments/${deleting!.id}?version=${deleting!.version}`, { method: 'DELETE' }),
    onSuccess: () => {
      client.invalidateQueries();
      setDeleting(null);
      toast(`${deleting?.name} department deleted.`);
    },
  });
  function open(d: Department | 'new') {
    save.reset();
    setEditing(d);
    setName(d === 'new' ? '' : d.name);
    setDescription(d === 'new' ? '' : d.description);
  }
  return (
    <>
      <PageHeader
        title="Departments"
        description={
          teams.data
            ? `${teams.data.length} departments · ${teams.data.reduce((total, department) => total + department.employeeCount, 0)} employees`
            : 'Department directory'
        }
        actions={
          <button className="button primary add-department" onClick={() => open('new')}>
            <Plus size={18} />
            <span className="add-label">
              Add<span className="label-detail"> department</span>
            </span>
          </button>
        }
      />
      {teams.isPending ? (
        <div className="departments-grid" role="status" aria-label="Loading departments">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="panel department-skeleton" key={index} aria-hidden="true">
              <div className="skeleton skeleton-tile" />
              <div className="skeleton" />
              <div className="skeleton short" />
              <div className="skeleton" />
            </div>
          ))}
        </div>
      ) : teams.error ? (
        <ErrorNotice error={teams.error} retry={() => teams.refetch()} />
      ) : !teams.data.length ? (
        <section className="panel">
          <Empty
            title="Create your first department"
            description="Add a department to organize employees by team."
          >
            <button className="button primary add-department" onClick={() => open('new')}>
              <Plus size={17} />
              Add department
            </button>
          </Empty>
        </section>
      ) : (
        <div className="departments-grid">
          {teams.data.map((d) => {
            const theme = getDepartmentStyle(d.name);
            const Icon = theme.icon;
            return (
              <article
                className="panel department-card"
                key={d.id}
                style={
                  {
                    '--department-color': theme.iconColor,
                    '--department-soft': theme.tileBg,
                  } as CSSProperties
                }
              >
                <div className="department-card-top">
                  <span className="department-symbol">
                    <Icon size={23} />
                  </span>
                  <div>
                    <button
                      className="icon-button"
                      aria-label={`Edit ${d.name}`}
                      title={`Edit ${d.name}`}
                      onClick={() => open(d)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button danger-text"
                      aria-label={`Delete ${d.name}`}
                      title={`Delete ${d.name}`}
                      onClick={() => {
                        remove.reset();
                        setDeleting(d);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h2>{d.name}</h2>
                <p>{d.description?.trim() || theme.description}</p>
                <div className="department-card-bottom">
                  <div className="department-members">
                    {d.employeeCount > 0 ? (
                      <>
                        <span className="member-stack" aria-hidden="true">
                          {Array.from({ length: Math.min(d.employeeCount, 3) }, (_, index) => (
                            <span className="member-avatar" key={index}>
                              <UserRound size={14} />
                            </span>
                          ))}
                          {d.employeeCount > 3 && (
                            <span className="member-overflow">+{d.employeeCount - 3}</span>
                          )}
                        </span>
                        <span>
                          {d.employeeCount} {d.employeeCount === 1 ? 'employee' : 'employees'}
                        </span>
                      </>
                    ) : (
                      <span>No employees yet</span>
                    )}
                  </div>
                  <Link
                    to={`/employees?department=${d.id}`}
                    aria-label={`View ${d.name} employees`}
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {editing && (
        <Modal
          title={editing === 'new' ? 'Add a department' : 'Edit department'}
          onClose={() => {
            if (!save.isPending) setEditing(null);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <p className="modal-copy">Enter the department name and an optional description.</p>
            {save.error && <ErrorNotice error={save.error} />}
            <label className="field">
              Department name
              <input
                autoFocus
                required
                aria-describedby="department-name-error"
                aria-invalid={save.error instanceof ApiError && !!save.error.errors.name}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Engineering"
              />
              <span id="department-name-error" className="field-error">
                {save.error instanceof ApiError ? save.error.errors.name : null}
              </span>
              <span className="required-hint">Enter a department name.</span>
            </label>
            <label className="field">
              Description <span className="optional">(optional)</span>
              <textarea
                aria-describedby="department-description-error"
                maxLength={300}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the responsibilities of this department"
              />
              <span id="department-description-error" className="field-error">
                {save.error instanceof ApiError ? save.error.errors.description : null}
              </span>
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                disabled={save.isPending}
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button className="button primary" disabled={save.isPending || !name.trim()}>
                {save.isPending ? 'Saving…' : 'Save department'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title={`Delete ${deleting.name}?`}
          onClose={() => {
            if (!remove.isPending) setDeleting(null);
          }}
        >
          <p className="modal-copy">
            {deleting.employeeCount > 0
              ? `This department has ${deleting.employeeCount} employee(s). Reassign them before deleting the department.`
              : 'This department has 0 employees. This permanently removes the department and cannot be undone.'}
          </p>
          {remove.error && <ErrorNotice error={remove.error} />}
          <div className="modal-actions">
            <button
              className="button secondary"
              autoFocus
              disabled={remove.isPending}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
            {deleting.employeeCount > 0 ? (
              <Link className="button primary" to={`/employees?department=${deleting.id}`}>
                View employees
              </Link>
            ) : (
              <button
                className="button danger"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                {remove.isPending ? 'Deleting…' : 'Delete department'}
              </button>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
