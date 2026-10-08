import React, { useState, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { followupService } from '../services/followupService';
import { DashboardCard } from '../components/common/DashboardCard';
import { LoadingSpinner, ErrorState } from '../components/common/FeedbackStates';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';

export const SalesExecutiveDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getSalesDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load sales workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCompleteFollowup = async (id) => {
    try {
      await followupService.updateFollowup(id, { status: 'COMPLETED' });
      showToast('success', 'Follow-up Completed', 'Follow-up marked completed and activity logged automatically.');
      fetchStats();
    } catch (err) {
      showToast('error', 'Error', err.message);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your personalized sales workspace..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!data) return null;

  const { kpis, salesWorkspace } = data;

  return (
    <div className="fade-in pb-4">
      {/* Top Banner with Quick Actions */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">My Sales Workspace</h4>
          <p className="text-muted small mb-0">High-priority hot leads, today's client meetings, and pipeline deals.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Link to="/leads" className="btn btn-primary-gradient btn-sm">
            <i className="bi bi-funnel me-1"></i> View Leads Queue
          </Link>
          <Link to="/followups" className="btn btn-outline-primary btn-sm">
            <i className="bi bi-calendar-plus me-1"></i> Schedule Follow-Up
          </Link>
          <button onClick={fetchStats} className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="My Active Pipeline"
            value={formatCurrency(kpis.myPipeline)}
            icon="bi-briefcase-fill"
            iconBg="bg-primary-subtle"
            iconColor="text-primary"
            subtext={`${kpis.myOpenOpportunities} open opportunities`}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="My Assigned Leads"
            value={kpis.myLeads}
            icon="bi-funnel-fill"
            iconBg="bg-info-subtle"
            iconColor="text-info"
            subtext="Inbound prospects"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Pending Follow-Ups"
            value={kpis.pendingFollowUps}
            icon="bi-calendar-check"
            iconBg="bg-warning-subtle"
            iconColor="text-warning"
            subtext="Calls & demos to complete"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Closed Won Revenue"
            value={formatCurrency(kpis.wonRevenue)}
            icon="bi-trophy-fill"
            iconBg="bg-success-subtle"
            iconColor="text-success"
            subtext={`${kpis.wonOpportunities} closed deals`}
          />
        </div>
      </div>

      {/* TODAY'S PRIORITY FOLLOW-UPS SECTION */}
      <div className="saas-card p-4 mb-4 border-warning-subtle bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-warning-subtle text-warning p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
              <i className="bi bi-bell-fill fs-5"></i>
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0">Today's Scheduled Follow-Ups</h5>
              <span className="text-muted small">Execute interactions due today to keep prospect momentum</span>
            </div>
          </div>
          <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-1">
            {salesWorkspace.todaysFollowUps?.length || 0} Scheduled For Today
          </span>
        </div>

        {salesWorkspace.todaysFollowUps?.length === 0 ? (
          <div className="text-center py-3 text-muted small">
            <i className="bi bi-check-circle text-success me-1"></i> No remaining follow-ups due today! You are all caught up.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table saas-table mb-0">
              <thead>
                <tr>
                  <th>Time & Type</th>
                  <th>Contact / Company</th>
                  <th>Deal / Subject</th>
                  <th>Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {salesWorkspace.todaysFollowUps.map((fu) => (
                  <tr key={fu.followup_id}>
                    <td>
                      <span className="badge bg-primary-subtle text-primary me-2">
                        <i className={`bi ${fu.followup_type === 'CALL' ? 'bi-telephone' : fu.followup_type === 'MEETING' ? 'bi-camera-video' : 'bi-envelope'} me-1`}></i>
                        {fu.followup_type}
                      </span>
                      <span className="small text-muted">{formatDate(fu.followup_date, true)}</span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{fu.customer_name || fu.lead_name}</div>
                      <div className="text-muted small">{fu.customer_phone || fu.lead_phone}</div>
                    </td>
                    <td>
                      <span className="text-dark small">{fu.opportunity_name || 'Prospect Qualification'}</span>
                    </td>
                    <td className="text-secondary small">{fu.remarks || 'No remarks provided'}</td>
                    <td>
                      <button
                        onClick={() => handleCompleteFollowup(fu.followup_id)}
                        className="btn btn-sm btn-success px-3"
                      >
                        <i className="bi bi-check2 me-1"></i> Mark Done
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TWO COLUMN WORKSPACE: HOT LEADS & HIGH VALUE DEALS */}
      <div className="row g-4">
        {/* Hot Leads Column */}
        <div className="col-lg-6">
          <div className="saas-card p-4 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="badge-hot"><i className="bi bi-fire"></i> Priority Hot Leads</span>
              </div>
              <Link to="/leads" className="small text-primary text-decoration-none fw-semibold">
                View All Leads
              </Link>
            </div>

            {salesWorkspace.hotLeads?.length === 0 ? (
              <div className="text-center py-4 text-muted small">No hot leads assigned right now.</div>
            ) : (
              <div className="list-group list-group-flush">
                {salesWorkspace.hotLeads.map((ld) => (
                  <div key={ld.lead_id} className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-dark">{ld.lead_name}</div>
                      <div className="text-muted small">{ld.company_name} • Source: {ld.source}</div>
                      <div className="text-primary fw-bold small mt-1">{formatCurrency(ld.expected_value)} Value</div>
                    </div>
                    <div className="text-end">
                      <StatusBadge status={ld.status} />
                      <div className="mt-2">
                        <Link to={`/leads/${ld.lead_id}`} className="btn btn-sm btn-outline-primary py-0 px-2 small">
                          Open Lead
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* High-Value Opportunities Column */}
        <div className="col-lg-6">
          <div className="saas-card p-4 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-primary text-white rounded-pill px-3 py-1 small fw-bold">
                  <i className="bi bi-currency-dollar"></i> Top Opportunities
                </span>
              </div>
              <Link to="/opportunities" className="small text-primary text-decoration-none fw-semibold">
                View Pipeline
              </Link>
            </div>

            {salesWorkspace.highValueOpportunities?.length === 0 ? (
              <div className="text-center py-4 text-muted small">No active deals in flight.</div>
            ) : (
              <div className="list-group list-group-flush">
                {salesWorkspace.highValueOpportunities.map((opp) => (
                  <div key={opp.opportunity_id} className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-bold text-dark">{opp.opportunity_name}</div>
                      <div className="text-muted small">{opp.customer_name} • {opp.company_name}</div>
                      <div className="fw-bold text-success mt-1">{formatCurrency(opp.amount)}</div>
                    </div>
                    <div className="text-end">
                      <StatusBadge status={opp.stage} />
                      <div className="text-muted small mt-1">Win Prob: {opp.probability}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
