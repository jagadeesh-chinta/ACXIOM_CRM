import React from 'react';

export const LoadingSpinner = ({ message = 'Loading data...' }) => (
  <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
    <div className="spinner-border text-primary mb-3" style={{ width: '2.5rem', height: '2.5rem' }} role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <div className="text-muted small fw-medium">{message}</div>
  </div>
);

export const SkeletonLoader = ({ rows = 5, cols = 4 }) => (
  <div className="p-3">
    <div className="skeleton-line mb-4" style={{ height: '32px', width: '40%' }}></div>
    {Array.from({ length: rows }).map((_, rIdx) => (
      <div key={rIdx} className="d-flex gap-3 mb-3">
        {Array.from({ length: cols }).map((_, cIdx) => (
          <div key={cIdx} className="skeleton-line flex-grow-1" style={{ height: '24px' }}></div>
        ))}
      </div>
    ))}
  </div>
);

export const EmptyState = ({
  icon = 'bi-inbox',
  title = 'No records found',
  description = 'There is currently no data matching your criteria.',
  actionLabel,
  onAction
}) => (
  <div className="saas-card text-center p-5 my-3 d-flex flex-column align-items-center justify-content-center">
    <div
      className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3 text-secondary"
      style={{ width: '64px', height: '64px', fontSize: '2rem' }}
    >
      <i className={`bi ${icon}`}></i>
    </div>
    <h5 className="fw-bold text-dark mb-1">{title}</h5>
    <p className="text-muted small mb-3" style={{ maxWidth: '360px' }}>
      {description}
    </p>
    {actionLabel && onAction && (
      <button onClick={onAction} className="btn btn-primary-gradient btn-sm">
        <i className="bi bi-plus-lg me-1"></i> {actionLabel}
      </button>
    )}
  </div>
);

export const ErrorState = ({
  message = 'Unable to load records. Please try again.',
  onRetry
}) => (
  <div className="saas-card text-center p-5 my-3 border-danger-subtle bg-danger-subtle bg-opacity-10">
    <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-2"></i>
    <h5 className="fw-bold text-dark mt-2">Error Loading Information</h5>
    <p className="text-secondary small mb-3">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn btn-outline-danger btn-sm">
        <i className="bi bi-arrow-clockwise me-1"></i> Retry Request
      </button>
    )}
  </div>
);
