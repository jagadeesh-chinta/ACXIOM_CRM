import React, { useState, useEffect, useCallback } from 'react';
import { opportunityService } from '../../services/opportunityService';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SearchBar, Pagination } from '../../components/common/DataControls';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '../../components/common/FeedbackStates';
import { FormInput, SelectInput, TextareaInput } from '../../components/forms/FormControls';
import { formatCurrency, formatDate } from '../../utils/formatters';

const STAGES = ['QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export const OpportunitiesPage = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [summary, setSummary] = useState({ totalPipelineValue: 0, totalWeightedValue: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'list' | 'kanban'
  const [viewMode, setViewMode] = useState('list');

  // Filters
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedOppId, setSelectedOppId] = useState(null);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [formData, setFormData] = useState({
    opportunity_name: '',
    customer_id: '',
    amount: 50000,
    stage: 'QUALIFICATION',
    probability: 25,
    expected_close_date: '',
    status: 'OPEN',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await opportunityService.getOpportunities({
        search,
        stage,
        status,
        page: pagination.page,
        limit: viewMode === 'kanban' ? 50 : pagination.limit
      });
      if (res.success) {
        setOpportunities(res.data.opportunities);
        if (res.data.summary) setSummary(res.data.summary);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load opportunities.');
    } finally {
      setLoading(false);
    }
  }, [search, stage, status, viewMode, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  // Load customer options for create modal
  useEffect(() => {
    if (role !== 'CUSTOMER') {
      customerService.getCustomers({ limit: 100 })
        .then((res) => {
          if (res.success) {
            setCustomerOptions(res.data.customers.map((c) => ({
              value: c.customer_id,
              label: `${c.customer_name} (${c.company_name || 'No company'})`
            })));
          }
        })
        .catch(() => {});
    }
  }, [role]);

  const validateOppForm = () => {
    const errs = {};
    if (!formData.opportunity_name.trim()) errs.opportunity_name = 'Opportunity Name is required.';
    if (!formData.customer_id && modalMode === 'create') errs.customer_id = 'Customer selection is required.';
    if (!formData.amount || formData.amount <= 0) errs.amount = 'Amount must be greater than 0.';
    if (formData.probability < 0 || formData.probability > 100) errs.probability = 'Probability must be 0 to 100.';
    if (!formData.expected_close_date) {
      errs.expected_close_date = 'Target close date is required.';
    } else {
      const d = new Date(formData.expected_close_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today && modalMode === 'create') {
        errs.expected_close_date = 'Close date cannot be in the past.';
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenCreate = () => {
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);

    setModalMode('create');
    setSelectedOppId(null);
    setFormData({
      opportunity_name: '',
      customer_id: customerOptions[0]?.value || '',
      amount: 45000,
      stage: 'QUALIFICATION',
      probability: 25,
      expected_close_date: nextMonth.toISOString().split('T')[0],
      status: 'OPEN',
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (opp) => {
    setModalMode('edit');
    setSelectedOppId(opp.opportunity_id);
    setFormData({
      opportunity_name: opp.opportunity_name,
      customer_id: opp.customer_id,
      amount: opp.amount,
      stage: opp.stage,
      probability: opp.probability,
      expected_close_date: opp.expected_close_date ? opp.expected_close_date.split('T')[0] : '',
      status: opp.status,
      notes: opp.notes || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveOpp = async (e) => {
    e.preventDefault();
    if (!validateOppForm()) return;

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await opportunityService.createOpportunity(formData);
        showToast('success', 'Opportunity Created', 'Deal structured and added to sales pipeline.');
      } else {
        await opportunityService.updateOpportunity(selectedOppId, formData);
        showToast('success', 'Opportunity Updated', 'Deal stage and metrics updated.');
      }
      setIsModalOpen(false);
      fetchOpportunities();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save opportunity.';
      showToast('error', 'Error Saving', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOpp = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await opportunityService.deleteOpportunity(deleteId);
      showToast('success', 'Opportunity Deleted', 'Deal removed from pipeline.');
      setDeleteId(null);
      fetchOpportunities();
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
      {/* Header and Aggregate Metrics */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold text-dark mb-1">Opportunity Pipeline & Deals</h4>
          <p className="text-muted small mb-0">Track multi-stage sales opportunities and forecasted revenue.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {/* View Mode Toggle */}
          <div className="btn-group btn-group-sm">
            <button
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <i className="bi bi-list-ul me-1"></i> List
            </button>
            <button
              className={`btn ${viewMode === 'kanban' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setViewMode('kanban')}
            >
              <i className="bi bi-kanban me-1"></i> Kanban
            </button>
          </div>

          {canEdit && (
            <button onClick={handleOpenCreate} className="btn btn-primary-gradient btn-sm">
              <i className="bi bi-plus-lg me-1"></i> New Opportunity
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Pipeline Metrics Bar */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-3">
          <div className="saas-card p-3 bg-white border-start border-4 border-primary">
            <span className="text-muted small fw-semibold text-uppercase">Total Pipeline Value</span>
            <div className="h4 fw-bold text-dark mt-1 mb-0">{formatCurrency(summary.totalPipelineValue)}</div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="saas-card p-3 bg-white border-start border-4 border-success">
            <span className="text-muted small fw-semibold text-uppercase">Weighted Forecast</span>
            <div className="h4 fw-bold text-success mt-1 mb-0">{formatCurrency(summary.totalWeightedValue)}</div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="saas-card p-3 bg-white border-start border-4 border-info">
            <span className="text-muted small fw-semibold text-uppercase">Active Deals</span>
            <div className="h4 fw-bold text-info mt-1 mb-0">{pagination.total} opportunities</div>
          </div>
        </div>
        <div className="col-md-6 col-lg-3">
          <div className="saas-card p-3 bg-white border-start border-4 border-warning">
            <span className="text-muted small fw-semibold text-uppercase">Avg. Deal Size</span>
            <div className="h4 fw-bold text-warning mt-1 mb-0">
              {formatCurrency(pagination.total > 0 ? summary.totalPipelineValue / pagination.total : 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="saas-card p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center justify-content-between">
          <div className="col-md-5">
            <SearchBar
              value={search}
              onChange={(val) => { setSearch(val); setPagination(p => ({ ...p, page: 1 })); }}
              onClear={() => setSearch('')}
              placeholder="Search opportunity title, client name..."
            />
          </div>

          <div className="col-md-7 d-flex justify-content-md-end gap-2 flex-wrap">
            <select
              className="form-select form-select-sm"
              style={{ width: '150px' }}
              value={stage}
              onChange={(e) => { setStage(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Stages</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              className="form-select form-select-sm"
              style={{ width: '130px' }}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            >
              <option value="">All Status</option>
              <option value="OPEN">Open</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Rendering: List or Kanban */}
      {loading ? (
        <LoadingSpinner message="Calculating pipeline distribution..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOpportunities} />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon="bi-briefcase"
          title="No opportunities found"
          description="Create your first deal opportunity to initiate your sales pipeline."
          actionLabel={canEdit ? 'Add Opportunity' : null}
          onAction={handleOpenCreate}
        />
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="row g-3 overflow-auto flex-nowrap pb-3" style={{ minHeight: '520px' }}>
          {STAGES.map((stg) => {
            const stageDeals = opportunities.filter((o) => o.stage === stg);
            const stageTotal = stageDeals.reduce((sum, o) => sum + Number(o.amount), 0);
            return (
              <div key={stg} className="col-12 col-md-4 col-xl-2-4" style={{ minWidth: '280px' }}>
                <div className="p-3 rounded-4 bg-light h-100 border d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <span className="fw-bold small text-dark">{stg}</span>
                    <span className="badge bg-secondary rounded-pill">{stageDeals.length}</span>
                  </div>
                  <div className="small text-muted mb-3 fw-semibold">
                    Total: <span className="text-dark">{formatCurrency(stageTotal)}</span>
                  </div>

                  <div className="d-flex flex-column gap-2 flex-grow-1 overflow-auto pe-1">
                    {stageDeals.map((deal) => (
                      <div key={deal.opportunity_id} className="saas-card p-3 bg-white saas-card-hover border shadow-sm">
                        <div className="fw-bold text-dark small mb-1">{deal.opportunity_name}</div>
                        <div className="text-muted small mb-2">{deal.customer_name}</div>
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                          <span className="fw-bold text-success">{formatCurrency(deal.amount)}</span>
                          <span className="small text-muted">{deal.probability}%</span>
                        </div>
                        {canEdit && (
                          <div className="mt-2 pt-2 border-top d-flex justify-content-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(deal)}
                              className="btn btn-sm btn-link p-0 text-primary small text-decoration-none"
                            >
                              Edit Deal
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD TABLE LIST VIEW */
        <div className="saas-card bg-white p-0 overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table saas-table mb-0">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Opportunity Title</th>
                  <th>Customer Account</th>
                  <th>Amount</th>
                  <th>Stage</th>
                  <th>Probability</th>
                  <th>Weighted Val</th>
                  <th>Close Date</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.opportunity_id}>
                    <td>
                      <span className="font-monospace small fw-bold text-secondary">{opp.opportunity_code}</span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{opp.opportunity_name}</div>
                      <div className="text-muted small">Rep: {opp.assigned_first_name ? `${opp.assigned_first_name} ${opp.assigned_last_name}` : 'Unassigned'}</div>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{opp.customer_name}</span>
                      <div className="text-muted small">{opp.company_name}</div>
                    </td>
                    <td>
                      <span className="fw-bold text-dark">{formatCurrency(opp.amount)}</span>
                    </td>
                    <td>
                      <StatusBadge status={opp.stage} />
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ width: '50px', height: '6px' }}>
                          <div className="progress-bar bg-primary" style={{ width: `${opp.probability}%` }}></div>
                        </div>
                        <span className="small text-muted">{opp.probability}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="fw-bold text-success">{formatCurrency(opp.weighted_amount || (opp.amount * (opp.probability / 100)))}</span>
                    </td>
                    <td>
                      <span className="small text-muted">{formatDate(opp.expected_close_date)}</span>
                    </td>
                    <td>
                      <StatusBadge status={opp.status} />
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(opp)}
                            className="btn btn-sm btn-light p-1 px-2 text-primary"
                            title="Edit Deal"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(opp.opportunity_id)}
                            className="btn btn-sm btn-light p-1 px-2 text-danger"
                            title="Delete Deal"
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

      {/* Opportunity Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Structure New Opportunity' : 'Edit Opportunity Deal'}
        footer={
          <>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary-gradient btn-sm" onClick={handleSaveOpp} disabled={submitting}>
              {submitting ? 'Saving...' : modalMode === 'create' ? 'Create Opportunity' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveOpp} noValidate>
          <FormInput
            label="Opportunity Name"
            id="opportunity_name"
            value={formData.opportunity_name}
            onChange={(e) => setFormData({ ...formData, opportunity_name: e.target.value })}
            error={formErrors.opportunity_name}
            placeholder="CloudScale Multi-Year Enterprise Rollout"
            required
          />

          {modalMode === 'create' && (
            <SelectInput
              label="Associated Customer"
              id="customer_id"
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
              error={formErrors.customer_id}
              options={customerOptions}
              required
            />
          )}

          <div className="row g-2">
            <div className="col-sm-6">
              <FormInput
                label="Deal Amount ($)"
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                error={formErrors.amount}
                min="1"
                step="1000"
                required
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Win Probability (0-100%)"
                id="probability"
                type="number"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value, 10) || 0 })}
                error={formErrors.probability}
                min="0"
                max="100"
                required
              />
            </div>
          </div>

          <div className="row g-2">
            <div className="col-sm-6">
              <SelectInput
                label="Sales Stage"
                id="stage"
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                options={STAGES.map((s) => ({ value: s, label: s }))}
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Expected Close Date"
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                error={formErrors.expected_close_date}
                required
              />
            </div>
          </div>

          <TextareaInput
            label="Deal Strategy Notes"
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Licensing model, decision maker feedback, discount considerations..."
            rows={3}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteOpp}
        title="Delete Opportunity Deal"
        message="Are you sure you want to delete this deal? This action cannot be reversed."
        confirmText="Delete Opportunity"
        loading={deleteLoading}
      />
    </div>
  );
};
