import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SearchBar, Pagination } from '../../components/common/DataControls';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '../../components/common/FeedbackStates';
import { FormInput, SelectInput } from '../../components/forms/FormControls';
import { formatDate } from '../../utils/formatters';

export const CustomersPage = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    company_name: '',
    city: '',
    state: '',
    status: 'ACTIVE'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerService.getCustomers({
        search,
        status,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit
      });
      if (res.success) {
        setCustomers(res.data.customers);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [search, status, sortBy, sortOrder, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const validateForm = () => {
    const errs = {};
    if (!formData.customer_name.trim()) errs.customer_name = 'Customer Name is required.';
    if (!formData.email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email address.';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedCustomerId(null);
    setFormData({
      customer_name: '',
      email: '',
      phone: '',
      company_name: '',
      city: '',
      state: '',
      status: 'ACTIVE'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setModalMode('edit');
    setSelectedCustomerId(customer.customer_id);
    setFormData({
      customer_name: customer.customer_name,
      email: customer.email,
      phone: customer.phone,
      company_name: customer.company_name || '',
      city: customer.city || '',
      state: customer.state || '',
      status: customer.status || 'ACTIVE'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await customerService.createCustomer(formData);
        showToast('success', 'Customer Created', 'New customer record successfully added.');
      } else {
        await customerService.updateCustomer(selectedCustomerId, formData);
        showToast('success', 'Customer Updated', 'Customer record updated successfully.');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save customer.';
      showToast('error', 'Error Saving', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await customerService.deleteCustomer(deleteId);
      showToast('success', 'Customer Deleted', 'Customer record has been permanently deleted.');
      setDeleteId(null);
      fetchCustomers();
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const canEdit = role === 'ADMIN' || role === 'MANAGER' || role === 'SALES_EXECUTIVE';
  const canDelete = role === 'ADMIN' || role === 'MANAGER';

  return (
    <div className="fade-in pb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Customer Management</h4>
          <p className="text-muted small mb-0">Manage enterprise client accounts, key stakeholders, and related history.</p>
        </div>
        {canEdit && (
          <button onClick={handleOpenCreate} className="btn btn-primary-gradient btn-sm">
            <i className="bi bi-person-plus-fill me-1"></i> Add Customer
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="saas-card p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center justify-content-between">
          <div className="col-md-5">
            <SearchBar
              value={search}
              onChange={(val) => { setSearch(val); setPagination(p => ({ ...p, page: 1 })); }}
              onClear={() => setSearch('')}
              placeholder="Search by name, email, phone, company..."
            />
          </div>

          <div className="col-md-7 d-flex justify-content-md-end gap-2 flex-wrap">
            <select
              className="form-select form-select-sm"
              style={{ width: '130px' }}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              className="form-select form-select-sm"
              style={{ width: '150px' }}
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [col, ord] = e.target.value.split('-');
                setSortBy(col);
                setSortOrder(ord);
              }}
            >
              <option value="created_at-DESC">Newest First</option>
              <option value="created_at-ASC">Oldest First</option>
              <option value="customer_name-ASC">Name (A-Z)</option>
              <option value="company_name-ASC">Company (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSpinner message="Retrieving customers..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCustomers} />
      ) : customers.length === 0 ? (
        <EmptyState
          icon="bi-people"
          title="No customers found"
          description="Try clearing your search or status filters, or add a new customer."
          actionLabel={canEdit ? 'Add New Customer' : null}
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="saas-card bg-white p-0 overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table saas-table mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Customer Name</th>
                  <th>Company</th>
                  <th>Email & Phone</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Assigned Agent</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.customer_id}>
                    <td>
                      <span className="font-monospace small fw-bold text-secondary">{c.customer_code}</span>
                    </td>
                    <td>
                      <Link to={`/customers/${c.customer_id}`} className="fw-bold text-dark text-decoration-none hover-primary">
                        {c.customer_name}
                      </Link>
                    </td>
                    <td>
                      <span className="fw-medium text-dark">{c.company_name || '—'}</span>
                    </td>
                    <td>
                      <div className="small text-dark">{c.email}</div>
                      <div className="small text-muted">{c.phone}</div>
                    </td>
                    <td>
                      <span className="small text-muted">{c.city ? `${c.city}, ${c.state || ''}` : '—'}</span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <span className="small text-muted">
                        {c.assigned_first_name ? `${c.assigned_first_name} ${c.assigned_last_name}` : 'Unassigned'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <Link
                          to={`/customers/${c.customer_id}`}
                          className="btn btn-sm btn-light p-1 px-2"
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </Link>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="btn btn-sm btn-light p-1 px-2 text-primary"
                            title="Edit Customer"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(c.customer_id)}
                            className="btn btn-sm btn-light p-1 px-2 text-danger"
                            title="Delete Customer"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-light border-top">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            />
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Customer' : 'Edit Customer Record'}
        footer={
          <>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary-gradient btn-sm" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Customer' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Customer Full Name"
            id="customer_name"
            value={formData.customer_name}
            onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
            error={formErrors.customer_name}
            placeholder="Robert Sterling"
            required
          />

          <div className="row g-2">
            <div className="col-sm-6">
              <FormInput
                label="Email Address"
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={formErrors.email}
                placeholder="robert@company.com"
                required
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Phone Number"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={formErrors.phone}
                placeholder="+1-555-0100"
                required
              />
            </div>
          </div>

          <FormInput
            label="Company Name"
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="CloudScale Technologies"
          />

          <div className="row g-2">
            <div className="col-sm-6">
              <FormInput
                label="City"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="San Francisco"
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="State"
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="CA"
              />
            </div>
          </div>

          <SelectInput
            label="Status"
            id="status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' }
            ]}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Customer Record"
        message="Are you sure you want to delete this customer? All associated deals, meetings, and activity links may be removed."
        confirmText="Delete Customer"
        loading={deleteLoading}
      />
    </div>
  );
};
