import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((type = 'info', title = '', message = '', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return 'bi-check-circle-fill text-success';
      case 'error': return 'bi-exclamation-triangle-fill text-danger';
      case 'warning': return 'bi-exclamation-circle-fill text-warning';
      default: return 'bi-info-circle-fill text-primary';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: 'calc(100% - 48px)'
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="saas-card shadow-lg p-3 d-flex align-items-start gap-3 fade-in"
            style={{
              backgroundColor: '#ffffff',
              borderLeft: `4px solid ${
                toast.type === 'success' ? '#10b981' :
                toast.type === 'error' ? '#ef4444' :
                toast.type === 'warning' ? '#f59e0b' : '#6366f1'
              }`
            }}
          >
            <i className={`bi ${getToastIcon(toast.type)} fs-5`} style={{ marginTop: '2px' }}></i>
            <div className="flex-grow-1">
              {toast.title && <div className="fw-bold fs-6 text-dark">{toast.title}</div>}
              <div className="text-secondary small">{toast.message}</div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="btn btn-sm btn-link text-muted p-0 border-0"
              style={{ fontSize: '1.2rem', lineHeight: '1' }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
