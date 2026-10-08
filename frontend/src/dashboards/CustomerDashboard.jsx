import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { customerPortalService } from '../services/customerPortalService';
import { LoadingSpinner, ErrorState } from '../components/common/FeedbackStates';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { FormInput, TextareaInput, SelectInput } from '../components/forms/FormControls';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export const CustomerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Request ticket modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getCustomerDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load customer hub.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast('error', 'Validation Error', 'Subject and message are required.');
      return;
    }

    setSubmitting(true);
    try {
      await customerPortalService.createRequest({ subject, message, priority });
      showToast('success', 'Request Submitted', 'Your inquiry has been routed to your account representative.');
      setIsModalOpen(false);
      setSubject('');
      setMessage('');
      fetchStats();
    } catch (err) {
      showToast('error', 'Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your customer relationship center..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!data) return null;

  const { profile, relationshipCenter } = data;
  const { assignedExecutive, myOpportunities, upcomingFollowUps, myRequests } = relationshipCenter;

  return (
    <div className="fade-in pb-4">
      {/* Top Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Customer Relationship Center</h4>
          <p className="text-muted small mb-0">Direct self-service hub for your organizational contracts, meetings, and priority support.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary-gradient btn-sm">
          <i className="bi bi-chat-left-dots-fill me-1"></i> Submit Support Request
        </button>
      </div>

      <div className="row g-4 mb-4">
        {/* Customer Profile & Assigned Executive Card */}
        <div className="col-lg-5">
          <div className="saas-card p-4 h-100 bg-white">
            <h5 className="fw-bold text-dark mb-3">Organization & Contact Info</h5>
            <div className="mb-3 p-3 rounded-3 bg-light border">
              <div className="fw-bold fs-6 text-dark">{profile.customerRecord?.company_name || 'My Organization'}</div>
              <div className="text-secondary small mt-1">Customer Code: <strong>{profile.customerRecord?.customer_code || 'CUST-0000'}</strong></div>
              <div className="text-secondary small">Contact Name: {profile.first_name} {profile.last_name}</div>
              <div className="text-secondary small">Email: {profile.email}</div>
            </div>

            <h6 className="fw-bold text-dark mb-2">Dedicated Account Representative</h6>
            {assignedExecutive ? (
              <div className="p-3 rounded-3 bg-primary-subtle border border-primary-subtle">
                <div className="d-flex align-items-center gap-3">
                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '42px', height: '42px' }}>
                    {assignedExecutive.name.charAt(0)}
                  </div>
                  <div>
                    <div className="fw-bold text-dark">{assignedExecutive.name}</div>
                    <div className="text-primary small fw-semibold">{assignedExecutive.department}</div>
                    <div className="text-muted small mt-1">
                      <i className="bi bi-envelope me-1"></i> {assignedExecutive.email}
                    </div>
                    <div className="text-muted small">
                      <i className="bi bi-telephone me-1"></i> {assignedExecutive.phone}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted small">An enterprise representative will be assigned to your account shortly.</div>
            )}
          </div>
        </div>

        {/* Upcoming Scheduled Meetings / Follow-Ups */}
        <div className="col-lg-7">
          <div className="saas-card p-4 h-100 bg-white">
            <h5 className="fw-bold text-dark mb-3">Upcoming Touchpoints & Meetings</h5>
            {upcomingFollowUps?.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="bi bi-calendar-x me-1 fs-4 d-block mb-1"></i>
                No upcoming meetings scheduled. Click "Submit Support Request" to book a consultation.
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {upcomingFollowUps.map((fu) => (
                  <div key={fu.followup_id} className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-dark d-flex align-items-center gap-2">
                        <span className="badge bg-primary text-white">{fu.followup_type}</span>
                        <span>{fu.remarks || 'Scheduled Client Touchpoint'}</span>
                      </div>
                      <div className="text-muted small mt-1">
                        Host: {fu.rep_name || 'Account Executive'}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-semibold text-primary">{formatDate(fu.followup_date, true)}</div>
                      <span className="badge bg-light text-dark border small mt-1">{fu.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Deals / Opportunities */}
      <div className="saas-card p-4 mb-4 bg-white">
        <h5 className="fw-bold text-dark mb-3">My Commercial Opportunities & Progress</h5>
        {myOpportunities?.length === 0 ? (
          <div className="text-muted small py-3 text-center">No active commercial proposals right now.</div>
        ) : (
          <div className="table-responsive">
            <table className="table saas-table">
              <thead>
                <tr>
                  <th>Deal Code</th>
                  <th>Proposal Title</th>
                  <th>Value</th>
                  <th>Current Phase</th>
                  <th>Expected Close</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myOpportunities.map((opp) => (
                  <tr key={opp.opportunity_id}>
                    <td className="font-monospace fw-semibold">{opp.opportunity_code}</td>
                    <td className="fw-bold text-dark">{opp.opportunity_name}</td>
                    <td className="fw-bold text-success">{formatCurrency(opp.amount)}</td>
                    <td>
                      <StatusBadge status={opp.stage} />
                    </td>
                    <td className="small text-muted">{formatDate(opp.expected_close_date)}</td>
                    <td>
                      <StatusBadge status={opp.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Support & Request Tickets Tracker */}
      <div className="saas-card p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark mb-0">My Support & Service Requests</h5>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-sm btn-outline-primary">
            <i className="bi bi-plus-lg me-1"></i> New Request
          </button>
        </div>

        {myRequests?.length === 0 ? (
          <div className="text-center py-4 text-muted small">You haven't submitted any support requests yet.</div>
        ) : (
          <div className="list-group list-group-flush">
            {myRequests.map((req) => (
              <div key={req.request_id} className="list-group-item px-0 py-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <span className="fw-bold text-dark fs-6">{req.subject}</span>
                    <span className={`badge ms-2 ${req.priority === 'URGENT' ? 'bg-danger text-white' : 'bg-secondary text-white'}`}>
                      {req.priority}
                    </span>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-secondary small mb-2">{req.message}</p>
                {req.response && (
                  <div className="p-3 rounded-3 bg-light border-start border-4 border-success mt-2">
                    <div className="fw-bold text-dark small mb-1">
                      <i className="bi bi-reply-fill text-success me-1"></i> Reply from {req.rep_first_name || 'Account Executive'}:
                    </div>
                    <div className="small text-secondary">{req.response}</div>
                  </div>
                )}
                <div className="text-muted small mt-2" style={{ fontSize: '0.72rem' }}>
                  Submitted: {formatDate(req.created_at, true)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Request Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit New Support / Inquiry Request"
        footer={
          <>
            <button className="btn btn-light btn-sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary-gradient btn-sm" onClick={handleCreateRequest} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateRequest}>
          <FormInput
            label="Inquiry Subject"
            id="reqSubject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Schedule licensing expansion review"
            required
          />
          <SelectInput
            label="Priority"
            id="reqPriority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: 'LOW', label: 'Low - General Question' },
              { value: 'MEDIUM', label: 'Medium - Account Inquiry' },
              { value: 'HIGH', label: 'High - Contract Requirement' },
              { value: 'URGENT', label: 'Urgent - Production Critical' }
            ]}
          />
          <TextareaInput
            label="Message Details"
            id="reqMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your inquiry or requirement in detail..."
            rows={4}
            required
          />
        </form>
      </Modal>
    </div>
  );
};
