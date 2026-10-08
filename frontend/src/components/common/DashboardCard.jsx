import React from 'react';

export const DashboardCard = ({
  title,
  value,
  subtext,
  icon,
  iconBg = 'bg-primary-subtle',
  iconColor = 'text-primary',
  trend,
  trendType = 'up'
}) => {
  return (
    <div className="saas-card saas-card-hover p-4 h-100 d-flex flex-column justify-content-between">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div>
          <span className="text-muted small fw-semibold text-uppercase tracking-wider">{title}</span>
          <h2 className="fw-bold fs-3 text-dark mb-0 mt-1">{value}</h2>
        </div>
        <div
          className={`d-flex align-items-center justify-content-center rounded-3 ${iconBg} ${iconColor}`}
          style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
        >
          <i className={`bi ${icon}`}></i>
        </div>
      </div>

      {(subtext || trend) && (
        <div className="d-flex align-items-center gap-2 pt-2 border-top border-light-subtle">
          {trend && (
            <span
              className={`small fw-bold d-flex align-items-center gap-1 ${
                trendType === 'up' ? 'text-success' : 'text-danger'
              }`}
            >
              <i className={`bi bi-arrow-${trendType === 'up' ? 'up-right' : 'down-right'}`}></i>
              {trend}
            </span>
          )}
          {subtext && <span className="text-secondary small">{subtext}</span>}
        </div>
      )}
    </div>
  );
};

export const ChartCard = ({ title, subtitle, children, headerAction }) => {
  return (
    <div className="saas-card p-4 h-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold text-dark mb-0">{title}</h5>
          {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
        </div>
        {headerAction && <div>{headerAction}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};
