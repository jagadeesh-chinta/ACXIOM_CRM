import React, { useEffect } from 'react';

export const Modal = ({ isOpen, onClose, title, children, size = 'md', footer }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidth = size === 'lg' ? '800px' : size === 'xl' ? '1000px' : size === 'sm' ? '400px' : '560px';

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1050
      }}
      onClick={onClose}
    >
      <div
        className="modal-content bg-white rounded-4 shadow-lg overflow-hidden fade-in"
        style={{ maxWidth, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header d-flex justify-content-between align-items-center bg-light px-4 py-3 border-bottom">
          <h5 className="modal-title fw-bold text-dark mb-0">{title}</h5>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
        </div>
        <div className="modal-body p-4 overflow-auto flex-grow-1">
          {children}
        </div>
        {footer && (
          <div className="modal-footer bg-light px-4 py-3 border-top d-flex justify-content-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-light btn-sm" onClick={onClose} disabled={loading}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn btn-${confirmVariant} btn-sm`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </>
      }
    >
      <div className="text-secondary small">{message}</div>
    </Modal>
  );
};
