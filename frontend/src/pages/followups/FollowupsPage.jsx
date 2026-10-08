import React, { useState, useEffect, useCallback } from 'react';
import { followupService } from '../../services/followupService';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/DataControls';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '../../components/common/FeedbackStates';
import { FormInput, SelectInput, TextareaInput } from '../../components/forms/FormControls';
import { formatDate, toDateTimeLocalValue } from '../../utils/formatters';

const VIEW_TABS = [
  { id: 'all', label: 'All Follow-Ups' },
  { id: 'today', label: 'Due Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'completed', label: 'Completed' }
];

export const FollowupsPage = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [followups, setFollowups] = useState([]);
  const [activeView, setActiveView] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Customer options
  const [customerOptions, setCustomerOptions] = useState([]);

  // Schedule Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    followup_date: toDateTimeLocalValue(new Date(Date.now() + 3600000 * 2)),
    followup_type: 'CALL',
    remarks: '',
    status: 'PLANNED'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reschedule Modal
  const [rescheduleItem, setRescheduleItem] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await followupService.getFollowups({
        view: activeView,
        type: typeFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      if (res.success) {
        setFollowups(res.data.followups);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load follow-ups.');
    } finally {
      setLoading(false);
    }
  }, [activeView, typeFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

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

  const validateScheduleForm = () => {
    const errs = {};
    if (!formData.customer_id) errs.customer_id = 'Please associate a customer account.';
    if (!formData.followup_date) {
      errs.followup_date = 'Follow-up date and time is required.';
    } else {
      const chosen = new Date(formData.followup_date);
      const now = new Date();
      now.setMinutes(now.getMinutes() - 5);
      if (chosen < now) {
        errs.followup_date = 'Planned follow-up date cannot be earlier than today.';
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleOpenSchedule = () => {
    setFormData({
      customer_id: customerOptions[0]?.value || '',
      followup_date: toDateTimeLocalValue(new Date(Date.now() + 3600000 * 2)),
      followup_type: 'CALL',
      remarks: '',
      status: 'PLANNED'
    });
    setFormErrors({});
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!validateScheduleForm()) return;

    setSubmitting(true);
    try {
      await followupService.createFollowup(formData);
      showToast('success', 'Follow-up Scheduled', 'Scheduled reminder recorded in CRM.');
      setIsScheduleModalOpen(false);
      fetchFollowups();
    } catch (err) {
      showToast('error', 'Error Scheduling', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (fuId) => {
    try {
      await followupService.updateFollowup(fuId, { status: 'COMPLETED' });
      showToast('success', 'Completed!', 'Follow-up marked completed and activity logged.');
      fetchFollowups();
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || err.message);
    }
  };

  const handleOpenReschedule = (fu) => {
    setRescheduleItem(fu);
    setRescheduleDate(toDateTimeLocalValue(new Date(Date.now() + 3600000 * 24)));
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleDate) return;
    const chosen = new Date(rescheduleDate);
    const now = new Date();
    now.setMinutes(now.getMinutes() - 5);
    if (chosen < now) {
      showToast('error', 'Invalid Date', 'Rescheduled follow-up date cannot be in the past.');
      return;
    }

    try {
      await followupService.updateFollowup(rescheduleItem.followup_id, {
        followup_date: rescheduleDate,
        status: 'PLANNED'
      });
      showToast('success', 'Rescheduled', 'Follow-up time updated successfully.');
      setRescheduleItem(null);
      fetchFollowups();
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await followupService.deleteFollowup(deleteId);
      showToast('success', 'Follow-up Removed', 'Follow-up deleted from calendar.');
      setDeleteId(null);
      fetchFollowups();
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const canManage = role === 'ADMIN' || role === 'MANAGER' || role === 'SALES_EXECUTIVE';

  return (
    <div className="fade-in pb-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Follow-Up Management</h4>
          <p className="text-muted small mb-0">Track and execute client interactions, meetings, calls, and product demos.</p>
        </div>
        {canManage && (
          <button onClick={handleOpenSchedule} className="btn btn-primary-gradient btn-sm">
            <i className="bi bi-calendar-plus-fill me-1"></i> Schedule Follow-Up
          </button>
        )}
      </div>

      {/* Horizon Tabs and Filter Bar */}
      <div className="saas-card p-3 mb-4 bg-white">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          {/* Tabs */}
          <div className="btn-group btn-group-sm">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveView(tab.id); setPagination(p => ({ ...p, page: 1 })); }}
                className={`btn ${activeView === tab.id ? 'btn-primary' : 'btn-light border'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <select
            className="form-select form-select-sm"
            style={{ width: '150px' }}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          >
            <option value="">All Types</option>
            <option value="CALL">Call</option>
            <option value="MEETING">Meeting</option>
            <option value="EMAIL">Email</option>
            <option value="DEMO">Demo</option>
          </select>
        </div>
      </div>

      {/* Follow-up List Table */}
      {loading ? (
        <LoadingSpinner message="Checking calendar schedules..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchFollowups} />
      ) : followups.length === 0 ? (
        <EmptyState
          icon="bi-calendar-check"
          title="No follow-ups found"
          description="You currently have no follow-ups matching this view."
          actionLabel={canManage ? 'Schedule a Follow-Up' : null}
          onAction={handleOpenSchedule}
        />
      ) : (
        <div className="saas-card bg-white p-0 overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table saas-table mb-0">
              <thead>
                <tr>
                  <th>Follow-Up Date & Time</th>
                  <th>Interaction Type</th>
                  <th>Customer / Lead</th>
                  <th>Remarks / Objective</th>
                  <th>Status</th>
                  <th>Urgency</th>
                  <th>Assigned Agent</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {followups.map((fu) => (
                  <tr key={fu.followup_id}>
                    <td>
                      <div className="fw-bold text-dark">{formatDate(fu.followup_date, true)}</div>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary">
                        <i className={`bi ${fu.followup_type === 'CALL' ? 'bi-telephone' : fu.followup_type === 'MEETING' ? 'bi-camera-video' : 'bi-envelope'} me-1`}></i>
                        {fu.followup_type}
                      </span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{fu.customer_name || fu.lead_name || 'Prospect'}</div>
                      <div className="text-muted small">{fu.customer_company || fu.lead_company}</div>
                    </td>
                    <td>
                      <span className="small text-secondary">{fu.remarks || 'No remarks provided'}</span>
                    </td>
                    <td>
                      <StatusBadge status={fu.status} />
                    </td>
                    <td>
                      {fu.urgency_state === 'TODAY' && <span className="badge bg-warning text-dark">DUE TODAY</span>}
                      {fu.urgency_state === 'OVERDUE' && <span className="badge bg-danger text-white">OVERDUE</span>}
                      {fu.urgency_state === 'UPCOMING' && <span className="badge bg-info-subtle text-info">UPCOMING</span>}
                      {fu.status === 'COMPLETED' && <span className="badge bg-success-subtle text-success">DONE</span>}
                    </td>
                    <td>
                      <span className="small text-muted">
                        {fu.assigned_first_name ? `${fu.assigned_first_name} ${fu.assigned_last_name}` : 'Unassigned'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {canManage && fu.status === 'PLANNED' && (
                          <>
                            <button
                              onClick={() => handleComplete(fu.followup_id)}
                              className="btn btn-sm btn-success p-1 px-2"
                              title="Mark Done"
                            >
                              <i className="bi bi-check2"></i> Done
                            </button>
                            <button
                              onClick={() => handleOpenReschedule(fu)}
                              className="btn btn-sm btn-light p-1 px-2 text-primary"
                              title="Reschedule"
                            >
                              <i className="bi bi-clock-history"></i>
                            </button>
                          </>
                        )}
                        {canManage && (role === 'ADMIN' || role === 'MANAGER') && (
                          <button
                            onClick={() => setDeleteId(fu.followup_id)}
                            className="btn btn-sm btn-light p-1 px-2 text-danger"
                            title="Delete Follow-up"
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

      {/* Schedule Follow-up Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Schedule New Follow-Up Touchpoint"
        footer={
          <>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setIsScheduleModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary-gradient btn-sm" onClick={handleScheduleSubmit} disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Save Follow-Up'}
            </button>
          </>
        }
      >
        <form onSubmit={handleScheduleSubmit} noValidate>
          <SelectInput
            label="Client Account"
            id="customer_id"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            error={formErrors.customer_id}
            options={customerOptions}
            required
          />

          <div className="row g-2">
            <div className="col-sm-6">
              <FormInput
                label="Scheduled Date & Time"
                id="followup_date"
                type="datetime-local"
                value={formData.followup_date}
                onChange={(e) => setFormData({ ...formData, followup_date: e.target.value })}
                error={formErrors.followup_date}
                required
              />
            </div>
            <div className="col-sm-6">
              <SelectInput
                label="Interaction Type"
                id="followup_type"
                value={formData.followup_type}
                onChange={(e) => setFormData({ ...formData, followup_type: e.target.value })}
                options={[
                  { value: 'CALL', label: '📞 Phone Call' },
                  { value: 'MEETING', label: '🤝 Meeting' },
                  { value: 'EMAIL', label: '✉ Email' },
                  { value: 'DEMO', label: '💻 Product Demo' }
                ]}
              />
            </div>
          </div>

          <TextareaInput
            label="Agenda / Remarks"
            id="remarks"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Key discussion points, contract queries to clarify..."
            rows={3}
          />
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        isOpen={!!rescheduleItem}
        onClose={() => setRescheduleItem(null)}
        title="Reschedule Follow-Up"
        footer={
          <>
            <button className="btn btn-light btn-sm" onClick={() => setRescheduleItem(null)}>
              Cancel
            </button>
            <button className="btn btn-primary-gradient btn-sm" onClick={handleRescheduleSubmit}>
              Confirm New Time
            </button>
          </>
        }
      >
        <div className="mb-3 small text-secondary">
          Rescheduling follow-up with <strong>{rescheduleItem?.customer_name || 'Client'}</strong>.
        </div>
        <FormInput
          label="New Date & Time"
          id="rescheduleDate"
          type="datetime-local"
          value={rescheduleDate}
          onChange={(e) => setRescheduleDate(e.target.value)}
          required
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Follow-Up"
        message="Are you sure you want to remove this follow-up touchpoint?"
        confirmText="Delete Follow-up"
        loading={deleteLoading}
      />
    </div>
  );
};
