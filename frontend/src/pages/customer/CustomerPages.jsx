import React, { useState, useEffect } from 'react';
import { customerPortalService } from '../../services/customerPortalService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LoadingSpinner, ErrorState } from '../../components/common/FeedbackStates';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { FormInput, SelectInput, TextareaInput } from '../../components/forms/FormControls';
import { formatDate } from '../../utils/formatters';

export const CustomerProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerPortalService.getProfile()
      .then((res) => {
        if (res.success) setProfile(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading customer profile..." />;

  const cust = profile?.customerRecord;

  return (
    <div className="fade-in pb-4" style={{ maxWidth: '800px' }}>
      <h4 className="fw-bold text-dark mb-1">My Customer Account Profile</h4>
      <p className="text-muted small mb-4">View your organizational account and associated contact record.</p>

      <div className="saas-card p-4 bg-white mb-4">
        <h5 className="fw-bold text-dark mb-3">Organization Details</h5>
        <div className="row g-3">
          <div className="col-sm-6">
            <span className="text-muted small">Company Name</span>
            <div className="fw-bold text-dark fs-6">{cust?.company_name || 'N/A'}</div>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small">Customer Identifier</span>
            <div className="font-monospace fw-bold text-primary">{cust?.customer_code || 'N/A'}</div>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small">Contact Email</span>
            <div className="fw-semibold text-dark">{cust?.email || user?.email}</div>
          </div>
          <div className="col-sm-6">
            <span className="text-muted small">Contact Phone</span>
            <div className="fw-semibold text-dark">{cust?.phone || user?.phone || '—'}</div>
          </div>
          <div className="col-12">
            <span className="text-muted small">Registered Address</span>
            <div className="text-secondary small">{cust?.address || 'No street address on file'}</div>
            <div className="text-secondary small">{cust?.city ? `${cust.city}, ${cust.state} ${cust.postal_code || ''}` : ''}</div>
          </div>
        </div>
      </div>

      <div className="saas-card p-4 bg-white">
        <h5 className="fw-bold text-dark mb-3">Dedicated Support Executive</h5>
        {cust?.rep_first_name ? (
          <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light border">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
              {cust.rep_first_name.charAt(0)}
            </div>
            <div>
              <div className="fw-bold text-dark">{cust.rep_first_name} {cust.rep_last_name}</div>
              <div className="text-primary small fw-semibold">{cust.rep_dept || 'Client Success'}</div>
              <div className="text-muted small"><i className="bi bi-envelope me-1"></i> {cust.rep_email}</div>
              <div className="text-muted small"><i className="bi bi-telephone me-1"></i> {cust.rep_phone}</div>
            </div>
          </div>
        ) : (
          <div className="text-muted small">An enterprise representative will be assigned to your account shortly.</div>
        )}
      </div>
    </div>
  );
};

export const CustomerRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Request Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await customerPortalService.getRequests();
      if (res.success) setRequests(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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
      showToast('success', 'Request Created', 'Your support ticket has been sent to our team.');
      setIsModalOpen(false);
      setSubject('');
      setMessage('');
      fetchRequests();
    } catch (err) {
      showToast('error', 'Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in pb-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Support & Service Requests</h4>
          <p className="text-muted small mb-0">Track all communication inquiries and replies from your account representative.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary-gradient btn-sm">
          <i className="bi bi-plus-lg me-1"></i> New Support Ticket
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Retrieving support tickets..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRequests} />
      ) : requests.length === 0 ? (
        <div className="saas-card text-center p-5 bg-white">
          <i className="bi bi-chat-left-dots fs-1 text-muted mb-2"></i>
          <h5 className="fw-bold text-dark mt-2">No Requests Logged</h5>
          <p className="text-muted small mb-3">Have a question or license expansion inquiry? Reach out to your support team.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary-gradient btn-sm">
            Submit Support Request
          </button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {requests.map((r) => (
            <div key={r.request_id} className="saas-card p-4 bg-white shadow-sm border">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h5 className="fw-bold text-dark mb-1">{r.subject}</h5>
                  <div className="text-muted small">
                    Ticket #{r.request_id} • Created: {formatDate(r.created_at, true)}
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${r.priority === 'URGENT' ? 'bg-danger text-white' : 'bg-secondary text-white'}`}>
                    {r.priority}
                  </span>
                  <StatusBadge status={r.status} />
                </div>
              </div>

              <div className="p-3 rounded-3 bg-light small text-secondary mb-3">
                {r.message}
              </div>

              {r.response ? (
                <div className="p-3 rounded-3 bg-success-subtle border border-success-subtle">
                  <div className="fw-bold text-success small mb-1">
                    <i className="bi bi-reply-fill me-1"></i> Response from {r.rep_first_name || 'Account Executive'}:
                  </div>
                  <div className="small text-dark">{r.response}</div>
                  <div className="text-muted small mt-2" style={{ fontSize: '0.72rem' }}>
                    Replied: {formatDate(r.responded_at, true)}
                  </div>
                </div>
              ) : (
                <div className="text-muted small fst-italic">
                  <i className="bi bi-hourglass-split me-1"></i> Awaiting reply from account representative...
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit New Support Inquiry"
        footer={
          <>
            <button className="btn btn-light btn-sm" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary-gradient btn-sm" onClick={handleCreateRequest} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Inquiry'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateRequest}>
          <FormInput
            label="Subject"
            id="reqSubj"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Schedule licensing expansion review"
            required
          />
          <SelectInput
            label="Priority"
            id="reqPrio"
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
            id="reqMsg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain your inquiry in detail..."
            rows={4}
            required
          />
        </form>
      </Modal>
    </div>
  );
};
