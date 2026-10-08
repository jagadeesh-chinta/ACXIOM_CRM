import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { leadService } from '../../services/leadService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SearchBar, Pagination } from '../../components/common/DataControls';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '../../components/common/FeedbackStates';
import { FormInput, SelectInput, TextareaInput } from '../../components/forms/FormControls';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const LeadsPage = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Lead CRUD Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [formData, setFormData] = useState({
    lead_name: '',
    email: '',
    phone: '',
    company_name: '',
    source: 'Website',
    status: 'NEW',
    priority: 'WARM',
    expected_value: 10000,
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Lead Conversion Modal
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertingLead, setConvertingLead] = useState(null);
  const [convertData, setConvertData] = useState({
    opportunity_name: '',
    amount: 10000,
    expected_close_date: ''
  });
  const [convertSubmitting, setConvertSubmitting] = useState(false);

  // Delete Dialog
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leadService.getLeads({
        search,
        status,
        priority,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit
      });
      if (res.success) {
        setLeads(res.data.leads);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load leads.');
    } finally {
      setLoading(false);
    }
  }, [search, status, priority, sortBy, sortOrder, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const validateLeadForm = () => {
    const errs = {};
    if (!formData.lead_name.trim()) errs.lead_name = 'Lead Name is required.';
    if (!formData.email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email address.';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required.';
    if (formData.expected_value < 0) errs.expected_value = 'Expected value cannot be negative.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedLeadId(null);
    setFormData({
      lead_name: '',
      email: '',
      phone: '',
      company_name: '',
      source: 'Website',
      status: 'NEW',
      priority: 'WARM',
      expected_value: 15000,
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lead) => {
    setModalMode('edit');
    setSelectedLeadId(lead.lead_id);
    setFormData({
      lead_name: lead.lead_name,
      email: lead.email,
      phone: lead.phone,
      company_name: lead.company_name || '',
      source: lead.source || 'Website',
      status: lead.status || 'NEW',
      priority: lead.priority || 'WARM',
      expected_value: lead.expected_value || 0,
      notes: lead.notes || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!validateLeadForm()) return;

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await leadService.createLead(formData);
        showToast('success', 'Lead Created', 'New prospect lead added to queue.');
      } else {
        await leadService.updateLead(selectedLeadId, formData);
        showToast('success', 'Lead Updated', 'Lead status and details updated.');
      }
      setIsModalOpen(false);
      fetchLeads();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save lead.';
      showToast('error', 'Error Saving', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenConvert = (lead) => {
    const todayPlus30 = new Date();
    todayPlus30.setDate(todayPlus30.getDate() + 30);

    setConvertingLead(lead);
    setConvertData({
      opportunity_name: `${lead.company_name || lead.lead_name} Enterprise Deal`,
      amount: lead.expected_value || 25000,
      expected_close_date: todayPlus30.toISOString().split('T')[0]
    });
    setConvertModalOpen(true);
  };

  const handleExecuteConversion = async (e) => {
    e.preventDefault();
    if (!convertData.opportunity_name || !convertData.amount) {
      showToast('error', 'Validation Error', 'Opportunity Name and Amount are required.');
      return;
    }

    setConvertSubmitting(true);
    try {
      await leadService.convertLead(convertingLead.lead_id, convertData);
      showToast('success', 'Lead Converted!', 'Customer account and pipeline opportunity created.');
      setConvertModalOpen(false);
      fetchLeads();
    } catch (err) {
      showToast('error', 'Conversion Error', err.response?.data?.message || err.message);
    } finally {
      setConvertSubmitting(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await leadService.deleteLead(deleteId);
      showToast('success', 'Lead Deleted', 'Lead removed from CRM database.');
      setDeleteId(null);
      fetchLeads();
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const canDelete = role === 'ADMIN' || role === 'MANAGER';

  return (
    <div className="fade-in pb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Lead Funnel & Prospect Pipeline</h4>
          <p className="text-muted small mb-0">Qualify prospect leads and convert them directly into customer opportunities.</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary-gradient btn-sm">
          <i className="bi bi-plus-lg me-1"></i> Add New Lead
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="saas-card p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center justify-content-between">
          <div className="col-md-5">
            <SearchBar
              value={search}
              onChange={(val) => { setSearch(val); setPagination(p => ({ ...p, page: 1 })); }}
              onClear={() => setSearch('')}
              placeholder="Search leads by name, email, company, code..."
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
              <option value="NEW">New</option>
              <option value="CONTACTED">Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="UNQUALIFIED">Unqualified</option>
              <option value="CONVERTED">Converted</option>
              <option value="LOST">Lost</option>
            </select>

            <select
              className="form-select form-select-sm"
              style={{ width: '120px' }}
              value={priority}
              onChange={(e) => { setPriority(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Priorities</option>
              <option value="HOT">Hot</option>
              <option value="WARM">Warm</option>
              <option value="COLD">Cold</option>
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
              <option value="expected_value-DESC">Highest Value</option>
              <option value="lead_name-ASC">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lead List Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving sales leads..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLeads} />
      ) : leads.length === 0 ? (
        <EmptyState
          icon="bi-funnel"
          title="No leads found"
          description="Try adjusting your filters or create a new lead to kickstart your pipeline."
          actionLabel="Add Prospect Lead"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="saas-card bg-white p-0 overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table saas-table mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Lead Name</th>
                  <th>Priority</th>
                  <th>Company & Source</th>
                  <th>Contact Details</th>
                  <th>Est. Value</th>
                  <th>Status</th>
                  <th>Assigned Rep</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.lead_id}>
                    <td>
                      <span className="font-monospace small fw-bold text-secondary">{l.lead_code}</span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{l.lead_name}</div>
                      <div className="text-muted small">Created: {formatDate(l.created_at)}</div>
                    </td>
                    <td>
                      <StatusBadge status={l.priority} />
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{l.company_name || '—'}</div>
                      <div className="text-muted small">Via {l.source}</div>
                    </td>
                    <td>
                      <div className="small text-dark">{l.email}</div>
                      <div className="small text-muted">{l.phone}</div>
                    </td>
                    <td>
                      <span className="fw-bold text-primary">{formatCurrency(l.expected_value)}</span>
                    </td>
                    <td>
                      <StatusBadge status={l.status} />
                    </td>
                    <td>
                      <span className="small text-muted">
                        {l.assigned_first_name ? `${l.assigned_first_name} ${l.assigned_last_name}` : 'Unassigned'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {l.status !== 'CONVERTED' && (
                          <button
                            onClick={() => handleOpenConvert(l)}
                            className="btn btn-sm btn-success p-1 px-2"
                            title="Convert to Customer & Deal"
                          >
                            <i className="bi bi-arrow-repeat me-1"></i> Convert
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(l)}
                          className="btn btn-sm btn-light p-1 px-2 text-primary"
                          title="Edit Lead"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(l.lead_id)}
                            className="btn btn-sm btn-light p-1 px-2 text-danger"
                            title="Delete Lead"
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

      {/* Lead Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Sales Lead' : 'Edit Lead Details'}
        footer={
          <>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary-gradient btn-sm" onClick={handleSaveLead} disabled={submitting}>
              {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Lead' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveLead} noValidate>
          <FormInput
            label="Lead Contact Name"
            id="lead_name"
            value={formData.lead_name}
            onChange={(e) => setFormData({ ...formData, lead_name: e.target.value })}
            error={formErrors.lead_name}
            placeholder="Jordan Hayes"
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
                placeholder="jordan@company.com"
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
                placeholder="+1-555-1000"
                required
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-sm-6">
              <FormInput
                label="Company Name"
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="Strata Energy Solutions"
              />
            </div>
            <div className="col-sm-6">
              <SelectInput
                label="Lead Source"
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                options={[
                  { value: 'Website', label: 'Website Inbound' },
                  { value: 'Referral', label: 'Customer Referral' },
                  { value: 'Cold Outreach', label: 'Cold Outreach' },
                  { value: 'Event', label: 'Conference / Event' },
                  { value: 'Social Media', label: 'Social Media' },
                  { value: 'Partner', label: 'Partner Channel' }
                ]}
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-sm-4">
              <SelectInput
                label="Priority"
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                options={[
                  { value: 'HOT', label: '🔥 HOT' },
                  { value: 'WARM', label: '⚡ WARM' },
                  { value: 'COLD', label: '❄ COLD' }
                ]}
              />
            </div>
            <div className="col-sm-4">
              <SelectInput
                label="Status"
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'NEW', label: 'New' },
                  { value: 'CONTACTED', label: 'Contacted' },
                  { value: 'QUALIFIED', label: 'Qualified' },
                  { value: 'UNQUALIFIED', label: 'Unqualified' },
                  { value: 'LOST', label: 'Lost' }
                ]}
              />
            </div>
            <div className="col-sm-4">
              <FormInput
                label="Expected Value ($)"
                id="expected_value"
                type="number"
                value={formData.expected_value}
                onChange={(e) => setFormData({ ...formData, expected_value: parseFloat(e.target.value) || 0 })}
                error={formErrors.expected_value}
                min="0"
                step="1000"
              />
            </div>
          </div>

          <TextareaInput
            label="Prospect Notes"
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Key requirements, budget timeline, pain points..."
            rows={3}
          />
        </form>
      </Modal>

      {/* Lead Conversion Modal */}
      <Modal
        isOpen={convertModalOpen}
        onClose={() => setConvertModalOpen(false)}
        title="Convert Lead to Customer & Opportunity"
        footer={
          <>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setConvertModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-success btn-sm" onClick={handleExecuteConversion} disabled={convertSubmitting}>
              {convertSubmitting ? 'Converting...' : 'Execute Conversion'}
            </button>
          </>
        }
      >
        <div className="alert alert-info small mb-3">
          <i className="bi bi-info-circle-fill me-1"></i> Converting <strong>{convertingLead?.lead_name}</strong> will create a Customer profile and link a new commercial pipeline Opportunity.
        </div>
        <form onSubmit={handleExecuteConversion}>
          <FormInput
            label="Opportunity Deal Title"
            id="convOppName"
            value={convertData.opportunity_name}
            onChange={(e) => setConvertData({ ...convertData, opportunity_name: e.target.value })}
            placeholder="e.g. Strata Energy 200 Seat Deployment"
            required
          />
          <div className="row g-2">
            <div className="col-sm-6">
              <FormInput
                label="Deal Amount ($)"
                id="convAmount"
                type="number"
                value={convertData.amount}
                onChange={(e) => setConvertData({ ...convertData, amount: parseFloat(e.target.value) || 0 })}
                min="1"
                step="1000"
                required
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Target Close Date"
                id="convCloseDate"
                type="date"
                value={convertData.expected_close_date}
                onChange={(e) => setConvertData({ ...convertData, expected_close_date: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteLead}
        title="Delete Prospect Lead"
        message="Are you sure you want to remove this lead record?"
        confirmText="Delete Lead"
        loading={deleteLoading}
      />
    </div>
  );
};
