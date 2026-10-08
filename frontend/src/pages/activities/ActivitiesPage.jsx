import React, { useState, useEffect, useCallback } from 'react';
import { activityService } from '../../services/activityService';
import { customerService } from '../../services/customerService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/DataControls';
import { Modal, ConfirmDialog } from '../../components/common/Modal';
import { LoadingSpinner, EmptyState, ErrorState } from '../../components/common/FeedbackStates';
import { FormInput, SelectInput, TextareaInput } from '../../components/forms/FormControls';
import { formatDate, toDateTimeLocalValue } from '../../utils/formatters';

export const ActivitiesPage = () => {
  const { role } = useAuth();
  const { showToast } = useToast();

  const [activities, setActivities] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [customerOptions, setCustomerOptions] = useState([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: 'CALL',
    subject: '',
    description: '',
    activity_date: toDateTimeLocalValue(),
    customer_id: '',
    status: 'COMPLETED'
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await activityService.getActivities({
        type: typeFilter,
        page: pagination.page,
        limit: pagination.limit
      });
      if (res.success) {
        setActivities(res.data.activities);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load activities.');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

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

  const handleOpenLog = () => {
    setFormData({
      activity_type: 'CALL',
      subject: '',
      description: '',
      activity_date: toDateTimeLocalValue(),
      customer_id: customerOptions[0]?.value || '',
      status: 'COMPLETED'
    });
    setIsModalOpen(true);
  };

  const handleSaveActivity = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      showToast('error', 'Validation Error', 'Subject is required.');
      return;
    }

    setSubmitting(true);
    try {
      await activityService.createActivity(formData);
      showToast('success', 'Activity Logged', 'New engagement activity recorded.');
      setIsModalOpen(false);
      fetchActivities();
    } catch (err) {
      showToast('error', 'Error', err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await activityService.deleteActivity(deleteId);
      showToast('success', 'Activity Deleted', 'Activity record removed.');
      setDeleteId(null);
      fetchActivities();
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
          <h4 className="fw-bold text-dark mb-1">Customer Activity Management</h4>
          <p className="text-muted small mb-0">Audit history of calls, meetings, emails, and completed sales tasks.</p>
        </div>
        {canManage && (
          <button onClick={handleOpenLog} className="btn btn-primary-gradient btn-sm">
            <i className="bi bi-plus-lg me-1"></i> Log Activity
          </button>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="saas-card p-3 mb-4 bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="small text-muted fw-bold">Filter Type:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: '160px' }}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          >
            <option value="">All Activity Types</option>
            <option value="CALL">Phone Call</option>
            <option value="MEETING">Meeting</option>
            <option value="EMAIL">Email</option>
            <option value="TASK">Task</option>
          </select>
        </div>
        <div className="small text-muted">
          Showing {activities.length} of {pagination.total} records
        </div>
      </div>

      {/* Activity Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving logged activities..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchActivities} />
      ) : activities.length === 0 ? (
        <EmptyState
          icon="bi-activity"
          title="No activities recorded"
          description="Log customer interactions to track team communication history."
          actionLabel={canManage ? 'Log First Activity' : null}
          onAction={handleOpenLog}
        />
      ) : (
        <div className="saas-card bg-white p-0 overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table saas-table mb-0">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Type</th>
                  <th>Subject</th>
                  <th>Description</th>
                  <th>Customer / Lead</th>
                  <th>Logged By</th>
                  <th>Status</th>
                  {(role === 'ADMIN' || role === 'MANAGER') && <th className="text-end">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => (
                  <tr key={act.activity_id}>
                    <td>
                      <span className="small text-dark fw-semibold">{formatDate(act.activity_date, true)}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        <i className={`bi ${act.activity_type === 'CALL' ? 'bi-telephone text-primary' : act.activity_type === 'MEETING' ? 'bi-camera-video text-success' : act.activity_type === 'EMAIL' ? 'bi-envelope text-info' : 'bi-check2-square text-warning'} me-1`}></i>
                        {act.activity_type}
                      </span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{act.subject}</div>
                    </td>
                    <td>
                      <div className="small text-secondary text-truncate" style={{ maxWidth: '280px' }}>
                        {act.description || '—'}
                      </div>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{act.customer_name || act.lead_name || '—'}</span>
                    </td>
                    <td>
                      <span className="small text-muted">{act.assigned_first_name ? `${act.assigned_first_name} ${act.assigned_last_name}` : 'Staff'}</span>
                    </td>
                    <td>
                      <StatusBadge status={act.status} />
                    </td>
                    {(role === 'ADMIN' || role === 'MANAGER') && (
                      <td className="text-end">
                        <button
                          onClick={() => setDeleteId(act.activity_id)}
                          className="btn btn-sm btn-light p-1 px-2 text-danger"
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    )}
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

      {/* Log Activity Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Customer Engagement Activity"
        footer={
          <>
            <button className="btn btn-light btn-sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary-gradient btn-sm" onClick={handleSaveActivity} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Activity'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSaveActivity}>
          <div className="row g-2">
            <div className="col-sm-6">
              <SelectInput
                label="Activity Type"
                id="actType"
                value={formData.activity_type}
                onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                options={[
                  { value: 'CALL', label: '📞 Call' },
                  { value: 'MEETING', label: '🤝 Meeting' },
                  { value: 'EMAIL', label: '✉ Email' },
                  { value: 'TASK', label: '✓ Task' }
                ]}
              />
            </div>
            <div className="col-sm-6">
              <FormInput
                label="Date & Time"
                id="actDate"
                type="datetime-local"
                value={formData.activity_date}
                onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                required
              />
            </div>
          </div>

          <FormInput
            label="Subject"
            id="actSubject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g. Discussed SLA terms and integration timeline"
            required
          />

          <SelectInput
            label="Related Customer"
            id="actCust"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            options={customerOptions}
          />

          <TextareaInput
            label="Activity Details"
            id="actDesc"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Outcome of call, next action items..."
            rows={3}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Activity"
        message="Are you sure you want to delete this activity entry?"
        confirmText="Delete Activity"
        loading={deleteLoading}
      />
    </div>
  );
};
