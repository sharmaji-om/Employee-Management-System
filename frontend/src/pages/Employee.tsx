// This file displays employee profiles and employee forms.
// It supports viewing, adding, editing and deleting employee records.
// Open People in the running app to access these screens.
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import { api, ApiError, date, money, type Department, type Employee } from '../api';
import {
  Avatar,
  Badge,
  Breadcrumb,
  ErrorNotice,
  Loading,
  Modal,
  PageHeader,
  UnsavedGuard,
  useToast,
} from '../components';
import { useUser } from '../session';

export const employeeSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Enter the full name.')
    .max(100, 'Use 100 characters or fewer.'),
  email: z.email('Enter a valid email address.').max(254),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9() .-]{7,25}$/, 'Enter a valid phone number (7–25 characters).'),
  departmentId: z.string().min(1, 'Choose a department.'),
  designation: z.string().trim().min(1, 'Enter a designation.').max(100),
  joiningDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a joining date.')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Choose a valid date.'),
  salary: z
    .string()
    .regex(/^\d{1,12}(\.\d{1,2})?$/, 'Enter a nonnegative amount with up to two decimal places.'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});
type Fields = z.infer<typeof employeeSchema>;
export function EmployeeForm() {
  const { id } = useParams();
  const editing = !!id;
  const user = useUser();
  const navigate = useNavigate();
  const toast = useToast();
  const client = useQueryClient();
  const employee = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api<Employee>('/employees/' + id),
    enabled: editing,
  });
  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: () => api<Department[]>('/departments'),
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<Fields>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      departmentId: '',
      designation: '',
      joiningDate: '',
      salary: '',
      status: 'ACTIVE',
    },
  });
  const [loadedVersion, setLoadedVersion] = useState<number>();
  useEffect(() => {
    if (employee.data && loadedVersion === undefined) {
      const e = employee.data;
      reset({ ...e, departmentId: String(e.departmentId), salary: String(e.salary) });
      setLoadedVersion(e.version);
    }
  }, [employee.data, loadedVersion, reset]);
  const mutation = useMutation({
    mutationFn: (data: Fields) =>
      api<Employee>('/employees' + (editing ? '/' + id : ''), {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({
          ...data,
          departmentId: Number(data.departmentId),
          salary: Number(data.salary),
          ...(editing ? { version: loadedVersion } : {}),
        }),
      }),
    onSuccess: () => {
      reset();
      client.invalidateQueries();
      toast(editing ? 'Employee details updated.' : 'Your new team member has been added.');
    },
    onError: (error) => {
      if (error instanceof ApiError)
        Object.entries(error.errors).forEach(([key, message]) =>
          setError(key as keyof Fields, { message }),
        );
    },
  });
  useEffect(() => {
    if (mutation.isSuccess && mutation.data) navigate('/employees/' + mutation.data.id);
  }, [mutation.isSuccess, mutation.data, navigate]);
  if (editing && employee.isPending) return <Loading />;
  if (editing && employee.error)
    return <ErrorNotice error={employee.error} retry={() => employee.refetch()} />;
  const fieldError = (name: keyof Fields) =>
    errors[name] ? (
      <span className="field-error" id={`${name}-error`}>
        {errors[name]?.message}
      </span>
    ) : null;
  const attrs = (name: keyof Fields) => ({
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });
  return (
    <>
      <UnsavedGuard dirty={isDirty && !mutation.isSuccess} />
      <Breadcrumb current={editing ? 'Edit employee' : 'Add employee'} />
      <PageHeader
        title={editing ? 'Edit employee' : 'Add employee'}
        description={
          editing
            ? 'Update contact and employment information.'
            : 'Enter contact and employment information to create a record.'
        }
      />
      <div className="form-layout">
        <form
          className="panel employee-form"
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          noValidate
        >
          {mutation.error && <ErrorNotice error={mutation.error} />}
          <section className="form-section">
            <div className="section-title">
              <span>
                <UserRound size={20} />
              </span>
              <div>
                <h2>Personal information</h2>
                <p>Name, email address and phone number.</p>
              </div>
            </div>
            <div className="form-grid">
              <label className="field full">
                Full name <span className="required">*</span>
                <input
                  {...register('fullName')}
                  {...attrs('fullName')}
                  placeholder="e.g. Ananya Rao"
                  autoComplete="name"
                  maxLength={100}
                />
                {fieldError('fullName')}
              </label>
              <label className="field">
                Email address <span className="required">*</span>
                <input
                  {...register('email')}
                  {...attrs('email')}
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  maxLength={254}
                />
                {fieldError('email')}
              </label>
              <label className="field">
                Phone number <span className="required">*</span>
                <input
                  {...register('phone')}
                  {...attrs('phone')}
                  type="tel"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  maxLength={25}
                />
                {fieldError('phone')}
              </label>
            </div>
          </section>
          <section className="form-section">
            <div className="section-title">
              <span>
                <BriefcaseBusiness size={20} />
              </span>
              <div>
                <h2>Employment details</h2>
                <p>Department, designation, joining date and salary.</p>
              </div>
            </div>
            {departments.error && (
              <ErrorNotice error={departments.error} retry={() => departments.refetch()} />
            )}
            <div className="form-grid">
              <label className="field">
                Department <span className="required">*</span>
                <select
                  {...register('departmentId')}
                  {...attrs('departmentId')}
                  disabled={departments.isPending}
                >
                  <option value="">
                    {departments.isPending ? 'Loading departments…' : 'Select a department'}
                  </option>
                  {departments.data?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {fieldError('departmentId')}
                {departments.data?.length === 0 && (
                  <small>Create a department from the Departments page first.</small>
                )}
              </label>
              <label className="field">
                Designation <span className="required">*</span>
                <input
                  {...register('designation')}
                  {...attrs('designation')}
                  placeholder="e.g. Product Designer"
                  maxLength={100}
                />
                {fieldError('designation')}
              </label>
              <label className="field">
                Date of joining <span className="required">*</span>
                <input {...register('joiningDate')} {...attrs('joiningDate')} type="date" />
                {fieldError('joiningDate')}
              </label>
              <label className="field">
                Annual salary ({user.currency}) <span className="required">*</span>
                <input
                  {...register('salary')}
                  {...attrs('salary')}
                  inputMode="decimal"
                  placeholder="e.g. 900000.00"
                />
                {fieldError('salary')}
              </label>
              <label className="field">
                Employment status <span className="required">*</span>
                <select {...register('status')} {...attrs('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                {fieldError('status')}
              </label>
            </div>
          </section>
          <div className="form-actions">
            <Link className="button secondary" to={editing ? '/employees/' + id : '/employees'}>
              Cancel
            </Link>
            <button
              className="button primary"
              disabled={mutation.isPending || departments.isPending || !!departments.error}
            >
              {mutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add employee'}
              <Check size={17} />
            </button>
          </div>
        </form>
        <aside className="form-aside">
          <span className="aside-illustration">
            <UserRound size={38} />
            <span>+</span>
          </span>
          <h3>Profile requirements</h3>
          <p>Enter contact and employment information for the employee.</p>
          <ul>
            <li>
              <Check size={15} />
              Employee IDs are generated automatically.
            </li>
            <li>
              <Check size={15} />
              Email addresses must be unique.
            </li>
            <li>
              <Check size={15} />
              All fields marked * are required.
            </li>
          </ul>
          <div className="privacy-note">
            <ShieldCheck size={18} />
            <span>Employee information is only accessible to authorized administrators.</span>
          </div>
        </aside>
      </div>
    </>
  );
}
export function EmployeeDetails() {
  const { id } = useParams();
  const user = useUser();
  const navigate = useNavigate();
  const toast = useToast();
  const client = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const employee = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api<Employee>('/employees/' + id),
  });
  const remove = useMutation({
    mutationFn: () =>
      api('/employees/' + id + '?version=' + employee.data!.version, { method: 'DELETE' }),
    onSuccess: () => {
      client.invalidateQueries();
      toast('Employee deleted.');
      navigate('/employees');
    },
  });
  if (employee.isPending) return <Loading />;
  if (employee.error)
    return <ErrorNotice error={employee.error} retry={() => employee.refetch()} />;
  const e = employee.data;
  return (
    <>
      <Breadcrumb current={e.fullName} />
      <PageHeader
        title="Employee profile"
        description="Contact information and employment details."
        actions={
          <>
            <button className="button secondary danger-text" onClick={() => setConfirm(true)}>
              <Trash2 size={17} />
              Delete employee
            </button>
            <Link className="button primary" to={`/employees/${id}/edit`}>
              <Pencil size={17} />
              Edit profile
            </Link>
          </>
        }
      />
      <section className="panel profile-panel">
        <div className="profile-cover">
          <span>NORTHSTAR / OUR PEOPLE</span>
          <div className="cover-orbit" />
        </div>
        <div className="profile-heading">
          <Avatar name={e.fullName} large />
          <div>
            <div className="profile-name">
              <h2>{e.fullName}</h2>
              <Badge status={e.status} />
            </div>
            <p>
              {e.designation} <span>·</span> {e.departmentName}
            </p>
            <small>{e.employeeId}</small>
          </div>
        </div>
        <div className="profile-content">
          <section>
            <h3>
              <UserRound size={18} />
              Personal information
            </h3>
            <dl>
              <div>
                <dt>Email address</dt>
                <dd>
                  <Mail size={16} />
                  <a href={`mailto:${e.email}`}>{e.email}</a>
                </dd>
              </div>
              <div>
                <dt>Phone number</dt>
                <dd>
                  <Phone size={16} />
                  <a href={`tel:${e.phone}`}>{e.phone}</a>
                </dd>
              </div>
              <div>
                <dt>Full name</dt>
                <dd>{e.fullName}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h3>
              <BriefcaseBusiness size={18} />
              Employment details
            </h3>
            <dl>
              <div>
                <dt>Department</dt>
                <dd>
                  <MapPin size={16} />
                  {e.departmentName}
                </dd>
              </div>
              <div>
                <dt>Designation</dt>
                <dd>{e.designation}</dd>
              </div>
              <div>
                <dt>Date of joining</dt>
                <dd>
                  <CalendarDays size={16} />
                  {date(e.joiningDate)}
                </dd>
              </div>
              <div>
                <dt>Annual salary</dt>
                <dd>{money(e.salary, user.currency)}</dd>
              </div>
              <div>
                <dt>Employment status</dt>
                <dd>
                  <Badge status={e.status} />
                </dd>
              </div>
            </dl>
          </section>
        </div>
        <div className="profile-footer">
          <ShieldCheck size={15} />
          Confidential employee information
          <span>
            Updated{' '}
            {new Date(e.updatedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </section>
      <Link to="/employees" className="back-link">
        <ArrowLeft size={16} />
        Back to employee directory
      </Link>
      {confirm && (
        <Modal
          title={`Delete ${e.fullName}?`}
          onClose={() => {
            if (!remove.isPending) setConfirm(false);
          }}
        >
          <p className="modal-copy">
            This permanently removes <strong>{e.fullName}</strong> ({e.employeeId}) from your
            employee directory. This action cannot be undone.
          </p>
          {remove.error && <ErrorNotice error={remove.error} />}
          <div className="modal-actions">
            <button
              className="button secondary"
              disabled={remove.isPending}
              onClick={() => setConfirm(false)}
            >
              Keep employee
            </button>
            <button
              className="button danger"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
            >
              {remove.isPending ? 'Deleting…' : 'Delete employee'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
