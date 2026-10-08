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
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form edit state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    company_name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'USA'
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await customerPortalService.getProfile();
      if (res.success && res.data) {
        setProfile(res.data);
        const c = res.data.customerRecord;
        const u = res.data.user || user;
        setFormData({
          first_name: u?.first_name || '',
          last_name: u?.last_name || '',
          phone: c?.phone || u?.phone || '',
          company_name: c?.company_name || `${u?.first_name}'s Enterprise`,
          address: c?.address || '',
          city: c?.city || '',
          state: c?.state || '',
          postal_code: c?.postal_code || '',
          country: c?.country || 'USA'
        });
      }
    } catch (err) {
      console.error('Error fetching customer profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await customerPortalService.updateProfile(formData);
      showToast('success', 'Profile Updated', 'Your customer account information has been saved.');
      setEditing(false);
      await loadProfile();
    } catch (err) {
      showToast('error', 'Update Failed', err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading customer account details..." />;

  const cust = profile?.customerRecord;
  const currentUser = profile?.user || user;

  return (
    <div className="fade-in pb-4" style={{ maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Customer Account Profile</h4>
          <p className="text-muted small mb-0">Manage your dynamic client identity, company data, and dedicated account manager.</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`btn btn-sm ${editing ? 'btn-secondary' : 'btn-primary-gradient'} fw-semibold px-3`}
        >
          <i className={`bi ${editing ? 'bi-x-lg' : 'bi-pencil-square'} me-1`}></i>
          {editing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      {/* Account Overview Header Card */}
      <div className="saas-card p-4 bg-white mb-4 shadow-sm">
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div
            className="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center shadow-sm"
            style={{ width: '64px', height: '64px', fontSize: '1.6rem' }}
          >
            {currentUser?.first_name?.charAt(0) || 'C'}
          </div>
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <h4 className="fw-bold text-dark mb-0">{currentUser?.first_name} {currentUser?.last_name}</h4>
              <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 small fw-semibold">
                CUSTOMER PORTAL
              </span>
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 small fw-semibold">
                {cust?.status || 'ACTIVE'}
              </span>
            </div>
            <div className="text-muted small mt-1">
              <i className="bi bi-building me-1"></i> {cust?.company_name || 'Organization Active'} • <i className="bi bi-envelope me-1"></i> {currentUser?.email}
            </div>
          </div>
          <div className="text-end">
            <span className="text-muted small d-block">Customer Code</span>
            <span className="badge bg-light text-primary font-monospace fs-6 px-3 py-2 border">
              {cust?.customer_code || `CUST-${1000 + (currentUser?.user_id || 1)}`}
            </span>
          </div>
        </div>
      </div>

      {editing ? (
        /* Edit Profile Form */
        <div className="saas-card p-4 bg-white mb-4 shadow-sm">
          <h5 className="fw-bold text-dark mb-3">
            <i className="bi bi-pencil me-2 text-primary"></i> Update Account Details
          </h5>
          <form onSubmit={handleSaveProfile}>
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
                  label="Contact Phone"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1-555-0199"
                  required
                />
              </div>
              <div className="col-sm-6">
                <FormInput
                  label="Company / Organization Name"
                  id="company"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>
              <div className="col-12">
                <FormInput
                  label="Office Address"
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="100 Market St, Suite 400"
                />
              </div>
              <div className="col-sm-4">
                <FormInput
                  label="City"
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="San Francisco"
                />
              </div>
              <div className="col-sm-4">
                <FormInput
                  label="State / Province"
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="CA"
                />
              </div>
              <div className="col-sm-4">
                <FormInput
                  label="Postal Code"
                  id="postalCode"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="94105"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn btn-outline-secondary btn-sm px-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-gradient btn-sm px-4 fw-semibold shadow-sm"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span> Saving Changes...
                  </>
                ) : (
                  'Save Account Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Dynamic View Profile Cards */
        <>
          <div className="saas-card p-4 bg-white mb-4 shadow-sm">
            <h5 className="fw-bold text-dark mb-3">
              <i className="bi bi-info-circle me-2 text-primary"></i> Organization & Contact Information
            </h5>
            <div className="row g-3">
              <div className="col-sm-6">
                <span className="text-muted small">Company Name</span>
                <div className="fw-bold text-dark fs-6">{cust?.company_name || 'Organization Registered'}</div>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Customer Identifier</span>
                <div className="font-monospace fw-bold text-primary">{cust?.customer_code || `CUST-${1000 + (currentUser?.user_id || 1)}`}</div>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Primary Email</span>
                <div className="fw-semibold text-dark">{currentUser?.email}</div>
              </div>
              <div className="col-sm-6">
                <span className="text-muted small">Primary Phone</span>
                <div className="fw-semibold text-dark">{cust?.phone || currentUser?.phone || 'Not Specified'}</div>
              </div>
              <div className="col-12">
                <span className="text-muted small">Registered Address</span>
                <div className="text-secondary small">{cust?.address || 'No street address on file'}</div>
                <div className="text-secondary small">
                  {cust?.city ? `${cust.city}, ${cust.state || ''} ${cust.postal_code || ''}` : 'Location details can be added via Edit Profile.'}
                </div>
              </div>
            </div>
          </div>

          <div className="saas-card p-4 bg-white mb-4 shadow-sm">
            <h5 className="fw-bold text-dark mb-3">
              <i className="bi bi-person-badge me-2 text-primary"></i> Dedicated Account Representative
            </h5>
            {cust?.rep_first_name ? (
              <div className="d-flex align-items-center gap-3 p-3 rounded-3 bg-light border">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm"
                  style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}
                >
                  {cust.rep_first_name.charAt(0)}
                </div>
                <div>
                  <div className="fw-bold text-dark">{cust.rep_first_name} {cust.rep_last_name}</div>
                  <div className="text-primary small fw-semibold">{cust.rep_dept || 'Client Success Operations'}</div>
                  <div className="text-muted small"><i className="bi bi-envelope me-1"></i> {cust.rep_email}</div>
                  <div className="text-muted small"><i className="bi bi-telephone me-1"></i> {cust.rep_phone || '+1-555-0103'}</div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-light rounded-3 text-muted small d-flex align-items-center gap-2">
                <i className="bi bi-clock-history fs-5 text-secondary"></i>
                <div>An enterprise sales & support representative will be assigned to coordinate your account.</div>
              </div>
            )}
          </div>
        </>
      )}
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
