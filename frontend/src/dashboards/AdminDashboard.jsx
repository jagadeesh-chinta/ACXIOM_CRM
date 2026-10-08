import React, { useState, useEffect } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import '../utils/chartConfig';
import { dashboardService } from '../services/dashboardService';
import { DashboardCard, ChartCard } from '../components/common/DashboardCard';
import { LoadingSpinner, ErrorState } from '../components/common/FeedbackStates';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../utils/formatters';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getAdminDashboard();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating real-time database metrics..." />;
  if (error) return <ErrorState message={error} onRetry={fetchStats} />;
  if (!data) return null;

  const { kpis, charts, securityCenter, recentActivities } = data;

  // 1. Lead Status Doughnut Chart
  const leadChartData = {
    labels: charts.leadStatus.map((item) => item.status),
    datasets: [
      {
        data: charts.leadStatus.map((item) => item.count),
        backgroundColor: ['#6366f1', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#94a3b8'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // 2. Opportunity Stage Bar Chart
  const oppChartData = {
    labels: charts.oppStage.map((item) => item.stage),
    datasets: [
      {
        label: 'Pipeline Value ($)',
        data: charts.oppStage.map((item) => item.total_amount),
        backgroundColor: '#4f46e5',
        borderRadius: 8
      }
    ]
  };

  // 3. Monthly Sales Line Chart
  const salesChartData = {
    labels: charts.monthlySales.map((item) => item.month),
    datasets: [
      {
        label: 'Won Revenue ($)',
        data: charts.monthlySales.map((item) => item.total_sales),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.35,
        fill: true,
        pointRadius: 5
      }
    ]
  };

  return (
    <div className="fade-in pb-4">
      {/* Top Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold text-dark mb-1">Executive Administration Dashboard</h4>
          <p className="text-muted small mb-0">System-wide operational analytics and security surveillance.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-success-subtle text-success p-2 px-3 rounded-pill fw-semibold small">
            <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.55rem' }}></i> MySQL Pool Active
          </span>
          <button onClick={fetchStats} className="btn btn-sm btn-outline-secondary">
            <i className="bi bi-arrow-clockwise me-1"></i> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Total Users"
            value={kpis.totalUsers}
            icon="bi-people"
            iconBg="bg-primary-subtle"
            iconColor="text-primary"
            subtext={`${securityCenter.activeUsers} active accounts`}
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Total Customers"
            value={kpis.totalCustomers}
            icon="bi-buildings"
            iconBg="bg-info-subtle"
            iconColor="text-info"
            subtext="Enterprise clients"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Total Pipeline"
            value={formatCurrency(kpis.totalPipelineValue)}
            icon="bi-currency-dollar"
            iconBg="bg-success-subtle"
            iconColor="text-success"
            subtext={`Weighted: ${formatCurrency(kpis.totalWeightedValue)}`}
            trend="+14%"
          />
        </div>
        <div className="col-sm-6 col-xl-3">
          <DashboardCard
            title="Pending Follow-Ups"
            value={kpis.pendingFollowUps}
            icon="bi-calendar-event"
            iconBg="bg-warning-subtle"
            iconColor="text-warning"
            subtext="Actionable touchpoints"
          />
        </div>
      </div>

      {/* Secondary KPI Row */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="saas-card p-3 text-center">
            <span className="text-muted small">Total Leads</span>
            <h4 className="fw-bold text-dark mt-1 mb-0">{kpis.totalLeads}</h4>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="saas-card p-3 text-center border-info-subtle">
            <span className="text-muted small">Open Opportunities</span>
            <h4 className="fw-bold text-info mt-1 mb-0">{kpis.openOpportunities}</h4>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="saas-card p-3 text-center border-success-subtle">
            <span className="text-muted small">Won Deals</span>
            <h4 className="fw-bold text-success mt-1 mb-0">{kpis.wonOpportunities}</h4>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="saas-card p-3 text-center border-danger-subtle">
            <span className="text-muted small">Lost Deals</span>
            <h4 className="fw-bold text-danger mt-1 mb-0">{kpis.lostOpportunities}</h4>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        <div className="col-lg-4">
          <ChartCard title="Lead Distribution" subtitle="Pipeline by current qualification status">
            <div style={{ height: '260px' }} className="d-flex align-items-center justify-content-center">
              <Doughnut
                data={leadChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
                }}
              />
            </div>
          </ChartCard>
        </div>

        <div className="col-lg-4">
          <ChartCard title="Pipeline by Stage" subtitle="Total opportunity value in each phase">
            <div style={{ height: '260px' }}>
              <Bar
                data={oppChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { ticks: { font: { size: 10 } } },
                    y: { ticks: { callback: (v) => `$${v / 1000}k` } }
                  }
                }}
              />
            </div>
          </ChartCard>
        </div>

        <div className="col-lg-4">
          <ChartCard title="Won Revenue Trend" subtitle="Monthly closed-won revenue performance">
            <div style={{ height: '260px' }}>
              <Line
                data={salesChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { ticks: { callback: (v) => `$${v / 1000}k` } }
                  }
                }}
              />
            </div>
          </ChartCard>
        </div>
      </div>

      {/* UNIQUE ADMIN FEATURE: SYSTEM HEALTH & SECURITY CENTER */}
      <div className="saas-card p-4 mb-4 border-primary-subtle bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="rounded-circle bg-danger-subtle text-danger p-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <div>
              <h5 className="fw-bold text-dark mb-0">System Health & Security Center</h5>
              <span className="text-muted small">Live threat surveillance and database diagnostics</span>
            </div>
          </div>
          <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2">
            Status: {securityCenter.databaseStatus}
          </span>
        </div>

        <div className="row g-3 mb-3">
          <div className="col-md-3">
            <div className="p-3 rounded-3 bg-light border">
              <span className="text-muted small fw-medium">Active User Sessions</span>
              <div className="h4 fw-bold text-dark mb-0 mt-1">{securityCenter.activeUsers}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 rounded-3 bg-light border">
              <span className="text-muted small fw-medium">Locked Accounts</span>
              <div className="h4 fw-bold text-danger mb-0 mt-1">{securityCenter.lockedAccounts}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 rounded-3 bg-light border">
              <span className="text-muted small fw-medium">Server Uptime</span>
              <div className="h4 fw-bold text-dark mb-0 mt-1">{Math.floor(securityCenter.uptime / 60)} mins</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="p-3 rounded-3 bg-light border">
              <span className="text-muted small fw-medium">Security Audits Logged</span>
              <div className="h4 fw-bold text-primary mb-0 mt-1">{securityCenter.recentAuditActivities?.length || 0}+</div>
            </div>
          </div>
        </div>

        {/* Recent Audit Activities Stream */}
        <div className="mt-3">
          <h6 className="fw-bold text-dark small text-uppercase tracking-wider mb-2">Recent Security & Audit Trail Events</h6>
          <div className="table-responsive">
            <table className="table table-sm saas-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Actor Email</th>
                  <th>IP Address</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {securityCenter.recentAuditActivities?.map((a) => (
                  <tr key={a.audit_log_id}>
                    <td>
                      <span className={`badge ${a.action.includes('LOGIN') ? 'bg-info-subtle text-info' : a.action.includes('FAIL') ? 'bg-danger text-white' : 'bg-primary-subtle text-primary'}`}>
                        {a.action}
                      </span>
                    </td>
                    <td className="fw-semibold">{a.entity_name}</td>
                    <td className="small text-muted">{a.email || 'System'}</td>
                    <td className="font-monospace small">{a.ip_address}</td>
                    <td className="small text-muted">{formatDate(a.created_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="saas-card p-4">
        <h5 className="fw-bold text-dark mb-3">Recent Team Engagement Activities</h5>
        <div className="list-group list-group-flush">
          {recentActivities.map((act) => (
            <div key={act.activity_id} className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3">
                <div className="rounded-circle bg-primary-subtle text-primary p-2 d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
                  <i className={`bi ${act.activity_type === 'CALL' ? 'bi-telephone' : act.activity_type === 'MEETING' ? 'bi-camera-video' : 'bi-envelope'}`}></i>
                </div>
                <div>
                  <div className="fw-semibold text-dark">{act.subject}</div>
                  <div className="text-muted small">
                    {act.customer_name ? `Customer: ${act.customer_name}` : 'General Activity'} • Agent: {act.first_name} {act.last_name}
                  </div>
                </div>
              </div>
              <div className="text-end">
                <StatusBadge status={act.status} />
                <div className="text-muted small mt-1">{formatDate(act.activity_date, true)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
