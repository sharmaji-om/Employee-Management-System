// This file provides shared controls, dialogs and feedback messages.
// Pages use these components for consistent appearance and accessibility.
// Run npm run dev from the root to view them in the application.
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, Check, ChevronRight, LoaderCircle, SearchX, X } from 'lucide-react';
import { Link, useBlocker } from 'react-router-dom';
import { ApiError, initials, type Status } from './api';

const ToastContext = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  return (
    <ToastContext.Provider value={setMessage}>
      {children}
      {message && (
        <div className="toast" role="status">
          <Check size={18} />
          {message}
          <button aria-label="Dismiss notification" onClick={() => setMessage('')}>
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const color = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 5;
  return (
    <span aria-hidden="true" className={`avatar color-${color} ${large ? 'large' : ''}`}>
      {initials(name)}
    </span>
  );
}
export function Badge({ status }: { status: Status }) {
  return (
    <span className={`badge ${status.toLowerCase()}`}>
      <i />
      {status === 'ACTIVE' ? 'Active' : 'Inactive'}
    </span>
  );
}
export function ErrorNotice({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="error-notice" role="alert">
      <AlertCircle size={19} />
      <div>
        <strong>{error instanceof Error ? error.message : 'Something went wrong.'}</strong>
        {error instanceof ApiError && error.requestId && (
          <small>Request ID: {error.requestId}</small>
        )}
      </div>
      {retry && (
        <button className="button small secondary" onClick={retry}>
          Retry
        </button>
      )}
    </div>
  );
}
export function Loading({ label = 'Loading workspace…' }: { label?: string }) {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{label}</span>
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton short" />
    </div>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <SearchX size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <title>{title} · Northstar</title>
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
export function Breadcrumb({ current }: { current: string }) {
  return (
    <div className="breadcrumb">
      <Link to="/employees">People</Link>
      <ChevronRight size={14} />
      <span>{current}</span>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    const dialog = ref.current;
    return () => {
      dialog?.close();
      previousFocus?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      aria-modal="true"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <h2 id="modal-title">{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function UnsavedGuard({ dirty }: { dirty: boolean }) {
  const blocker = useBlocker(dirty);
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
  return blocker.state === 'blocked' ? (
    <Modal title="Leave without saving?" onClose={() => blocker.reset()}>
      <p className="modal-copy">
        Your changes haven't been saved. Stay here to finish editing or discard them.
      </p>
      <div className="modal-actions">
        <button className="button secondary" onClick={() => blocker.reset()}>
          Keep editing
        </button>
        <button className="button danger" onClick={() => blocker.proceed()}>
          Discard changes
        </button>
      </div>
    </Modal>
  ) : null;
}
