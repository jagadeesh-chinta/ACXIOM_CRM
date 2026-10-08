import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import { LoadingSpinner, ErrorState } from '../../components/common/FeedbackStates';
import { StatusBadge } from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const CustomerDetailPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('opportunities');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await customerService.getCustomerById(id);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load customer profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading customer account details..." />;
  if (error) return <ErrorState message={error} />;
  if (!data || !data.customer) return null;

  const { customer, opportunities, followups, activities, requests } = data;

  return (
    <div className="fade-in pb-4">
      {/* Back button and title */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <Link to="/customers" className="btn btn-sm btn-light rounded-circle p-2" title="Back to Customers">
            <i className="bi bi-arrow-left"></i>
          </Link>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold text-dark mb-0">{customer.customer_name}</h4>
              <StatusBadge status={customer.status} />
            </div>
            <span className="text-muted small">
              {customer.company_name} • Code: <strong className="font-monospace">{customer.customer_code}</strong>
            </span>
          </div>
        </div>

        <div className="d-flex gap-2">
          <Link to="/opportunities" className="btn btn-sm btn-outline-primary">
            <i className="bi bi-briefcase me-1"></i> New Opportunity
          </Link>
          <Link to="/followups" className="btn btn-sm btn-primary-gradient">
            <i className="bi bi-calendar-plus me-1"></i> Schedule Follow-Up
          </Link>
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="saas-card p-3 h-100 bg-white">
            <span className="text-muted small fw-semibold text-uppercase">Contact Channel</span>
            <div className="mt-2">
              <div className="small"><i className="bi bi-envelope text-primary me-2"></i>{customer.email}</div>
              <div className="small mt-1"><i className="bi bi-telephone text-primary me-2"></i>{customer.phone}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="saas-card p-3 h-100 bg-white">
            <span className="text-muted small fw-semibold text-uppercase">Address & Territory</span>
            <div className="mt-2 small text-dark">
              <div>{customer.address || 'No street address specified'}</div>
              <div className="text-muted">{customer.city ? `${customer.city}, ${customer.state} ${customer.postal_code || ''}` : 'Location pending'}</div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="saas-card p-3 h-100 bg-white">
            <span className="text-muted small fw-semibold text-uppercase">Relationship Management</span>
            <div className="mt-2 small">
              <div>Assigned: <strong>{customer.assigned_first_name ? `${customer.assigned_first_name} ${customer.assigned_last_name}` : 'Unassigned'}</strong></div>
              <div className="text-muted mt-1">Client Since: {formatDate(customer.created_at)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="saas-card bg-white p-0 shadow-sm">
        <div className="p-3 border-bottom d-flex gap-2 bg-light rounded-top">
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`btn btn-sm ${activeTab === 'opportunities' ? 'btn-primary-gradient' : 'btn-light'}`}
          >
            Opportunities ({opportunities?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`btn btn-sm ${activeTab === 'followups' ? 'btn-primary-gradient' : 'btn-light'}`}
          >
            Follow-Ups ({followups?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`btn btn-sm ${activeTab === 'activities' ? 'btn-primary-gradient' : 'btn-light'}`}
          >
            Activity Timeline ({activities?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`btn btn-sm ${activeTab === 'requests' ? 'btn-primary-gradient' : 'btn-light'}`}
          >
            Support Requests ({requests?.length || 0})
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'opportunities' && (
            <div>
              {opportunities?.length === 0 ? (
                <div className="text-center py-4 text-muted small">No deals currently linked to this customer account.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table saas-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Opportunity Name</th>
                        <th>Amount</th>
                        <th>Stage</th>
                        <th>Probability</th>
                        <th>Close Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opportunities.map((opp) => (
                        <tr key={opp.opportunity_id}>
                          <td className="font-monospace fw-semibold">{opp.opportunity_code}</td>
                          <td className="fw-bold text-dark">{opp.opportunity_name}</td>
                          <td className="fw-bold text-success">{formatCurrency(opp.amount)}</td>
                          <td><StatusBadge status={opp.stage} /></td>
                          <td>{opp.probability}%</td>
                          <td className="small text-muted">{formatDate(opp.expected_close_date)}</td>
                          <td><StatusBadge status={opp.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'followups' && (
            <div>
              {followups?.length === 0 ? (
                <div className="text-center py-4 text-muted small">No follow-ups recorded for this customer.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table saas-table">
                    <thead>
                      <tr>
                        <th>Date & Time</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Assigned Rep</th>
                      </tr>
                    </thead>
                    <tbody>
                      {followups.map((fu) => (
                        <tr key={fu.followup_id}>
                          <td className="fw-semibold text-dark">{formatDate(fu.followup_date, true)}</td>
                          <td><span className="badge bg-primary-subtle text-primary">{fu.followup_type}</span></td>
                          <td><StatusBadge status={fu.status} /></td>
                          <td className="small text-secondary">{fu.remarks || '—'}</td>
                          <td className="small text-muted">{fu.assigned_first_name ? `${fu.assigned_first_name} ${fu.assigned_last_name}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div>
              {activities?.length === 0 ? (
                <div className="text-center py-4 text-muted small">No activities logged yet.</div>
              ) : (
                <div className="list-group list-group-flush">
                  {activities.map((act) => (
                    <div key={act.activity_id} className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle bg-light p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                          <i className={`bi ${act.activity_type === 'CALL' ? 'bi-telephone' : act.activity_type === 'MEETING' ? 'bi-camera-video' : 'bi-envelope'}`}></i>
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{act.subject}</div>
                          <div className="text-muted small">{act.description || 'No description logged'}</div>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="small text-muted">{formatDate(act.activity_date, true)}</div>
                        <StatusBadge status={act.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              {requests?.length === 0 ? (
                <div className="text-center py-4 text-muted small">No client service requests open.</div>
              ) : (
                <div className="list-group list-group-flush">
                  {requests.map((req) => (
                    <div key={req.request_id} className="list-group-item px-0 py-3">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="fw-bold text-dark">{req.subject}</div>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-secondary small mb-2">{req.message}</p>
                      {req.response && (
                        <div className="p-2 px-3 rounded-3 bg-light border-start border-3 border-success small text-secondary">
                          <strong>Agent Reply:</strong> {req.response}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
