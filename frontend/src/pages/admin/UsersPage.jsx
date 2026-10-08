import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services/userService';
import { useToast } from '../../context/ToastContext';
import { SearchBar } from '../../components/common/DataControls';
import { StatusBadge, RoleBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner, ErrorState } from '../../components/common/FeedbackStates';
import { FormInput, SelectInput } from '../../components/forms/FormControls';
import { formatDate } from '../../utils/formatters';

export const UsersPage = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role_id: 3,
    phone: '',
    department: 'Sales'
  });
  const [submitting, setSubmitting] = useState(false);

  // Password Reset Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, rRes] = await Promise.all([
        userService.getUsers({ search, status: statusFilter }),
        userService.getRoles()
      ]);
      if (uRes.success) setUsers(uRes.data);
      if (rRes.success) setRoles(rRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedUserId(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role_id: 3,
      phone: '',
      department: 'Enterprise Sales'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setModalMode('edit');
    setSelectedUserId(user.user_id);
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      password: '',
      role_id: user.role_id,
      phone: user.phone || '',
      department: user.department || 'Sales'
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email) {
      showToast('error', 'Validation Error', 'First name, last name, and email are required.');
      return;
    }
    if (modalMode === 'create' && (!formData.password || formData.password.length < 6)) {
      showToast('error', 'Validation Error', 'Password (min 6 characters) is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await userService.createUser(formData);
        showToast('success', 'User Created', 'New user account created successfully.');
      } else {
        await userService.updateUser(selectedUserId, formData);
        showToast('success', 'User Updated', 'User role and details updated.');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast('error', 'Error Saving', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await userService.updateUserStatus(userId, newStatus);
      showToast('success', 'Status Updated', `User status changed to ${newStatus}.`);
      fetchUsers();
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || err.message);
    }
  };

  const handleOpenResetPassword = (user) => {
    setResetUser(user);
    setNewPassword('');
    setResetModalOpen(true);
  };

  const handleExecuteResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('error', 'Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    setResetLoading(true);
    try {
      await userService.resetPassword(resetUser.user_id, newPassword);
      showToast('success', 'Password Reset', `Password updated for ${resetUser.email}.`);
      setResetModalOpen(false);
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="fade-in pb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">User & Role Administration</h4>
          <p className="text-muted small mb-0">Manage employee accounts, role assignments, security locks, and credentials.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary-gradient btn-sm">
          <i className="bi bi-person-plus-fill me-1"></i> Create New User
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="saas-card p-3 mb-4 bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
        <SearchBar
          value={search}
          onChange={(val) => setSearch(val)}
          onClear={() => setSearch('')}
          placeholder="Search users by name, email, department..."
        />
        <div className="d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            style={{ width: '150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="LOCKED">Locked</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner message="Loading user directory..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchUsers} />
      ) : (
        <div className="saas-card bg-white p-0 overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table saas-table mb-0">
              <thead>
                <tr>
                  <th>User / Email</th>
                  <th>Assigned Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Failed Logins</th>
                  <th>Last Login</th>
                  <th className="text-end">Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id}>
                    <td>
                      <div className="fw-bold text-dark">{u.first_name} {u.last_name}</div>
                      <div className="small text-muted">{u.email}</div>
                    </td>
                    <td>
                      <RoleBadge role={u.role_name} />
                    </td>
                    <td>
                      <span className="small text-dark">{u.department || '—'}</span>
                    </td>
                    <td>
                      <StatusBadge status={u.status} />
                    </td>
                    <td>
                      <span className={`badge ${u.failed_login_attempts > 0 ? 'bg-danger-subtle text-danger' : 'bg-light text-dark'}`}>
                        {u.failed_login_attempts} attempts
                      </span>
                    </td>
                    <td>
                      <span className="small text-muted">{formatDate(u.last_login_at, true)}</span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {u.status === 'LOCKED' ? (
                          <button
                            onClick={() => handleStatusChange(u.user_id, 'ACTIVE')}
                            className="btn btn-sm btn-success p-1 px-2"
                            title="Unlock Account"
                          >
                            <i className="bi bi-unlock-fill me-1"></i> Unlock
                          </button>
                        ) : u.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleStatusChange(u.user_id, 'INACTIVE')}
                            className="btn btn-sm btn-light p-1 px-2 text-warning"
                            title="Deactivate Account"
                          >
                            <i className="bi bi-pause-circle"></i>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(u.user_id, 'ACTIVE')}
                            className="btn btn-sm btn-light p-1 px-2 text-success"
                            title="Activate Account"
                          >
                            <i className="bi bi-play-circle"></i>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenResetPassword(u)}
                          className="btn btn-sm btn-light p-1 px-2 text-secondary"
                          title="Reset Password"
                        >
                          <i className="bi bi-key"></i>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="btn btn-sm btn-light p-1 px-2 text-primary"
                          title="Edit User & Role"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create New CRM User' : 'Edit User & Permissions'}
        footer={
          <>
            <button className="btn btn-light btn-sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary-gradient btn-sm" onClick={handleSaveUser} disabled={submitting}>
              {submitting ? 'Saving...' : modalMode === 'create' ? 'Create User' : 'Update User'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveUser}>
          <div className="row g-2">
            <div className="col-sm-6">
              <FormInput
                label="First Name"
                id="userFirstName"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Last Name"
                id="userLastName"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <FormInput
            label="Email Address"
            id="userEmail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="name@gmail.com"
            required
          />

          {modalMode === 'create' && (
            <FormInput
              label="Initial Password"
              id="userPassword"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Min 6 characters"
              required
            />
          )}

          <div className="row g-2">
            <div className="col-sm-6">
              <SelectInput
                label="Role Assignment"
                id="userRoleId"
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value, 10) })}
                options={roles.map((r) => ({ value: r.role_id, label: `${r.role_name} (${r.description})` }))}
                required
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Department"
                id="userDept"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Admin Reset User Password"
        size="sm"
        footer={
          <>
            <button className="btn btn-light btn-sm" onClick={() => setResetModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary-gradient btn-sm" onClick={handleExecuteResetPassword} disabled={resetLoading}>
              {resetLoading ? 'Resetting...' : 'Set Password'}
            </button>
          </>
        }
      >
        <div className="small text-secondary mb-3">
          Setting new password for account: <strong>{resetUser?.email}</strong>.
        </div>
        <form onSubmit={handleExecuteResetPassword}>
          <FormInput
            label="New Password"
            id="adminNewPass"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
            required
          />
        </form>
      </Modal>
    </div>
  );
};
