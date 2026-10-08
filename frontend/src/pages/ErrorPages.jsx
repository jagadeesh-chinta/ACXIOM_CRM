import React from 'react';
import { Link } from 'react-router-dom';

export const ForbiddenPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-4">
      <div className="saas-card text-center p-5 shadow-lg max-w-md" style={{ maxWidth: '480px' }}>
        <div
          className="rounded-circle bg-danger-subtle text-danger mx-auto d-flex align-items-center justify-content-center mb-3"
          style={{ width: '80px', height: '80px', fontSize: '2.5rem' }}
        >
          <i className="bi bi-shield-lock-fill"></i>
        </div>
        <h2 className="fw-bold text-dark mb-2">403 - Access Forbidden</h2>
        <p className="text-secondary small mb-4">
          You do not have the required permissions to view this resource. Role-based security access control is strictly enforced on this endpoint.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <Link to="/dashboard" className="btn btn-primary-gradient btn-sm px-4">
            <i className="bi bi-house-door me-1"></i> Return to Dashboard
          </Link>
          <Link to="/" className="btn btn-outline-secondary btn-sm px-4">
            Home Page
          </Link>
        </div>
      </div>
    </div>
  );
};

export const NotFoundPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-4">
      <div className="saas-card text-center p-5 shadow-lg max-w-md" style={{ maxWidth: '480px' }}>
        <div
          className="rounded-circle bg-warning-subtle text-warning mx-auto d-flex align-items-center justify-content-center mb-3"
          style={{ width: '80px', height: '80px', fontSize: '2.5rem' }}
        >
          <i className="bi bi-question-circle-fill"></i>
        </div>
        <h2 className="fw-bold text-dark mb-2">404 - Page Not Found</h2>
        <p className="text-secondary small mb-4">
          The requested page or route does not exist in AcxiomCRM. Please check your URL or return to your authorized dashboard.
        </p>
        <Link to="/dashboard" className="btn btn-primary-gradient btn-sm px-4">
          <i className="bi bi-house-door me-1"></i> Return to Dashboard
        </Link>
      </div>
    </div>
  );
};
