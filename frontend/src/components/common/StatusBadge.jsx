import React from 'react';

export const StatusBadge = ({ status = '' }) => {
  if (!status) return null;
  const s = status.toUpperCase();

  let className = 'badge bg-secondary';
  let label = status;

  // Status mapping
  switch (s) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'WON':
    case 'CONVERTED':
    case 'RESOLVED':
      className = 'badge bg-success-subtle text-success border border-success-subtle';
      break;
    case 'INACTIVE':
    case 'LOST':
    case 'UNQUALIFIED':
    case 'CANCELLED':
    case 'CLOSED':
      className = 'badge bg-danger-subtle text-danger border border-danger-subtle';
      break;
    case 'LOCKED':
    case 'MISSED':
    case 'OVERDUE':
      className = 'badge bg-danger text-white';
      break;
    case 'NEW':
    case 'OPEN':
    case 'PLANNED':
      className = 'badge bg-primary-subtle text-primary border border-primary-subtle';
      break;
    case 'CONTACTED':
    case 'IN_PROGRESS':
    case 'PROPOSAL':
    case 'QUALIFICATION':
      className = 'badge bg-info-subtle text-info border border-info-subtle';
      break;
    case 'QUALIFIED':
    case 'NEGOTIATION':
      className = 'badge bg-warning-subtle text-warning border border-warning-subtle';
      break;
    case 'HOT':
      return <span className="badge-hot"><i className="bi bi-fire"></i> HOT</span>;
    case 'WARM':
      return <span className="badge-warm"><i className="bi bi-lightning-charge"></i> WARM</span>;
    case 'COLD':
      return <span className="badge-cold"><i className="bi bi-snow"></i> COLD</span>;
    default:
      className = 'badge bg-light text-dark border';
  }

  return (
    <span className={`px-2 py-1 rounded-pill fw-semibold ${className}`} style={{ fontSize: '0.75rem' }}>
      {label}
    </span>
  );
};

export const RoleBadge = ({ role = '' }) => {
  if (!role) return null;
  const r = role.toUpperCase();

  let className = 'badge-role-admin';
  let label = role;

  if (r === 'ADMIN') {
    className = 'badge-role badge-role-admin';
    label = 'ADMIN';
  } else if (r === 'MANAGER') {
    className = 'badge-role badge-role-manager';
    label = 'MANAGER';
  } else if (r === 'SALES_EXECUTIVE') {
    className = 'badge-role badge-role-sales';
    label = 'SALES EXECUTIVE';
  } else if (r === 'CUSTOMER') {
    className = 'badge-role badge-role-customer';
    label = 'CUSTOMER';
  }

  return <span className={className}>{label}</span>;
};
