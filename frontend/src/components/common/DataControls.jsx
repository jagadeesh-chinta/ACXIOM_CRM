import React from 'react';

export const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
      <div className="text-muted small">
        Page <span className="fw-bold text-dark">{currentPage}</span> of <span className="fw-bold text-dark">{totalPages}</span>
      </div>
      <ul className="pagination pagination-sm mb-0 gap-1">
        <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
          <button className="page-link rounded" onClick={() => onPageChange(currentPage - 1)}>
            <i className="bi bi-chevron-left"></i> Previous
          </button>
        </li>
        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          // Show first, last, and window around current
          if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
            return (
              <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                <button
                  className="page-link rounded"
                  onClick={() => onPageChange(pageNum)}
                  style={currentPage === pageNum ? { background: 'var(--primary-gradient)', border: 'none' } : {}}
                >
                  {pageNum}
                </button>
              </li>
            );
          } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
            return (
              <li key={pageNum} className="page-item disabled">
                <span className="page-link border-0">...</span>
              </li>
            );
          }
          return null;
        })}
        <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
          <button className="page-link rounded" onClick={() => onPageChange(currentPage + 1)}>
            Next <i className="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export const SearchBar = ({ value, onChange, placeholder = 'Search records...', onClear }) => (
  <div className="position-relative flex-grow-1" style={{ maxWidth: '350px' }}>
    <i className="bi bi-search position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}></i>
    <input
      type="text"
      className="form-control ps-5 pe-4 rounded-pill"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontSize: '0.88rem' }}
    />
    {value && (
      <button
        onClick={onClear}
        className="btn btn-sm btn-link position-absolute text-muted p-0"
        style={{ right: '12px', top: '50%', transform: 'translateY(-50%)', textDecoration: 'none' }}
      >
        <i className="bi bi-x-circle-fill"></i>
      </button>
    )}
  </div>
);
