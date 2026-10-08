import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FormInput } from '../components/forms/FormControls';
import { Modal } from '../components/common/Modal';
import { RoleBadge, StatusBadge } from '../components/common/StatusBadge';
import { formatDate } from '../utils/formatters';

export const SettingsPage = () => {
  const { user, role, logout, updateProfile, deleteAccount } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Profile Form State
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    company_name: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        department: user.department || '',
        company_name: ''
      });
    }
  }, [user]);

  // Delete Account Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateProfile(formData);
      showToast('success', 'Profile Saved', 'Your account details have been updated.');
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('info', 'Logged Out', 'You have been safely signed out.');
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      showToast('error', 'Confirmation Error', 'Please type DELETE to confirm permanent account removal.');
      return;
    }

    setDeleting(true);
    try {
      await deleteAccount();
      showToast('warning', 'Account Deleted', 'Your user account has been permanently removed from AcxiomCRM.');
      navigate('/login');
    } catch (err) {
      showToast('error', 'Deletion Error', err.response?.data?.message || err.message || 'Failed to delete account.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="fade-in pb-4" style={{ maxWidth: '850px' }}>
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Account & System Settings</h4>
        <p className="text-muted small mb-0">Manage your dynamic personal credentials, active sessions, and account governance.</p>
      </div>

      {/* Profile Overview Card */}
      <div className="saas-card p-4 bg-white mb-4 shadow-sm">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
            style={{ width: '60px', height: '60px', background: 'var(--primary-gradient)', fontSize: '1.4rem' }}
          >
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h5 className="fw-bold text-dark mb-0">{user?.first_name} {user?.last_name}</h5>
              <RoleBadge role={role} />
              <StatusBadge status={user?.status || 'ACTIVE'} />
            </div>
            <div className="text-muted small mt-1">
              <i className="bi bi-envelope me-1"></i> {user?.email} • <i className="bi bi-briefcase me-1"></i> {user?.department || 'Operations'}
            </div>
          </div>
          <div className="text-end text-muted small">
            <div>User ID: <span className="font-monospace fw-bold text-dark">#{user?.user_id}</span></div>
            <div>Joined: {formatDate(user?.created_at || new Date())}</div>
          </div>
        </div>
      </div>

      {/* Edit Profile Details */}
      <div className="saas-card p-4 bg-white mb-4 shadow-sm">
        <h5 className="fw-bold text-dark mb-3">
          <i className="bi bi-person-lines-fill me-2 text-primary"></i> Personal Information
        </h5>
        <form onSubmit={handleUpdateProfile}>
          <div className="row g-3">
            <div className="col-sm-6">
              <FormInput
                label="First Name"
                id="firstName"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Last Name"
                id="lastName"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Registered Email (Immutable Primary ID)"
                id="email"
                value={user?.email || ''}
                disabled
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Contact Phone"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1-555-0199"
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Department / Unit"
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Enterprise Leadership"
              />
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4 pt-3 border-top">
            <button
              type="submit"
              className="btn btn-primary-gradient px-4 btn-sm fw-semibold shadow-sm"
              disabled={updating}
            >
              {updating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span> Updating...
                </>
              ) : (
                <>
                  <i className="bi bi-check2-circle me-1"></i> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Account Security Information */}
      <div className="saas-card p-4 bg-white mb-4 shadow-sm">
        <h5 className="fw-bold text-dark mb-3">
          <i className="bi bi-shield-lock me-2 text-primary"></i> Security & Authentication
        </h5>
        <div className="row g-3 small">
          <div className="col-sm-6">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted">Password Security</div>
              <div className="fw-bold text-dark mt-1">Bcrypt Hash (Salt Cost: 10)</div>
              <div className="text-secondary" style={{ fontSize: '0.72rem' }}>State-of-the-art key derivation</div>
            </div>
          </div>
          <div className="col-sm-6">
            <div className="p-3 bg-light rounded-3 border">
              <div className="text-muted">Session Token</div>
              <div className="fw-bold text-dark mt-1">JWT Bearer Authorization</div>
              <div className="text-secondary" style={{ fontSize: '0.72rem' }}>Automatic 24-hour expiration cycle</div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Logout and Delete Account */}
      <div className="saas-card p-4 bg-white border border-danger-subtle shadow-sm">
        <h5 className="fw-bold text-danger mb-2">
          <i className="bi bi-exclamation-triangle-fill me-2"></i> Account Session & Danger Zone
        </h5>
        <p className="text-muted small mb-4">
          Actions here directly impact your current session or permanently modify your database existence.
        </p>

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 p-3 bg-light rounded-3 mb-3 border">
          <div>
            <div className="fw-bold text-dark">Sign Out of AcxiomCRM</div>
            <div className="text-muted small">Terminate this session safely and return to the login portal.</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline-secondary btn-sm px-3 fw-semibold text-nowrap"
          >
            <i className="bi bi-box-arrow-right me-1"></i> Sign Out
          </button>
        </div>

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 p-3 bg-danger-subtle bg-opacity-25 rounded-3 border border-danger-subtle">
          <div>
            <div className="fw-bold text-danger">Delete Account Permanently</div>
            <div className="text-muted small">
              Permanently erase this user account from MySQL. If you are the single admin, admin signup will reopen.
            </div>
          </div>
          <button
            onClick={() => {
              setConfirmText('');
              setShowDeleteModal(true);
            }}
            className="btn btn-danger btn-sm px-3 fw-semibold text-nowrap"
          >
            <i className="bi bi-trash3-fill me-1"></i> Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Permanent Account Deletion"
        footer={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="btn btn-secondary btn-sm"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              className="btn btn-danger btn-sm"
              disabled={deleting || confirmText.toLowerCase() !== 'delete'}
            >
              {deleting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span> Deleting...
                </>
              ) : (
                'Yes, Delete My Account'
              )}
            </button>
          </>
        }
      >
        <div className="text-center p-2">
          <div className="rounded-circle bg-danger-subtle text-danger mx-auto d-flex align-items-center justify-content-center mb-3" style={{ width: '56px', height: '56px', fontSize: '1.5rem' }}>
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <h5 className="fw-bold text-dark mb-2">Are you completely sure?</h5>
          <p className="text-muted small mb-3">
            This action <strong>CANNOT</strong> be undone. Your user record (<span className="fw-bold text-dark">{user?.email}</span>) and associated active session will be permanently wiped from the database.
          </p>
          <div className="p-3 bg-light rounded-3 text-start small mb-3 border">
            To proceed, type <span className="badge bg-danger">DELETE</span> in the box below:
          </div>
          <input
            type="text"
            className="form-control text-center font-monospace"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            autoFocus
          />
        </div>
      </Modal>
    </div>
  );
};
