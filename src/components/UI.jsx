export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = '', title, subtitle, action }) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <div className="card-header">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({ label, value, helper, tone = 'teal', icon = '•' }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {helper && <div className="stat-helper">{helper}</div>}
      </div>
    </div>
  );
}

export function Badge({ children, tone }) {
  const derived = tone || String(children).toLowerCase().replaceAll(' ', '-');
  return <span className={`badge badge-${derived}`}>{children}</span>;
}

export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  return (
    <label className="search-box">
      <span>⌕</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, required, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}{required && <em> *</em>}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">○</div>
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

export function Notice({ tone = 'info', children }) {
  return <div className={`notice notice-${tone}`}>{children}</div>;
}
